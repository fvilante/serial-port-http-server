import { CMPP00LG, LigadoDesligado } from "../transport/memmap-CMPP00LG"
import { explodeTunnel, Kinematics, makeTunnel, Moviment } from "../controlers/core"
import { forceLooseReference } from "../controlers/utils/force-loose-reference"
import ora, { Spinner } from 'ora'
import { doReferenceIfNecessary, forceReference, isReferenced, isReferencing, ReferenceParameters } from "../controlers/utils/reference"
import { isStoped, start, waitToStop, waitToStopThenStart } from "../controlers/utils/start"
import { Pulses, PulsesPerTick, PulsesPerTickSquared, Pulses_, TicksOfClock } from "../transport/memmap-types"
import { delay } from "../../core/delay"
import { Tunnel } from "./detect-cmpp"
import { executeInSequence } from "../../core/promise-utils"
import { getPosicaoAtual } from "../controlers/utils/get-pos-atual"
import { estimateMovimentEvents } from "../controlers/utils/moviment-status"
import { now, random, Timer__ } from "../../core/utils"
import { makeAxisControler } from "../controlers/axis-controler"
import { doSmartReferenceIfNecessary, forceSmartReference } from "../controlers/utils/smart-reference"

const makeAxis_ = CMPP00LG



const run = async () => {

    // config
    
    const tunnel = makeTunnel('com50', 9600, 0)
    // 
    const axis = makeAxisControler(tunnel)
    //


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
        let lastDelta: number = 0
        while(!next.done) {
            //TODO: Should detect if motor has stoped or aborted their mission, loose reference, etc.
            //      If yes should make possible to return sequence from where it became interrupted
            await setNext(next.value)
            await axis.start()
            const { totalTime } = estimateMovimentEvents(next.value)
            const t1 = now()
            await axis.waitToStop()
            const t2 = now()
            const currentDelta = t2-t1
            const diff = lastDelta - currentDelta
            console.log('current delta=',currentDelta,'  ', 'diff=', diff)
            lastDelta = currentDelta
            next = iter.next()
        }

    }
    

    type DetecEndOfCourseParameters = {
        referencePhase: {
            reference: Kinematics,  // kinematics of reference
            endPosition: Pulses,    // where the cursor will be after the end of reference phase
        }
        searchPhase: {
            startAt: Moviment   // you may start near your best guess, instead of from zero
            endSearchAt: Pulses // but eventually if you not reach never the end, you can consider to not go so far then about 'endSearchAt'. 
            advancingSteps: Pulses // how many steps to advance
            advancingKinematics: Kinematics // what kinematics to advance
            
        }
    }

    const detectEndOfCourse = async (args: DetecEndOfCourseParameters): Promise<Pulses> => {
        const { referencePhase, searchPhase} = args
        const { reference, endPosition} = referencePhase
        await forceSmartReference(axis,referencePhase)
        await goNext(searchPhase.startAt)

        const firstApproximation = async (amount: Pulses, kinematics: Kinematics): Promise<Pulses> => {  
            const isNotVeryLargeCourse = async () => (await axis.getCurrentPosition()).value <= searchPhase.endSearchAt.value
            while ( await axis.isReferenced() && await isNotVeryLargeCourse()) {
                // 1 advancement step forward
                await setNextRelative({position: amount, ...kinematics})
                await axis.start()
                await axis.waitToStop()
            }
            const result = await axis.getCurrentPosition()
            return result
        }

        const secondApproximation = async (firstApproximation: Pulses): Promise<Pulses> => {
            const estimatedNumberOfPulsesPerMotorRevolution = 400
            const safetyFactor = 1.2 // TODO: this factor was arbitrary defined, verify if it can be computated from any concrete parameter
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
            'Start automatico no retorno': 'ligado',
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
            endSearchAt: Pulses(15000),
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
        await doSmartReferenceIfNecessary(axis,config.referencePhase)

        function* generator():Generator<Moviment, void, unknown> {
            let counter = 0
            while (counter++ < 15) {
                const nextPos = random(1000, 6000)
                const nextVelocity = random(3000, 5000)
                const nextAcceleration = random(5000, 9000)

                yield( {
                    position: Pulses(nextPos),
                    speed: PulsesPerTick(nextVelocity),
                    acceleration: PulsesPerTickSquared(nextAcceleration),
                })
            }
            
        }

        await goMany(generator())
        await delay(15000)
    }

    for (let k=0; k<3; k++ ) {
        await runRoutine()
    }

    

    

}

run()