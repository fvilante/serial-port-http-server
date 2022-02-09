import { assertUnreachable } from "../../core/utils"

export type BaseMeasure<K extends string, D extends string> = {
    kind: K
    value: number
    unitOfMeasurement: string
    dimension: D
}

export type InferBaseMeasure<T extends BaseMeasure<string,string>> = T extends BaseMeasure<infer K, infer D> ? { readonly kind: K, readonly dimension: D } : never

export const BaseMeasure = <K extends string, D extends string>(value: number, kind: K, dimension: D): BaseMeasure<K,D> => {
    return {
        kind,
        value,
        unitOfMeasurement: kind,  // TODO: Maybe in future this redundance may be undone and unit of measurement have a normalized text
        dimension,
    }
}

export const makeVectorSpace = <T extends BaseMeasure<string, string>>(kind: T['kind'], dimension: T['dimension']) => {
    type K = InferBaseMeasure<T>['kind']
    type D = InferBaseMeasure<T>['dimension']
    const ctor = (n: number):T => BaseMeasure<K,D>(n, kind, dimension) as T
    return {
        add: (a: T, b: T):T => ctor(a.value+b.value),   
        subtract:  (a: T, b: T):T => ctor(a.value-b.value),
        scale: (a: T, factor: number):T => ctor(a.value*factor), //TODO: Check if a rounding is necessary
        invert: (a: T):T => ctor(a.value * (-1)),
        abs: (a: T): T => ctor(a.value < 0 ? (-1)*a.value : a.value)   
    }
}

//

export type AxisUomConvertions = {
    pulsesToMilimeterRatio: number
    ticksOfClockToSecondsRatio: number
}

//

export type Seconds = BaseMeasure<'Seconds','Time'>
export const Seconds = (value: number): Seconds => BaseMeasure(value, 'Seconds', 'Time')
//
export type TicksOfClock = BaseMeasure<'TicksOfClock', 'Time'>
export const TicksOfClock = (value: number): TicksOfClock => BaseMeasure(value, 'TicksOfClock', 'Time')
//
export type Pulses = BaseMeasure<'Pulses', 'Position'>
export const Pulses = (value: number): Pulses => BaseMeasure(value, 'Pulses', 'Position')
//
export type Milimeters = BaseMeasure<'Milimeters', 'Position'>
export const Milimeters = (value: number): Milimeters => BaseMeasure(value, 'Milimeters', 'Position')
//


// primary
