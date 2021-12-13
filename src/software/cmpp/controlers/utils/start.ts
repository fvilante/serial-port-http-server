
import { Tunnel } from "../../datalink/tunnel"
import { CMPP00LG } from "../../transport/memmap-CMPP00LG"
import { getMovimentStatus } from "./moviment-status"

const makeTransportLayer = CMPP00LG

export const isStoped =  async (tunnel: Tunnel) => {
    const status = await getMovimentStatus(tunnel)
    return status.isStopped
}

export const start = async (tunnel: Tunnel) => {
    const transportLayer = makeTransportLayer(tunnel)
    await transportLayer.set('Start serial','ligado')
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