import ora, { Spinner } from 'ora'
import { Pulses, PulsesPerTick, PulsesPerTickSquared, TicksOfClock } from "../../physical-dimensions/physical-dimensions"
import { CmppControler, makeCmppControler } from "../cmpp-controler"
import { Kinematics, Moviment } from "../core"
import { makeTunnel } from '../../datalink/tunnel'
import { AxisCotroler } from '../axis-controler'
import { DetecEndOfCourseParameters } from '../utils/detect-end-of-course'
import { Position } from '../../physical-dimensions/base'



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

  
    const spinner = ora().start()
    spinner.text = 'resetando parametros...'
    await resetMainParameters()
    
    const axis = AxisCotroler(cmppControler)
    
    await axis.doSmartReferenceIfNecessary(config.referencePhase)

    type Tone = number  // the numbe represents a frequency in hertz 
    const C4: Tone = 262
    const D4: Tone = 294
    const E4: Tone = 330
    const F4: Tone = 349
    const G4: Tone = 392
    const A4: Tone = 440
    const B4: Tone = 494

    type Sound = 
        | readonly [tone: Tone, duration: number] 
        | readonly [tone: Tone, duration: number, bend: number ] // duration in miliseconds //NOTE: Bend is made equals acceleration in pulses per ticks square

    const play = (sound: Sound):Moviment => {
        const [frequency, duration, bend] = sound
        const stepPerPulse = 1
        const stepsPerSecond = frequency * stepPerPulse
        const totalSteps_ = (stepsPerSecond/1000)*duration
        const totalRelativeSteps = Math.round(totalSteps_)
        const bend_ = bend ? bend : 8000 //NOTE: Bend is made equals acceleration in pulses per ticks square
        return {
            position: Pulses(totalRelativeSteps),
            speed: PulsesPerTick(frequency),
            acceleration: PulsesPerTickSquared(bend_)
        }

    }

    const initial: Moviment = {
        position: Pulses(500),
        speed: PulsesPerTick(1000),
        acceleration: PulsesPerTickSquared(5000)
    }
    const endPosition = Pulses(6000)
    await axis.goTo(initial)
    await axis.gotToRelative(play([G4,3000]))
    await axis.gotToRelative(play([D4,3000]))
    await axis.gotToRelative(play([A4,6000]))

    
    
    spinner.stop()

}

run()