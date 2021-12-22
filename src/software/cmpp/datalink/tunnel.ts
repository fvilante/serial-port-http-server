import { PortSpec } from "../../serial";
import { BaudRate } from "../../serial/baudrate";
import { Channel } from "./core-types";


/** Represents the addressing of a tunnel connection which we can communicate to/from a cmpp */
export type Tunnel = { 
    readonly portSpec: PortSpec, 
    readonly channel: Channel
} 


// helper function
export const explodeTunnel = (tunnel: Tunnel) => {
    const { portSpec, channel} = tunnel
    const { path, baudRate} = portSpec
    return { path, baudRate, channel }
}

export const makeTunnel = (path: string, baudRate: BaudRate, channel: Channel): Tunnel => {
    return {
        portSpec: { path, baudRate},
        channel,
    }
}
