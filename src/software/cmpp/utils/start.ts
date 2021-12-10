
import { CMPP00LG } from "../transport/memmap-CMPP00LG"
import { explodeTunnel } from "./core"
import { Tunnel } from "./detect-cmpp"
import { getStatusLow } from "./get-status-low"

const makeAxis_ = CMPP00LG

export const isStoped =  async (tunnel: Tunnel) => {
    const { path, baudRate, channel} = explodeTunnel(tunnel)
    const statusL = await getStatusLow(path, baudRate, channel)
    const isStoped_ = statusL.aceleracaoLigada===false && statusL.desaceleracaoLigada===false
    return isStoped_
}

export const start = async (tunnel: Tunnel) => {
    const axis = makeAxis_(tunnel)
    await axis.set('Start serial','ligado')
}

export const waitToStopThenStart = async (tunnel: Tunnel) => {
    await waitToStop(tunnel)
    await start (tunnel)
}

export const waitToStop = async (tunnel: Tunnel) => {
    const isNotStoped = async () => !(await isStoped(tunnel))
    while (await isNotStoped()) {
        //loop until stopped
    }
    return
}