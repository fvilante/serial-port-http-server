import { Milimeter } from "../physical-dimensions/milimeter"
import { Pulses, PulsesPerTick, PulsesPerTickSquared } from "../physical-dimensions/physical-dimensions"

//

export type Kinematics = {
    speed: PulsesPerTick
    acceleration: PulsesPerTickSquared
}

//TODO: What if I use Position = Pulses & Milimeter?
export type Position = {
    position: Pulses | Milimeter
}
export const isPosition = (o: any): o is Moviment => {
    const position: keyof Position = 'position'
    const isPosition = (position in o)
    return isPosition
}


export type Moviment = Position & Kinematics
export const isMoviment = (o: any): o is Moviment => {
    const speed: keyof Kinematics = 'speed'
    const acceleration: keyof Kinematics = 'acceleration'
    const isMoviment = (isPosition(o)) && (speed in o) && (acceleration in o)
    return isMoviment
}


// @deprecated
export type PositionInPulses = {
    position: Pulses
}

// @deprecated
// TODO: Refactor to convert all Moviment_ into Moviment
export type Moviment_ = PositionInPulses & Kinematics
