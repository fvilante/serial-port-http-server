import { CMPP00LG } from "../transport/memmap-CMPP00LG"
import { Tunnel } from "./detect-cmpp"
import { forceLooseReference } from "./force-loose-reference"
import { explodeTunnel, isReferenced, makeTunnel } from "./core"
import { getStatusLow } from "./get-status-low"
import { PulsesPerTick, PulsesPerTickSquared } from "../transport/memmap-types"

const makeAxis_ = CMPP00LG

//TODO: Extract from this file to better place if possible
export const isReferencing = async (tunnel: Tunnel, makeAxis: typeof makeAxis_):Promise<boolean> => {
    const { path, baudRate, channel} = explodeTunnel(tunnel)
    const statusL = await getStatusLow(path, baudRate, channel)
    const isReferencing = statusL.referenciado===false && statusL.referenciando===true
    return isReferencing
} 

export type ReferenceParameters = {
    'Velocidade de referencia': PulsesPerTick,
    'Aceleracao de referencia': PulsesPerTickSquared,
}

//NOTE: only returns when axis finished the reference proccess
export const forceReference = async (tunnel: Tunnel, makeAxis: typeof makeAxis_, program: ReferenceParameters): Promise<void> => {
    
    return new Promise ( async (resolve, reject) => {

        const axis = makeAxis(tunnel)

        await forceLooseReference(tunnel, makeAxis)
        await axis.set('Velocidade de referencia', program['Velocidade de referencia'])
        await axis.set('Aceleracao de referencia', program['Aceleracao de referencia'])

        // do
        await axis.set('Pausa serial','desligado')
        await axis.set('Start serial','ligado')

        while( await isReferencing(tunnel, makeAxis) ) {
            //TODO: should this loop be protected with an timeout error ?
            // wait until reference proccess is done!
        }

        resolve()
    
    })
}

export const doReferenceIfNecessary = async (tunnel: Tunnel, makeAxis: typeof makeAxis_, program: ReferenceParameters): Promise<void> => {
    const axis = makeAxis(tunnel)

    const isReferenced_ = await isReferenced(tunnel, makeAxis)
    if(isReferenced_) {
        return
    } else {
        await forceReference(tunnel, makeAxis, program)
    }


}