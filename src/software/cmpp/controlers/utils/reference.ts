import { CMPP00LG } from "../../transport/memmap-CMPP00LG"
import { forceLooseReference } from "./force-loose-reference"
import { PulsesPerTick, PulsesPerTickSquared } from "../../transport/memmap-types"
import { getMovimentStatus } from "./moviment-status"
import { Tunnel } from "../../datalink/tunnel"

const makeAxis_ = CMPP00LG

//TODO: Extract from this file to better place if possible
export const isReferencing = async (tunnel: Tunnel):Promise<boolean> => {
    const status = await getMovimentStatus(tunnel)
    return status.isReferencing
} 

//TODO: extract this function to a better place
export const isReferenced = async (tunnel: Tunnel): Promise<boolean> => {
    const statusL = await getMovimentStatus(tunnel)
    return statusL.isReferenced
}


export type ReferenceParameters = {
    'Velocidade de referencia': PulsesPerTick,
    'Aceleracao de referencia': PulsesPerTickSquared,
}

//NOTE: only returns when axis finished the reference proccess
export const forceReference = async (tunnel: Tunnel, program: ReferenceParameters): Promise<void> => {
    
    return new Promise ( async (resolve, reject) => {

        const axis = makeAxis_(tunnel)

        await forceLooseReference(tunnel)
        await axis.set('Velocidade de referencia', program['Velocidade de referencia'])
        await axis.set('Aceleracao de referencia', program['Aceleracao de referencia'])

        // do
        await axis.set('Pausa serial','desligado')
        await axis.set('Start serial','ligado')

        while( await isReferencing(tunnel) ) {
            //TODO: should this loop be protected with an timeout error ?
            // wait until reference proccess is done!
        }

        resolve()
    
    })
}

export const doReferenceIfNecessary = async (tunnel: Tunnel, program: ReferenceParameters): Promise<void> => {

    const isReferenced_ = await isReferenced(tunnel)
    if(isReferenced_) {
        return
    } else {
        await forceReference(tunnel, program)
    }


}