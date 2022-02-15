import { explodeTunnel, Tunnel } from "../../transport/tunnel"
import { Pulses, PulsesPerTick, PulsesPerTickSquared, TicksOfClock } from "../../physical-dimensions/physical-dimensions"
import { Moviment } from "../core"
import { getStatusLow, StatusL } from "./get-status-low"


export type MovimentStage = 'ramp_up' | 'const_speed_and_moving' | 'ramp_down' | 'stoped'

// Moviment status is basicaly a helper formating over StatusL data
// NOTE: Maybe in future it contain more data that will require multiples payload transactions with cmpp
export type MovimentStatus = {
    // MOVIMENT PART
    direction: 'Avanco' | 'Retorno'
    isStopped: boolean  // if true all all following are false: isInConstantSpeedGreaterThanZero, isAcelerating, isDeacelerating
    isInConstantSpeedGreaterThanZero: boolean // if true all accelerations are false and vice versa
    isChangingVelocity: boolean // acelerating or deacelerating
    isAcelerating: boolean
    isDeacelerating: boolean
    movimentStage: 'ramp_up' | 'const_speed_and_moving' | 'ramp_down' | 'stoped'
} & {
    // REFERENCE STATUS PART
    isReferenced: boolean
    isReferencing: boolean
}

export const castStatusLToMovimentStatus = (statusL: StatusL):MovimentStatus => {
    const {aceleracaoLigada, desaceleracaoLigada, direcaoDoMovimento, referenciado, referenciando } = statusL
    const isStopped = aceleracaoLigada===false && desaceleracaoLigada===false
    const isInConstantSpeedGreaterThanZero = aceleracaoLigada && desaceleracaoLigada && isStopped===false
    const isAcelerating = statusL.desaceleracaoLigada===true ? false : statusL.aceleracaoLigada
    const isDeacelerating = statusL.aceleracaoLigada===true ? false : statusL.desaceleracaoLigada
    const direction = direcaoDoMovimento
    const isReferenced = referenciado
    const isReferencing = referenciando
    const isChangingVelocity = isAcelerating || isDeacelerating
    const formatStage = (): MovimentStage => {
        let stage: MovimentStage = 'stoped' 
        if (isAcelerating) stage = 'ramp_up'
        else if(isDeacelerating) stage = 'ramp_down'
        else if(isInConstantSpeedGreaterThanZero) stage = 'const_speed_and_moving'
        else if(isStopped) stage = 'stoped'
        else {
            //TODO: implement unit test for this case or make it more statically safe
            throw new Error('Should never happens')
        }
        return stage
    }
    const movimentStage = formatStage()
    return {
        direction,
        isStopped,
        isInConstantSpeedGreaterThanZero,
        isAcelerating,
        isDeacelerating,
        isReferenced,
        isReferencing,
        isChangingVelocity,
        movimentStage,
    }
}

//TODO: Should I add in the argument to receive the Classic cmpp driver, so I make it clear that it's a dependency ?
//alternative to .waitToStop, because on automatic start the motor reverse the moviment without stop in practice
export const getMovimentStatus = async(tunnel: Tunnel): Promise<MovimentStatus> => {
    const { path, baudRate, channel} = explodeTunnel(tunnel)
    const statusL = await getStatusLow(path, baudRate, channel)
    const response = castStatusLToMovimentStatus(statusL)
    //console.table(response)
    return response
}

//IMPORTANT: All values can be positive, negative and/or irrational. No round mathed are performed here.
export type MovimentEstimatives = {
    //given
    nextMoviment: Moviment
    //then
    totalDisplacement: Pulses // may be positive or negative
    totalTime: TicksOfClock
    maxVelocity: PulsesPerTick
    estimatedVelocity: PulsesPerTick
    rampTime: TicksOfClock
    rampDisplacement: Pulses
    constVelocityDisplacement: Pulses
    constVelocityTime: TicksOfClock
}

export const estimateMovimentEvents = (nextMoviment: Moviment): MovimentEstimatives => {
    const { position: finalPosition, speed, acceleration } = nextMoviment

    const getTimeForRamp = (finalVelocity: PulsesPerTick, acceleration: PulsesPerTickSquared): TicksOfClock => {
        const iv = 0 // initial velocity
        const fv = finalVelocity.value
        const deltaV = fv - iv
        const ac = acceleration.value
        const deltaTime = deltaV / ac
        return TicksOfClock(deltaTime) 
    }

    const getMaxVelocity = (totalDisplacement: Pulses, acceleration: PulsesPerTickSquared): PulsesPerTick => {
        const deltaS = Math.abs(totalDisplacement.value)
        const ac = Math.abs(acceleration.value)
        const maxVelocity = Math.sqrt(deltaS * ac) //NOTE: number two may be canceled; not done here for improve code readability.
        return PulsesPerTick(maxVelocity)
    }

    const getTotalDisplacement = ():Pulses => { // return value may be positive or negative
        const initialPosition = Pulses(0).value   // assume relative reference
        const finalPosition = nextMoviment.position.value
        const totalDisplacement = finalPosition - initialPosition
        return Pulses(totalDisplacement)
    }

    const getRampDisplacement = (finalVelocity: PulsesPerTick, acceleration: PulsesPerTickSquared):Pulses => {
        const fv = finalVelocity.value
        const ac = acceleration.value
        const displacement = (fv^2)/(2*ac) // torricelli equation
        return Pulses(displacement)
    }

    const getConstantVelocityDisplacement = (totalDisplacement: Pulses, rampDisplacement: Pulses): Pulses => { // return value may be positive or negative
        const total = totalDisplacement.value
        const ramp = rampDisplacement.value
        const numberOfRamps = 2
        const response = total - ( ramp * numberOfRamps )
        return Pulses(response) 
    }

    const getConstantVelocityTime = (velocity: PulsesPerTick, displacement: Pulses): TicksOfClock => {
        const v = velocity.value
        const s = displacement.value
        const t = s / v
        return TicksOfClock(t)
    }

    const getTotalTime = (rampTime: TicksOfClock, constVelocityTime: TicksOfClock): TicksOfClock => {
        const rampTime_ = rampTime.value
        const constTime = constVelocityTime.value
        const totalTime = (rampTime_*2) + constTime
        return TicksOfClock(totalTime)
    }

    const totalDisplacement = getTotalDisplacement()
    const maxVelocity = getMaxVelocity(totalDisplacement, acceleration)
    const estimatedVelocity = speed.value >= maxVelocity.value ? maxVelocity : speed
    const rampTime = getTimeForRamp(estimatedVelocity, acceleration)
    const rampDisplacement = getRampDisplacement(estimatedVelocity, acceleration)
    const constVelocityDisplacement = getConstantVelocityDisplacement(totalDisplacement, rampDisplacement)
    const constVelocityTime = getConstantVelocityTime(estimatedVelocity, constVelocityDisplacement)
    const totalTime = getTotalTime(rampTime, constVelocityTime)

    return {
        nextMoviment,
        totalDisplacement,
        maxVelocity,
        estimatedVelocity,
        rampTime,
        rampDisplacement,
        constVelocityDisplacement,
        constVelocityTime,
        totalTime,
    }

}


