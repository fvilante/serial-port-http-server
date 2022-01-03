import ora, { Spinner } from 'ora'
import { Pulses, PulsesPerTick, PulsesPerTickSquared, TicksOfClock } from "../../physical-dimensions/physical-dimensions"
import { makeCmppControler } from "../cmpp-controler"
import { forceSmartReference } from "../utils/smart-reference"
import { detectEndOfCourse } from '../utils/detect-end-of-course'
import { goNext } from '../utils/go-next'
import { makeTunnel } from '../../transport/tunnel'


const run = async () => {

    // config
    const tunnel = makeTunnel('com50', 9600, 0)
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
            'Start automatico no retorno': 'desligado',
            'Tempo para o start automatico': TicksOfClock(10),
            'Reducao da corrente em repouso': 'ligado',
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

    const runRoutine = async () => {
        const spinner = ora().start()
        spinner.text = 'resetando parametros...'
        await resetMainParameters()
    
        spinner.text = 'detectando curso do motor...'
        const lastPosition = await detectEndOfCourse(cmppControler,config)
        spinner.succeed(`curso detectado ${lastPosition.value} ${lastPosition.unitOfMeasurement}`)
    
        spinner.succeed(`Confirmando curso do motor detectado: ${lastPosition.value} ${lastPosition.unitOfMeasurement}`)
    
        await forceSmartReference(cmppControler,config.referencePhase)
        await goNext(cmppControler, {...config.searchPhase.advancingKinematics, position: lastPosition})
        await goNext(cmppControler, {...config.searchPhase.advancingKinematics, position: config.referencePhase.endPosition})
        await goNext(cmppControler, {...config.searchPhase.advancingKinematics, position: lastPosition})
        await goNext(cmppControler, {...config.searchPhase.advancingKinematics, position: config.referencePhase.endPosition})
        spinner.succeed(`Confirmado! curso do motor detectado: ${lastPosition.value} ${lastPosition.unitOfMeasurement}`)
        spinner.stop()
    }

    for (let k=0; k<10; k++ ) {
        await runRoutine()
    }

    

    

}

run()