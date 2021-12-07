import { BaudRate } from "../../serial/baudrate"
import { Channel } from "../datalink/core-types"
import { CMPP00LG } from "../transport/memmap-CMPP00LG"
import { Tunnel } from "./detect-cmpp"
import { getStatusLow } from "./get-status-low"
import { decomposeTunnel, isReferenced, makeTunnel } from "./core"

const makeAxis_ = CMPP00LG

export const forceLooseReference = async (tunnel: Tunnel, makeAxis: typeof makeAxis_): Promise<void> => {
    const axis = makeAxis(tunnel)
    await axis.set('Pausa serial','ligado')
}

const test1 = async () => {

    const tunnel = makeTunnel('com50',9600,0)

    const isRefBefore = await isReferenced(tunnel, makeAxis_)
    await forceLooseReference(tunnel, makeAxis_)
    const isRefAfter = await isReferenced(tunnel, makeAxis_)
    console.table({
        isRefBefore,
        isRefAfter
    })

}

//test1()