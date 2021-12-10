



//represents number of pulses in relation to a reference not specified
export type Pulses = {
    kind: 'Pulses'
    value: number //pulses
    unitOfMeasurement: 'Pulses'
    dimension: 'Unit'
}

export const Pulses_ = {
    add: (a: Pulses, b: Pulses):Pulses => Pulses(a.value+b.value),   
    subtract:  (a: Pulses, b: Pulses):Pulses => Pulses(a.value-b.value),
    scale: (a: Pulses, factor: number) => Pulses(a.value*factor), //TODO: Check if a rounding is necessary
    invert: (a: Pulses):Pulses => Pulses(a.value * (-1)),
    abs: (a: Pulses): Pulses => Pulses(a.value < 0 ? (-1)*a.value : a.value)   
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
export type PulsesPerTickSquared = {
    kind: 'PulsesPerTickSquared'
    value: number //pulses
    unitOfMeasurement: 'PulsesPerTickSquared'
    dimension: 'Frequency/Time' // = Freq / Time  ;
}

//TODO: Correct the name: is not 'squered' but 'squared'
export const PulsesPerTickSquared = (value: number): PulsesPerTickSquared => ({kind: 'PulsesPerTickSquared', value, unitOfMeasurement: 'PulsesPerTickSquared', dimension: 'Frequency/Time'})
