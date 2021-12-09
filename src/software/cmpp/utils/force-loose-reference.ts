import { BaudRate } from "../../serial/baudrate"
import { Channel } from "../datalink/core-types"
import { CMPP00LG } from "../transport/memmap-CMPP00LG"
import { Tunnel } from "./detect-cmpp"
import { getStatusLow } from "./get-status-low"
import { explodeTunnel, isReferenced, makeTunnel } from "./core"

const makeAxis_ = CMPP00LG

export const forceLooseReference = async (tunnel: Tunnel, makeAxis: typeof makeAxis_): Promise<void> => {
    const axis = makeAxis(tunnel)
    const { path, baudRate, channel} = explodeTunnel(tunnel)
    const isReferenced_ = await isReferenced(tunnel, makeAxis_)
    if(isReferenced_) {
        await axis.set('Modo manual serial', 'ligado')
        await axis.set('Stop serial', 'ligado')
        await axis.set('Pausa serial','ligado')
    } else {
        return
    }   
}
    

