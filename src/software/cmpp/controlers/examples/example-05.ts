import ora, { Spinner } from 'ora'
import { Pulses, PulsesPerTick, PulsesPerTickSquared, TicksOfClock } from "../../physical-dimensions/physical-dimensions"
import { delay } from "../../../core/delay"
import { random } from "../../../core/utils"
import { makeCmppControler } from "../cmpp-controler"
import { doSmartReferenceIfNecessary } from "../utils/smart-reference"
import { Moviment } from "../core"
import { goMany } from '../utils/go-many'
import { makeTunnel } from '../../datalink/tunnel'



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
        await doSmartReferenceIfNecessary(cmppControler,config.referencePhase)

        function* generator():Generator<Moviment, void, unknown> {
            let counter = 0
            while (counter++ < 150) {
                const nextPos = random(3000, 4000)
                const nextVelocity = random(859, 860)
                const nextAcceleration = random(5500, 5501)

                yield( {
                    position: Pulses(nextPos),
                    speed: PulsesPerTick(nextVelocity),
                    acceleration: PulsesPerTickSquared(nextAcceleration),
                })
            }
            
        }

        await goMany(cmppControler, generator())
        await delay(15000)
    }

    for (let k=0; k<3; k++ ) {
        await runRoutine()
    }

    

    

}

run()