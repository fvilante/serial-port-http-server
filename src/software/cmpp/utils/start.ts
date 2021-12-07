import { CMPP00LG } from "../transport/memmap-CMPP00LG"
import { Tunnel } from "./detect-cmpp"

const makeAxis_ = CMPP00LG

export const start = async (tunnel: Tunnel, makeAxis: typeof makeAxis_) => {

    const axis = makeAxis(tunnel)
    await axis.set('Start serial','ligado')

}