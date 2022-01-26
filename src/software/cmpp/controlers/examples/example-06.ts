import ora, { Spinner } from 'ora'
import { Pulses, PulsesPerTick, PulsesPerTickSquared, TicksOfClock } from "../../physical-dimensions/physical-dimensions"
import { CmppControler, makeCmppControler } from "../cmpp-controler"
import { Kinematics, Moviment, PositionInPulses } from "../core"
import { makeTunnel } from '../../transport/tunnel'
import { AxisControler } from '../axis-controler'
import { DetecEndOfCourseParameters } from '../utils/detect-end-of-course'
import { COMM_Port } from '../../../enviroment'



const run = async () => {

    // config
    const tunnel = makeTunnel(COMM_Port.z, 9600, 0)
    const cmppControler = makeCmppControler(tunnel)

    const resetMainParameters = async () => {
        return await cmppControler.setParameters({
            'Posicao inicial': Pulses(1000),
            'Posicao final': Pulses(1100),
            'Velocidade de avanco': PulsesPerTick(1000),
            'Velocidade de retorno': PulsesPerTick(1000),
            'Aceleracao de avanco': PulsesPerTickSquared(3000),
            'Aceleracao de retorno': PulsesPerTickSquared(3000),
            'Start automatico no avanco': 'desligado',
            'Start automatico no retorno': 'ligado',
            'Tempo para o start automatico': TicksOfClock(10),
            'Reducao da corrente em repouso': 'ligado',
        })
    }

    // --------------

    const config: DetecEndOfCourseParameters = {
        referencePhase: {
            reference: {
                speed: PulsesPerTick(500),
                acceleration: PulsesPerTickSquared(5000),
            },
            endPosition: Pulses(500)    //NOTE: This value may be variable in function of mechanics of the axis
        },
        searchPhase: {
            startAt: {
                position: Pulses(500),
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

  
    const spinner = ora().start()
    spinner.text = 'resetando parametros...'
    await resetMainParameters()
    
    const axis = AxisControler(cmppControler)
    
    await axis.forceSmartReference(config.referencePhase)

    const endOfCourse = Pulses(2400)

    function* getNextMoviment():Generator<PositionInPulses & Kinematics, void, unknown> {
        //TODO: decide when to use 'velocity' and when to use 'speed' (and vice-versa), to avoid misconception
        const VERY_HIGH_SPEED = PulsesPerTick(10000)
        const INITIAL_ACCELERATION = PulsesPerTickSquared(9000)
        const INCREMENTAL_ACCELERATION = PulsesPerTickSquared(10)
        let currentAcceleration = INITIAL_ACCELERATION
        //TODO: Use a vector space utility for this calculation
        const currentAccelerationIncrement = ():void => {
            currentAcceleration = PulsesPerTickSquared( currentAcceleration.value + INCREMENTAL_ACCELERATION.value)
        }
        while(true) {
            yield({
                position: endOfCourse,
                speed: VERY_HIGH_SPEED,
                acceleration: currentAcceleration
            })
            currentAccelerationIncrement()
        }
        
    }  

    const checkMoviment = async (cmppControler: CmppControler, many: Iterable<PositionInPulses & Kinematics>) => {
        const iter = many[Symbol.iterator]()
        let next = iter.next()

        const testIsTrue = async ():Promise<boolean> => {
            const status = await axis.getMovimentStatus()
            const isReferenced = status.isReferenced
            const isMoving = !status.isStopped
            return isReferenced && isMoving
        } 


        while(!next.done) {
            console.log('proxima tentativa:')
            console.table(next.value)
            
            //TODO: Should detect if motor has stoped or aborted their mission, loose reference, etc.
            //      If yes should make possible to return sequence from where it became interrupted
            await axis.setNext(next.value)
            await axis.start()
            while (await testIsTrue()) { }// wait to stop or to dereferentiate }
            if ((! (await axis.getMovimentStatus()).isReferenced)) {
                console.log('desreferenciou')
                break;
            }
            console.log('ok, incrementando e realizando nova tentativa')
            next = iter.next()
        }
    
    }

    await checkMoviment(cmppControler, getNextMoviment())
    
    spinner.stop()

}

run()