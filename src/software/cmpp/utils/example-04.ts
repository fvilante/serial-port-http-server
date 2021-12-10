import { CMPP00LG, LigadoDesligado } from "../transport/memmap-CMPP00LG"
import { explodeTunnel, isReferenced, makeTunnel } from "./core"
import { forceLooseReference } from "./force-loose-reference"
import ora, { Spinner } from 'ora'
import { doReferenceIfNecessary, forceReference, isReferencing, ReferenceParameters } from "./reference"
import { isStoped, start, waitToStop, waitToStopThenStart } from "./start"
import { Pulses, PulsesPerTick, PulsesPerTickSquared, Pulses_, TicksOfClock } from "../transport/memmap-types"
import { delay } from "../../core/delay"
import { Tunnel } from "./detect-cmpp"
import { executeInSequence } from "../../core/promise-utils"
import { getPosicaoAtual } from "./get-pos-atual"

const makeAxis_ = CMPP00LG

type EventHandler = {
    onStart: () => void
    onStop: () => void
}

type MainParameters = {
    'Posicao inicial': Pulses
    'Posicao final': Pulses
    'Velocidade de avanco': PulsesPerTick
    'Velocidade de retorno': PulsesPerTick
    'Aceleracao de avanco': PulsesPerTickSquared
    'Aceleracao de retorno': PulsesPerTickSquared
    'Start automatico no avanco': LigadoDesligado
    'Start automatico no retorno': LigadoDesligado
    'Tempo para o start automatico': TicksOfClock
    'Reducao do nivel de corrente em repouso': LigadoDesligado
}

export type AxisControler = ReturnType<typeof makeAxisControler> 

export const makeAxisControler = (arg: { tunnel: Tunnel, driver: typeof makeAxis_, handler?: EventHandler}) => {
    const { tunnel, driver, handler} = arg
    const { path, baudRate, channel} = explodeTunnel(tunnel)
    const axis = makeAxis_(tunnel)
    const args = [tunnel, makeAxis_] as const

    const defaultReferenceParameters: ReferenceParameters = {
        "Velocidade de referencia": PulsesPerTick(600),
        "Aceleracao de referencia": PulsesPerTickSquared(5000),
    }

    return {
        start: async () => {
            return await start(...args)
        },
        waitToStop: async () => {
            return await waitToStop(...args)
        },
        isReferencing: async () => {
            return await isReferencing(...args) 
        },
        isReferenced: async () => {
            return await isReferenced(...args)
        },
        isStoped: async () => {
            return await isStoped(...args)
        },
        forceReference: async (program: Partial<ReferenceParameters> = defaultReferenceParameters) => {
            const program_ = {...defaultReferenceParameters, ...program}
            return await forceReference(...args, program_)   
        },
        forceLooseReference: async () => {
            return await forceLooseReference(...args)
        },
        doReferenceIfNecessary: async (program: ReferenceParameters = defaultReferenceParameters) => {
            return await doReferenceIfNecessary(...args, program)
        },
        setMainParameters: async (parameters: Partial<MainParameters>) => {
            const keys = Object.keys(parameters) as readonly (keyof MainParameters)[]
            return await executeInSequence(keys.map( key => {
                const value = parameters[key]
                if (value!==undefined) {
                    return () => axis.set(key,value)
                } else {
                    throw new Error('This branch should never happen')
                }
            }))
        },

        getMainParameters: async (): Promise<MainParameters> => {
            const fetch = async(): Promise<MainParameters> => {
                return {
                    'Posicao inicial': await axis.get('Posicao inicial'),
                    'Posicao final': await axis.get('Posicao final'),
                    'Velocidade de avanco':await axis.get('Velocidade de avanco'),
                    'Velocidade de retorno': await axis.get('Velocidade de retorno'),
                    'Aceleracao de avanco': await axis.get('Aceleracao de avanco'),
                    'Aceleracao de retorno': await axis.get('Aceleracao de retorno'),
                    'Start automatico no avanco': await axis.get('Start automatico no avanco'),
                    'Start automatico no retorno': await axis.get('Start automatico no retorno'),
                    'Tempo para o start automatico': await axis.get('Tempo para o start automatico'),
                    'Reducao do nivel de corrente em repouso': await axis.get('Reducao do nivel de corrente em repouso'),
                }
            }
            return fetch()
        },
        getCurrentPosition: async () => {
            const pos = await getPosicaoAtual(path, baudRate, channel) 
            return Pulses(pos) 
        },
        // TODO: decide if the private mark of this functions should be removed
        __set: axis.set,
        __get: axis.get,
    }

}


const run = async () => {

    // config
    
    const tunnel = makeTunnel('com50', 9600, 0)
    // 
    const axis = makeAxisControler({tunnel, driver: makeAxis_})
    //

    type Kinematics = {
        speed: PulsesPerTick
        acceleration: PulsesPerTickSquared
    }

    type Moviment = {
        position: Pulses
    } & Kinematics

    // VERY IMPORTANT: parameter 'endPosition' represents the position where the reference procedure will delivery the motor.
    //                 If this number is greater than 1292 pulses, the cmpp microcnotroler will truncate it to 1292
    const forceSmartReference = async (arg: {reference: Kinematics, endPosition: Pulses}) => {
        const { reference, endPosition } = arg

        //stop motor imediatelly
        await axis.forceLooseReference()
        //save previous parameters
        //const saved = await axis.getMainParameters()
        //configure next moviment
        await axis.setMainParameters({
            "Posicao inicial": endPosition,
            "Posicao final": Pulses(endPosition.value+10), // defined here just to assure it is a valid position and it is different of "Posicao Inicial"
            //TODO: CAN I avoid send both (avanco and retorno) given just one of them will really be necessary?
            "Velocidade de avanco": reference.speed,
            "Velocidade de retorno": reference.speed,
            "Aceleracao de avanco": reference.acceleration,
            "Aceleracao de retorno": reference.acceleration,
        })
        // perform reference proccess
        await axis.forceReference({
            "Velocidade de referencia": reference.speed,
            "Aceleracao de referencia": reference.acceleration,
        })
    }

    const goNext = async (next: Moviment) => {
        await setNext(next)
        await axis.start()
        await axis.waitToStop()
    }

    const setNext = async (next: Moviment) => {
        await axis.setMainParameters({
            "Posicao final": next.position,
            //TODO: There should be a way looking startL.direcao to decide whether to use 'avanco' or 'retorno' to perform next moviment. This should increse performance.
            "Velocidade de avanco": next.speed,
            "Velocidade de retorno": next.speed,
            "Aceleracao de avanco": next.acceleration,
            "Aceleracao de retorno": next.acceleration,
        })
    }

    const goNextRelative = async (step: Moviment) => {
        await setNextRelative(step)
        await axis.start()
        await axis.waitToStop()
    }

    const setNextRelative = async (step: Moviment) => {
        const currentPosition = await axis.getCurrentPosition()
        const nextPosition = Pulses_.add(currentPosition, step.position)
        const nextMoviment = {...step, position: nextPosition}
        await axis.setMainParameters({
            "Posicao final": nextMoviment.position,
            //TODO: There should be a way looking startL.direcao to decide whether to use 'avanco' or 'retorno' to perform next moviment. This should increse performance.
            "Velocidade de avanco": nextMoviment.speed,
            "Velocidade de retorno": nextMoviment.speed,
            "Aceleracao de avanco": nextMoviment.acceleration,
            "Aceleracao de retorno": nextMoviment.acceleration,
        })
    }


    const goMany = async (many: Iterable<Moviment>) => {
        const iter = many[Symbol.iterator]()
        let next = iter.next()
        while(!next.done) {
            //TODO: Should detect if motor has stoped or aborted their mission, loose reference, etc.
            //      If yes should make possible to return sequence from where it became interrupted
            await setNext(next.value)
            await axis.start()
            await axis.waitToStop()
            next = iter.next()
        }

    }

    type DetecEndOfCourseParameters = {
        referencePhase: {
            reference: Kinematics,
            endPosition: Pulses,
        }
        searchPhase: {
            startAt: Moviment
            advancingKinematics: Kinematics
            advancingSteps: Pulses
        }
    }

    const detectEndOfCourse = async (args: DetecEndOfCourseParameters): Promise<Pulses> => {
        const { referencePhase, searchPhase} = args
        const { reference, endPosition} = referencePhase
        await forceSmartReference(referencePhase)
        await goNext(searchPhase.startAt)

        const firstApproximation = async (amount: Pulses, kinematics: Kinematics): Promise<Pulses> => {  
            while ( await axis.isReferenced()) {
                // 1 advancement step forward
                await setNextRelative({position: amount, ...kinematics})
                await axis.start()
                await axis.waitToStop()
            }
            return await axis.getCurrentPosition()
        }

        const secondApproximation = async (firstApproximation: Pulses): Promise<Pulses> => {
            const estimatedNumberOfPulsesPerMotorRevolution = 400
            const safetyFactor = 1.2
            const delta = Pulses(estimatedNumberOfPulsesPerMotorRevolution * safetyFactor)
            const result = Pulses_.subtract(firstApproximation, delta)
            return result
        }

        /*const thirdApproximation = async (secondApproximation_: Pulses ): Promise<Pulses> => {
            await forceSmartReference(referencePhase)
        }*/

        const performDetectionAlorithm = async () => {
            const firstApprox = await firstApproximation(searchPhase.advancingSteps, searchPhase.advancingKinematics)
            const secondApprox = secondApproximation(firstApprox)
            //await forceSmartReference(referencePhase)
            return secondApprox
        }

        const response = await performDetectionAlorithm()
        
        return response 

    }

    const goManyFast = async (many: Iterable<Moviment>) => {
        const iter = many[Symbol.iterator]()
        let next = iter.next()
        while(!next.done) {
            //TODO: Should detect if motor has stoped or aborted their mission, loose reference, etc.
            //      If yes should make possible to return sequence from where it became interrupted
            await setNext(next.value)
            await axis.start()
            // early configure next
            const early = iter.next()
            await setNext(early.value)
            //TODO: For very near positions the second start may be lost. Test and verify roboustness in this particular use case
            await axis.start() // early accumulate next start
            //TODO: THE PROBLEM IS THAT WHEN AUTOMATIC START IS GIVEN MOTOR DO NOT SIGNAL THE STOP.
            //      I SHOULD DEVELOP AN ALGORITM TO DETECT THIS END OF MOVIMENT USING OTHER FLAGS OF STATUSL
            await axis.waitToStop() // first moviment
        }

    }

    const resetMainParameters = async () => {
        return await axis.setMainParameters({
            'Posicao inicial': Pulses(1000),
            'Posicao final': Pulses(1100),
            'Velocidade de avanco': PulsesPerTick(1000),
            'Velocidade de retorno': PulsesPerTick(1000),
            'Aceleracao de avanco': PulsesPerTickSquared(3000),
            'Aceleracao de retorno': PulsesPerTickSquared(3000),
            'Start automatico no avanco': 'desligado',
            'Start automatico no retorno': 'desligado',
            'Tempo para o start automatico': TicksOfClock(10),
            'Reducao do nivel de corrente em repouso': 'ligado',
        })
    }

    // --------------

    const config = {
        referencePhase: {
            reference: {
                speed: PulsesPerTick(500),
                acceleration: PulsesPerTickSquared(5000),
            },
            endPosition: Pulses(500)    //NOTE: This value may be variable in function of mechanics of the axis
        },
        searchPhase: {
            startAt: {
                position: Pulses(3000),
                speed: PulsesPerTick(3000),
                acceleration: PulsesPerTickSquared(5000)
            },
            advancingSteps: Pulses(400), // TODO: que tal pulsos por giro aqui ? 
            advancingKinematics: {
                speed: PulsesPerTick(6000),
                acceleration: PulsesPerTickSquared(12000)
            }
        }
    }

    const runRoutine = async () => {
        const spinner = ora().start()
        spinner.text = 'resetando parametros...'
        await resetMainParameters()
    
        spinner.text = 'detectando curso do motor...'
        const lastPosition = await detectEndOfCourse(config)
    
        spinner.text = `Confirmando curso do motor detectado: ${lastPosition.value} ${lastPosition.unitOfMeasurement}`
    
        await forceSmartReference(config.referencePhase)
        await goNext({...config.searchPhase.advancingKinematics, position: lastPosition})
        await goNext({...config.searchPhase.advancingKinematics, position: config.referencePhase.endPosition})
        await goNext({...config.searchPhase.advancingKinematics, position: lastPosition})
        await goNext({...config.searchPhase.advancingKinematics, position: config.referencePhase.endPosition})
        spinner.succeed(`Confirmado! curso do motor detectado: ${lastPosition.value} ${lastPosition.unitOfMeasurement}`)
        spinner.stop()
    }

    for (let k=0; k<10; k++ ) {
        await runRoutine()
    }

    

    

}

run()