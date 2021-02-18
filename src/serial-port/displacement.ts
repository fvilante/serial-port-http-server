import { AxisControler } from "./axis-controler"

export type Milimeter = {
    kind: 'Milimeter'
    value: number
}
export const Milimeter = (value: number): Milimeter => ({kind: 'Milimeter', value})

export type Pulse = {
    kind: 'Pulse'
    value: number
}
export const Pulse = (value: number): Pulse => ({kind: 'Pulse', value})

export type DisplacementUnits = Milimeter['kind'] | Pulse['kind']


export type Displacement = {
    toAbsoluteMilimeter: (axis: AxisControler) => Milimeter
    toAbsolutePulse: (axis: AxisControler) => Pulse
    //map: (f: (_: Displacement) => Displacement) => Displacement
  //  add: (value: Displacement) => Displacement
  //  sub: (value: Displacement) => Displacement
}

// Note: uom stands for unit of measurement 
export const Displacement = (data: Milimeter | Pulse): Displacement => {
    
    type T = Displacement

    const qty = data.value
    const unit = data.kind

    const toAbsoluteMilimeter: T['toAbsoluteMilimeter'] = axis => {
        const mm = unit === 'Milimeter' 
            ? Milimeter(qty) 
            : axis._convertAbsolutePulsesToMilimeter(qty)
        return mm
    }

    const toAbsolutePulse: T['toAbsolutePulse'] = axis => {
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
    fromMilimeter: (value: number) => Displacement
    fromPulse: (value: number) => Displacement
}


