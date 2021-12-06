


export type Pulses = {
    kind: 'Pulses'
    value: number //pulses
    unitOfMeasurement: 'Pulses'
    dimension: 'Frequency'
}

export const Pulses = (value: number): Pulses => ({kind: 'Pulses', value, unitOfMeasurement: 'Pulses', dimension: 'Frequency'})
