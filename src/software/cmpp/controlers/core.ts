import { Pulses, PulsesPerTick, PulsesPerTickSquared } from "../physical-dimensions/physical-dimensions"

//

export type Kinematics = {
    speed: PulsesPerTick
    acceleration: PulsesPerTickSquared
}

export type Position = {
    position: Pulses
}

export type Moviment = Position & Kinematics          