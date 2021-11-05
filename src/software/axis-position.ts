import { AxisControler } from "./axis-controler"

type Field<A> = {
    zero: () => A
    invert: () => A
    add: (p: A) => A
    sub: (p: A) => A
}

const numberField = (value: number):Field<number> => {
    return {
        zero: () => 0,
        invert: () => value*(-1),
        add: (other: number) => value+other,
        sub: (other: number) => value-other,
    }
}

//Maps any Field type to real numbers
const mapToFieldOverReals = <A>(unWrap: (_:A) => number, reWrap: (_:number) => A, getValue: () => A): Field<A> => {
    const f = numberField(unWrap(getValue()))
    return {
        zero: () => reWrap(f.zero()),
        invert: () => reWrap(f.invert()),
        add: other => reWrap(f.add(unWrap(other))),
        sub: other => reWrap(f.sub(unWrap(other))),
    }
}


export type Milimeter = {
    kind: 'Milimeter'
    value: number
}
export const Milimeter = (value: number): Milimeter => ({kind: 'Milimeter', value})


// Most elementary unit unit of position
// Note: Step (sinonymous=Pulse) is neither Angular nor Linear, but can be mapped to it.
export type Step = {
    kind: 'Step'
    getValue: () => number
    transform: <X>(f: (_:Step) => X) => X
    map: (f: (_:Step) => Step) => Step
    zero: () => Step
    invert: () => Step
    add: (p: Step) => Step
    sub: (p: Step) => Step
} 

export const Step = (value: number): Step => {

    type T = Step

    const getValue: T['getValue'] = () => value

    const transform: T['transform'] = f => f(Step(value))

    const map: T['map'] = f => transform(f)

    const fieldOverReals = () => {
        const unWrap = getValue
        const reWrap = Step
        const getPulse = () => Step(value)
        return mapToFieldOverReals(unWrap, reWrap, getPulse)
    }

    return {
        kind: 'Step',
        getValue,
        transform,
        map,
        ...fieldOverReals(),
    }
}

export type PositionUnits = 
    | Milimeter['kind'] 
    | Step['kind']


