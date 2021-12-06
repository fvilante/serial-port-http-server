

//represents number of pulses in relation to a reference not specified
export type Pulses = {
    kind: 'Pulses'
    value: number //pulses
    unitOfMeasurement: 'Pulses'
    dimension: 'Unit'
}

export const Pulses = (value: number): Pulses => ({kind: 'Pulses', value, unitOfMeasurement: 'Pulses', dimension: 'Unit'})

//

// Represents an amount of time
export type TicksOfClock = {
    kind: 'TicksOfClock'
    value: number //pulses
    unitOfMeasurement: 'TickClock'
    dimension: 'Time'
}

export const TicksOfClock = (value: number): TicksOfClock => ({kind: 'TicksOfClock', value, unitOfMeasurement: 'TickClock', dimension: 'Time'})


// corresponds to speed
export type PulsesPerTick = {
    kind: 'PulsesPerTick'
    value: number //pulses
    unitOfMeasurement: 'PulsesPerTick'
    dimension: 'Frequency' // = 1/Time
}

export const PulsesPerTick = (value: number): PulsesPerTick => ({kind: 'PulsesPerTick', value, unitOfMeasurement: 'PulsesPerTick', dimension: 'Frequency'})


// corresponds to acceleration
export type PulsesPerTickSquered = {
    kind: 'PulsesPerTickSquered'
    value: number //pulses
    unitOfMeasurement: 'PulsesPerTickSquered'
    dimension: 'Frequency/Time' // = Freq / Time  ;
}

export const PulsesPerTickSquered = (value: number): PulsesPerTickSquered => ({kind: 'PulsesPerTickSquered', value, unitOfMeasurement: 'PulsesPerTickSquered', dimension: 'Frequency/Time'})
