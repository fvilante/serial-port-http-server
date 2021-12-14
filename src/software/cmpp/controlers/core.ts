import { Pulses, PulsesPerTick, PulsesPerTickSquared } from "../physical-dimensions/physical-dimensions"

//

export type Kinematics = {
    speed: PulsesPerTick
    acceleration: PulsesPerTickSquared
}

export type Moviment = {
    position: Pulses    // position for next moviment
} & Kinematics          // kinematics for next moviment