import { CMPP00LG } from "../../transport/memmap-CMPP00LG"
import { Tunnel } from "../../utils/detect-cmpp"
import { getMovimentStatus } from "./moviment-status"

const makeAxis_ = CMPP00LG

export const forceLooseReference = async (tunnel: Tunnel): Promise<void> => {
    const status = await getMovimentStatus(tunnel)
    const isReferenced_ = status.isReferenced
    if(isReferenced_) {
        const axis = makeAxis_(tunnel)
        await axis.set('Modo manual serial', 'ligado')
        await axis.set('Stop serial', 'ligado')
        await axis.set('Pausa serial','ligado')
    } else {
        return
    }   
}
    

