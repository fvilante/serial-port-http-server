import { CMPP00LG } from "../transport/memmap-CMPP00LG"
import { Tunnel } from "./detect-cmpp"
import { forceLooseReference } from "./force-loose-reference"
import { decomposeTunnel, isReferenced, makeTunnel } from "./core"
import { getStatusLow } from "./get-status-low"
import { PulsesPerTick, PulsesPerTickSquared } from "../transport/memmap-types"

const makeAxis_ = CMPP00LG

//TODO: Extract from this file to better place if possible
export const isReferencing = async (tunnel: Tunnel, makeAxis: typeof makeAxis_):Promise<boolean> => {
    const { path, baudRate, channel} = decomposeTunnel(tunnel)
    const statusL = await getStatusLow(path, baudRate, channel)
    const isReferencing = statusL.referenciado===false && statusL.referenciando===true
    return isReferencing
} 


//NOTE: only returns when axis finished the reference proccess
export const doReference = async (tunnel: Tunnel, makeAxis: typeof makeAxis_): Promise<void> => {
    
    return new Promise ( async (resolve, reject) => {

        const axis = makeAxis(tunnel)

        await axis.set('Velocidade de referencia', PulsesPerTick(1000))
        await axis.set('Aceleracao de referencia', PulsesPerTickSquared(5000))

        // do
        await axis.set('Pausa serial','desligado')
        await axis.set('Start serial','ligado')



        while( await isReferencing(tunnel, makeAxis) ) {
            // wait until reference proccess is done!
        }

        resolve()
    
    })

    
}

const test2 = async () => {
    const tunnel = makeTunnel('com50', 9600, 0)
    await forceLooseReference(tunnel, makeAxis_)
    await doReference(tunnel, makeAxis_)
}

//test2()