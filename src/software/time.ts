import { now } from "./core/utils"


export type Second = {
    kind: 'Second'
    unsafeRun: () => number
    toSecond: () => Second
    toMilisecond: () => Milisecond
    toMinute: () => Minute
}

export const Second = (value: number):Second => {
    return {
        kind: 'Second',
        unsafeRun: () => value,
        toSecond: () => Second(value),
        toMilisecond: () => Milisecond(value*1000),
        toMinute: () => Minute(value/60),
    }
}


export type Minute = {
    kind: 'Minute'
    unsafeRun: () => number
    toSecond: () => Second
    toMilisecond: () => Milisecond
    toMinute: () => Minute
}

export const Minute = (value: number):Minute => {
    return {
        kind: 'Minute',
        unsafeRun: () => value,
        toSecond: () => Second(value*60),
        toMilisecond: () => Milisecond(value*60*1000),
        toMinute: () => Minute(value)
    }
}


export type Milisecond = {
    kind: 'Milisecond'
    unsafeRun: () => number
    toSecond: () => Second
    toMilisecond: () => Milisecond
    toMinute: () => Minute
}

export const Milisecond = (value: number):Milisecond => {
    return {
        kind: 'Milisecond',
        unsafeRun: () => value,
        toSecond: () => Second(value/1000),
        toMilisecond: () => Milisecond(value),
        toMinute: () => Second(value/1000).toMinute(),
        
    }
}

// Time duration, see c++ standard library as reference
export type Duration = {
    kind: 'Duration'
    toMilisecond: () => Milisecond
    toSecond: () => Second
    toMinute: () => Minute
}

type AnyDuration = Milisecond | Second | Minute

export const Duration = (value: AnyDuration): Duration => {

    return {
        kind: 'Duration',
        toMilisecond: () => value.toMilisecond(),
        toSecond: () => value.toSecond(),
        toMinute: () => value.toMinute(),
    }
}

export type TimePoint = {
    kind: 'TimePoint'
    unsafeRun: () => number
    //add: (d: Duration) => TimePoint
    sub: (other: TimePoint) => Duration
}
// note: value = now_function_result
const TimePoint = (value: number): TimePoint => {
    return {
        kind: 'TimePoint',
        unsafeRun: () => value,
        sub: other => Duration(Milisecond( value-other.unsafeRun() ))
    }
}

export type TimePoint_ = {
    now: () => TimePoint
}

export const TimePoint_: TimePoint_ = {
    now: () => TimePoint( now() ) 
}