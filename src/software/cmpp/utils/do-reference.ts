import { CMPP00LG } from "../transport/memmap-CMPP00LG"
import { Tunnel } from "./detect-cmpp"
import { forceLooseReference } from "./force-loose-reference"
import { makeTunnel } from "./core"

const makeAxis_ = CMPP00LG

export const doReference = async (tunnel: Tunnel, makeAxis: typeof makeAxis_): Promise<void> => {

    const axis = makeAxis(tunnel)

    await axis.set('Pausa serial','desligado')
    await axis.set('Start serial','ligado')

}

const test2 = async () => {
    const tunnel = makeTunnel('com50', 9600, 0)
    await forceLooseReference(tunnel, makeAxis_)
    await doReference(tunnel, makeAxis_)
}

//test2()