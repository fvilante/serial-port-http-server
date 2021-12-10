import { explodeTunnel } from "./core"
import { Tunnel } from "./detect-cmpp"
import { getStatusLow, StatusL } from "./get-status-low"


// Moviment status is basicaly a helper formating over StatusL data
// NOTE: Maybe in future it contain more data that will require multiples payload transactions with cmpp
export type MovimentStatus = {
    // MOVIMENT PART
    direction: 'Avanco' | 'Retorno'
    isStopped: boolean  // if true all all following are false: isInConstantSpeedGreaterThanZero, isAcelerating, isDeacelerating
    isInConstantSpeedGreaterThanZero: boolean // if true all accelerations are false and vice versa
    isAcelerating: boolean
    isDeacelerating: boolean
} & {
    // REFERENCE STATUS PART
    isReferenced: boolean
    isReferencing: boolean
}

export const formatter = (statusL: StatusL):MovimentStatus => {
    const {aceleracaoLigada, desaceleracaoLigada, direcaoDoMovimento, referenciado, referenciando } = statusL
    const isStopped = aceleracaoLigada===false && desaceleracaoLigada===false
    const isInConstantSpeedGreaterThanZero = aceleracaoLigada && desaceleracaoLigada && isStopped===false
    const isAcelerating = statusL.desaceleracaoLigada===true ? false : statusL.aceleracaoLigada
    const isDeacelerating = statusL.aceleracaoLigada===true ? false : statusL.desaceleracaoLigada
    const direction = direcaoDoMovimento
    const isReferenced = referenciado
    const isReferencing = referenciando
    return {
        direction,
        isStopped,
        isInConstantSpeedGreaterThanZero,
        isAcelerating,
        isDeacelerating,
        isReferenced,
        isReferencing,
    }
}

//TODO: Should I add in the argument to receive the Classic cmpp driver, so I make it clear that it's a dependency ?
//alternative to .waitToStop, because on automatic start the motor reverse the moviment without stop in practice
export const getMovimentStatus = async(tunnel: Tunnel): Promise<MovimentStatus> => {
    const { path, baudRate, channel} = explodeTunnel(tunnel)
    const statusL = await getStatusLow(path, baudRate, channel)
    const response = formatter(statusL)
    return response
}
