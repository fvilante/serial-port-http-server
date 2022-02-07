import { makeVectorSpace } from './base'
import { Pulses } from './base'

export { Pulses, TicksOfClock } from './base'

export const Pulses_ = makeVectorSpace<Pulses>('Pulses','Position')


//


// corresponds to speed
export type PulsesPerTick = {
    kind: 'PulsesPerTick'
    value: number //pulses
    unitOfMeasurement: 'PulsesPerTick'
    dimension: 'Frequency' // = 1/Time
}

export const PulsesPerTick = (value: number): PulsesPerTick => ({kind: 'PulsesPerTick', value, unitOfMeasurement: 'PulsesPerTick', dimension: 'Frequency'})


// corresponds to acceleration
export type PulsesPerTickSquared = {
    kind: 'PulsesPerTickSquared'
    value: number //pulses
    unitOfMeasurement: 'PulsesPerTickSquared'
    dimension: 'Frequency/Time' // = Freq / Time  ;
}

export const PulsesPerTickSquared = (value: number): PulsesPerTickSquared => ({kind: 'PulsesPerTickSquared', value, unitOfMeasurement: 'PulsesPerTickSquared', dimension: 'Frequency/Time'})
