import ora, { Spinner } from 'ora'
import { Pulses, PulsesPerTick, PulsesPerTickSquared, Pulses_, TicksOfClock } from "../../physical-dimensions/physical-dimensions"
import { makeCmppControler } from "../cmpp-controler"
import { Moviment } from "../core"
import { makeTunnel } from '../../datalink/core/tunnel'
import { AxisCotroler } from '../axis-controler'
import { DetecEndOfCourseParameters } from '../utils/detect-end-of-course'
import { delay } from '../../../core/delay'
import { exhaustiveSwitch } from '../../../core/utils'



export const run = async () => {

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

    const pitchShift = 1

    type Tone = number  // the numbe represents a frequency in hertz 
    const silence: Tone = 0
    const C4: Tone = 262 * pitchShift
    const D4: Tone = 294 * pitchShift
    const E4: Tone = 330 * pitchShift
    const F4: Tone = 349 * pitchShift
    const G4: Tone = 392 * pitchShift
    const A4: Tone = 440 * pitchShift
    const B4: Tone = 494 * pitchShift

    type Duration = number
    type Bend = number // corresponds to acceleration

    type Sound = { 
        kind: 'Sound'
        note:   | readonly [tone: Tone, duration: Duration] 
                | readonly [tone: Tone, duration: Duration, bend: Bend ]
                // duration in miliseconds //NOTE: Bend is made equals acceleration in pulses per ticks square
    }

    type Silence = { 
        kind: 'Silence'
        duration: number // duration of silence in miliseconds
    }


    type X = Omit<Sound, 'kind'>

    const Sound = (note: Omit<Sound, 'kind'>['note']):Sound => ({ kind: 'Sound', note })
    const Silence = (duration: Omit<Silence, 'kind'>['duration']):Silence => ({ kind: 'Silence', duration })

    const soundToMoviment = (sound: Sound):Moviment => {
        const [frequency, duration, bend] = sound.note
        const stepPerPulse = 1
        const stepsPerSecond = frequency * stepPerPulse
        const totalSteps_ = (stepsPerSecond/1000)*duration
        const totalRelativeSteps = Math.round(totalSteps_)
        const bend_ = bend ? bend : 15000 //NOTE: Bend is made equals acceleration in pulses per ticks square
        return {
            position: Pulses(totalRelativeSteps),
            speed: PulsesPerTick(Math.round(frequency)),
            acceleration: PulsesPerTickSquared(bend_)
        }
    }


    const playMoviment = async (nextRelativeMoviment: Moviment): Promise<void> => {
        //TODO: Make the moviment more symetric in relation to axis length
        //TODO: Make this state more persistent
        let currentDirection: number = 1 // (+1) = forward, (-1) = reward
        const { position: nextRelativePosition } = nextRelativeMoviment
        const MAX_POSITION = Pulses(6500)
        const MIN_POSITION = Pulses(500)
        const currentAbsolutePosition_ = await axis.getCurrentPosition()
        const nextAbsolutePosition = Pulses_.add(currentAbsolutePosition_, nextRelativePosition)
        const isNextAbsolutePositionOutOfRange = ():boolean => {
            const isOutUpperBound = nextAbsolutePosition.value >=  MAX_POSITION.value
            const isOutLowerBound = nextAbsolutePosition.value <=  MIN_POSITION.value
            return isOutLowerBound || isOutUpperBound
        }
        if (isNextAbsolutePositionOutOfRange()) {
            currentDirection = currentDirection === 1 ? -1 : 1
        }
        const nextRelativePosition_adjusted = Pulses_.scale(nextRelativePosition, currentDirection)
        const nextMoviment_adjusted = { ...nextRelativeMoviment, position: nextRelativePosition_adjusted}
        const { currentPosition, isReferenced } = await axis.goToRelative(nextMoviment_adjusted)
        if(!isReferenced) throw new Error('Equipamento desreferenciou')
        return
    }

    const playSilence = (silence: Silence): Promise<void> => delay(silence.duration)

    const play = async (composition: Iterable<Sound|Silence>): Promise<void> => {
        const itor = composition[Symbol.iterator]()
        let next = itor.next()
        while(!next.done) {
            const note = next.value
            console.table(note)
            const kind_ = note.kind
            switch (kind_) {
                case 'Silence': {
                    await playSilence(note)
                    break;
                }
                case 'Sound': {
                    await playMoviment(soundToMoviment(note))
                    break;
                }
                default:
                    exhaustiveSwitch(kind_)
            }
            next = itor.next()
        }
    }

    type Composition = Iterable<Sound|Silence>

    const tempo = 500 // represents each compass time (in miliseconds)

    const tempo_reducer = 1

    const dingoBells: Composition = [
        Sound([E4, 1*tempo]),
        Sound([E4, 1*tempo]),
        Sound([E4, 1*tempo]),
        Sound([E4, 1*tempo]),
        //
        Sound([E4, 1*tempo]),
        Sound([C4, 1*tempo]),
        Sound([E4, 1*tempo]),
        Sound([E4, 1*tempo]),
        //
        Sound([F4, 1*tempo]),
        Sound([F4, 1*tempo]),
        Sound([E4, 1*tempo]),
        Sound([E4, 1*tempo]),
        //
        Sound([D4, 1*tempo]),
        Sound([D4, 1*tempo]),
        Sound([D4, 1*tempo]),
        Sound([G4, 1*tempo]),
        //
    ]

    const doremifa: Composition = [
        Sound([C4, 1*tempo]),
        Sound([D4, 1*tempo]),
        Sound([E4, 1*tempo]),
        Sound([F4, 1*tempo]),
        //
        Sound([C4, 1*tempo]),
        Sound([D4, 1*tempo]),
        Sound([C4, 1*tempo]),
        Sound([D4, 1*tempo]),
        //
        Sound([C4, 1*tempo]),
        Sound([G4, 1*tempo]),
        Sound([F4, 1*tempo]),
        Sound([E4, 1*tempo]),
        //
        Sound([C4, 1*tempo]),
        Sound([D4, 1*tempo]),
        Sound([E4, 1*tempo]),
        Sound([F4, 1*tempo]),
        //
    ]

    const initial: Moviment = {
        position: Pulses(500),
        speed: PulsesPerTick(1000),
        acceleration: PulsesPerTickSquared(5000)
    }
    const endPosition = Pulses(6000)

    await axis.goTo(initial)
    await play(doremifa)
    await play(doremifa)
    await play(dingoBells)
    await play(dingoBells)
    await play(doremifa)
    await play(doremifa)
    await play(dingoBells)
    await play(dingoBells)
    await play(doremifa)
    await play(doremifa)
    await play(dingoBells)
    await play(dingoBells)


    
    
    

}

run()