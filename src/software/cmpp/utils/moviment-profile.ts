import { explodeTunnel } from "./core"
import { Tunnel } from "./detect-cmpp"
import { getStatusLow, StatusL } from "./get-status-low"

export type MovimentProfile = {
    direction: 'Avanco' | 'Retorno'
    isStopped: boolean  // if true all all following are false: isInConstantSpeedGreaterThanZero, isAcelerating, isDeacelerating
    isInConstantSpeedGreaterThanZero: boolean // if true all accelerations are false and vice versa
    isAcelerating: boolean
    isDeacelerating: boolean
}

export const formatter = (statusL: StatusL):MovimentProfile => {
    const {aceleracaoLigada, desaceleracaoLigada, direcaoDoMovimento } = statusL
    const isStopped = aceleracaoLigada===false && desaceleracaoLigada===false
    const isInConstantSpeedGreaterThanZero = aceleracaoLigada && desaceleracaoLigada && isStopped===false
    const isAcelerating = statusL.desaceleracaoLigada===true ? false : statusL.aceleracaoLigada
    const isDeacelerating = statusL.aceleracaoLigada===true ? false : statusL.desaceleracaoLigada
    const direction = direcaoDoMovimento
    return {
        direction,
        isStopped,
        isInConstantSpeedGreaterThanZero,
        isAcelerating,
        isDeacelerating,
    }
}

//alternative to .waitToStop, because on automatic start the motor reverse the moviment without stop in practice
export const getMovimentProfile = async(tunnel: Tunnel): Promise<MovimentProfile> => {
    const { path, baudRate, channel} = explodeTunnel(tunnel)
    const statusL = await getStatusLow(path, baudRate, channel)
    const response = formatter(statusL)
    return response
    
}
