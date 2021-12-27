import { Tunnel } from "../../datalink/core/tunnel"
import { CMPP00LG } from "../../transport/memmap-CMPP00LG"
import { getMovimentStatus } from "./moviment-status"

const makeTransportLayer = CMPP00LG

export const forceLooseReference = async (tunnel: Tunnel): Promise<void> => {
    const status = await getMovimentStatus(tunnel)
    const isReferenced_ = status.isReferenced
    if(isReferenced_) {
        const transportLayer = makeTransportLayer(tunnel)
        await transportLayer.set('Modo manual serial', 'ligado')
        await transportLayer.set('Stop serial', 'ligado')
        await transportLayer.set('Pausa serial','ligado')
    } else {
        return
    }   
}
    

