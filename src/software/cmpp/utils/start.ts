
import { CMPP00LG } from "../transport/memmap-CMPP00LG"
import { explodeTunnel } from "./core"
import { Tunnel } from "./detect-cmpp"
import { getStatusLow } from "./get-status-low"

const makeAxis_ = CMPP00LG

export const isStoped =  async (tunnel: Tunnel, makeAxis: typeof makeAxis_) => {
    const axis = makeAxis(tunnel)
    const { path, baudRate, channel} = explodeTunnel(tunnel)
    const statusL = await getStatusLow(path, baudRate, channel)
    const isStoped_ = statusL.aceleracaoLigada===false && statusL.desaceleracaoLigada===false
    return isStoped_
}

export const start = async (tunnel: Tunnel, makeAxis: typeof makeAxis_) => {
    const axis = makeAxis(tunnel)
    await axis.set('Start serial','ligado')
}

export const waitToStopThenStart = async (tunnel: Tunnel, makeAxis: typeof makeAxis_) => {
    await waitToStop(tunnel, makeAxis)
    await start (tunnel, makeAxis)
}

export const waitToStop = async (tunnel: Tunnel, makeAxis: typeof makeAxis_) => {
    const isNotStoped = async () => !(await isStoped(tunnel, makeAxis))
    while (await isNotStoped()) {
        //loop until stopped
    }
    return
}