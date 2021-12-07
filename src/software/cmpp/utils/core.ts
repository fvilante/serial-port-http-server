import { BaudRate } from "../../serial/baudrate"
import { Channel } from "../datalink/core-types"
import { CMPP00LG } from "../transport/memmap-CMPP00LG"
import { Tunnel } from "./detect-cmpp"
import { getStatusLow } from "./get-status-low"

const makeAxis_ = CMPP00LG

export const isReferenced = async (tunnel: Tunnel, makeAxis: typeof makeAxis_): Promise<boolean> => {
    const { path, channel, baudRate} = decomposeTunnel(tunnel)
    const statusL = await getStatusLow(path, baudRate, channel)
    return statusL.referenciado
}

// helper function
export const decomposeTunnel = (tunnel: Tunnel) => {
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