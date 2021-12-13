import { Pulses, PulsesPerTick, PulsesPerTickSquared } from "../transport/memmap-types"

//

export type Kinematics = {
    speed: PulsesPerTick
    acceleration: PulsesPerTickSquared
}

export type Moviment = {
    position: Pulses    // position for next moviment
} & Kinematics          // kinematics for next moviment