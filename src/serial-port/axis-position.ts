import { AxisControler } from "./axis-controler"

// Position in one or more Axis
// Purpose: make it safe to work with diferent units of positions in axis
// Note: Position by definition is a vector (which means that it is a 'n cordinates'
//       in relation to a 'vector basis')
// All positions here are in relation to the zero of CMPP, that means, it is AbsolutePosition.

// Milimeter: A unit of linear length and linear length is a measure of the distance between
// two points.
export type Milimeter = {
    kind: 'Milimeter'
    value: number
}
export const Milimeter = (value: number): Milimeter => ({kind: 'Milimeter', value})

// A unit of angular motion
export type Pulse = {
    kind: 'Pulse'
    value: number
}
export const Pulse = (value: number): Pulse => ({kind: 'Pulse', value})

export type PositionUnits = 
    | Milimeter['kind'] 
    | Pulse['kind']


export type Position = {
    toAbsoluteMilimeter: () => Milimeter
    toAbsolutePulse: () => Pulse
    // map: (f: (_: Displacement) => Displacement) => Displacement
    // add: (value: Displacement) => Displacement
    // sub: (value: Displacement) => Displacement
}


// Represents a position in a linear 1 dimension length space or in a angular space
export const AxisPosition = (axis: AxisControler) => (absolutePosition: Milimeter | Pulse): Position => {
    
    type T = Position

    const qty = absolutePosition.value
    const unit = absolutePosition.kind

    const toAbsoluteMilimeter: T['toAbsoluteMilimeter'] = () => {
        const mm = unit === 'Milimeter' 
            ? Milimeter(qty) 
            : axis._convertAbsolutePulsesToMilimeter(qty)
        return mm
    }

    const toAbsolutePulse: T['toAbsolutePulse'] = () => {
        const pulse = unit === 'Milimeter' 
            ? axis._convertMilimeterToPulseIfNecessary(Milimeter(qty)) 
            : qty
        return Pulse(pulse)
    }

    /*const map: T['map'] = f => {
        return Displacement
    }*/

    return {
        toAbsoluteMilimeter: toAbsoluteMilimeter,
        toAbsolutePulse: toAbsolutePulse,
        //map,
       // add,
       // sub,
    }

}

export type Position_ = {
    fromMilimeter: (value: number) => Position
    fromPulse: (value: number) => Position
}


