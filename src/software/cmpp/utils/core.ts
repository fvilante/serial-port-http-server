import { BaudRate } from "../../serial/baudrate"
import { Channel } from "../datalink/core-types"
import { CMPP00LG } from "../transport/memmap-CMPP00LG"
import { Tunnel } from "./detect-cmpp"
import { getStatusLow } from "./get-status-low"
import { getMovimentStatus } from "./moviment-status"



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