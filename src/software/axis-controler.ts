import { AxisStarterKit } from "./axis-starter-kit"
import { Milimeter } from "../temp/unused files/axis-position"
import { getStatusLow, StatusL } from "./cmpp/controlers/utils/get-status-low"
import { getPosicaoAtual } from "./cmpp/controlers/utils/get-pos-atual"
import { Address, Axis } from "./global-env/global"
import { WaitUntilTrueFastPooling } from "./core/promise-utils"
import { isInsideRange, now } from "./core/utils"
import { CMPP00LG } from "./cmpp/transport/memmap-CMPP00LG"
import { Pulses, PulsesPerTick, PulsesPerTickSquared } from "./cmpp/physical-dimensions/physical-dimensions"
import { makeTunnel } from "./cmpp/datalink/tunnel"
//import { PrintingPositions } from "./cmpp-controler"

const makeTransportLayer = CMPP00LG

// ***********************************************************
// A generic Axis driver
// offers an CNC-like API (removing CMPP-classic behavior)
// Hides and wrap the CMPP-classic PCBoard API
// ***********************************************************

type PrintingPositions = {
    readonly numeroDeMensagensNoAvanco: number;
    readonly numeroDeMensagensNoRetorno: number;
    readonly posicaoDaPrimeiraMensagemNoAvanco: number;
    readonly posicaoDaUltimaMensagemNoAvanco: number;
    readonly posicaoDaPrimeiraMensagemNoRetorno: number;
    readonly posicaoDaUltimaMensagemNoRetorno: number;
}

export type AxisKinematics = {
    readonly AbsoluteDisplacement: Milimeter
}


export type AxisControler = {
    readonly isReferenced: () => Promise<boolean>
    readonly isMoving: () => Promise<boolean>
    readonly _start: () => Promise<void>
    readonly _stop: () => Promise<void>
    readonly getAxisName: () => Axis
    readonly getCurrentAbsolutePosition: () => Promise<number>
    readonly goToAbsolutePosition: (pulses: number | Milimeter, kinematic?: (defaultVelocity:number, defaultAcceleration:number) => readonly [velocity: number, acceleration:number], monitor?: (currentPosition: number, tagetRange: readonly [LBound: number, UBound: number], hasReached: boolean) => void) => Promise<void>
    readonly doReferenceIfNecessary: () => Promise<void>
    readonly _setPosicaoInicial: (pulses: number) => Promise<void>
    readonly _setPosicaoFinal: (pulses: number) => Promise<void>
    readonly _waitUntilCurrentPositionIsAbout: (position: number, window: readonly [lowerBound: number, upperBound: number], monitor?: (currentPosition: number, tagetRange: readonly [LBound: number, UBound: number], hasReached: boolean) => void) => Promise<void>
    readonly _getStatusL: () => Promise<StatusL>
    readonly _forceLooseReference: () => Promise<void>
    readonly _printTest: () => Promise<void>
    readonly _getAbsolutePositionRange: () => readonly [min: number, max: number]
    readonly _setVelocity: (velocity: number) => Promise<void>
    readonly _setAcceleration: (acceleration: number) => Promise<void>
    readonly _setVelocityDefault: () => Promise<void>
    readonly _setAccelerationDefault: () => Promise<void>
    readonly _setPrintMessages: (p: PrintingPositions) => Promise<void>
    readonly _clearPrintingMessages: () => Promise<void>
    readonly _convertMilimeterToPulseIfNecessary: (position: number | Milimeter) => number
    readonly _convertAbsolutePulsesToMilimeter: (position: number) => Milimeter
    readonly _getEstimatedVelocity: () => Promise<number> // pulses per sec
    readonly _getEstimatedAcceleration: () => Promise<number> // pulses per sec per sec
    readonly _getTrajectory: () => Trajectory | undefined
    readonly _isSafePosition: (pos: number) => boolean // if position is inside axis range min,max
    readonly _moveRelative: (relativePos_: number | Milimeter) => Promise<void>
    //readonly _resetWithoutLooseReference: () => Promise<void>
}

export type Trajectory = ([position: number, timeStamp: number])[]

export const getAxisControler = (starterKit: AxisStarterKit): AxisControler => {
    
    type T = AxisControler

    const TRAJECTORY_HISTORY_LIMIT = 10000
    let trajectory: Trajectory | undefined = undefined

    const { 
        axisName,
        minAbsolutePosition, 
        maxAbsolutePOsition,
        milimeterToPulseRatio,
        velRef,
        acRef,
        defaultVelocity,
        defaultAcceleration,
        preReferenceConfig,
        afterReferenceConfig,
    } = starterKit


    const { portName, baudRate, channel} = Address[`Axis`][axisName]
        const tunnel = makeTunnel(portName, baudRate, channel)
        const transportLayer = makeTransportLayer(tunnel)


    const isReferenced: T['isReferenced'] = async () => {
        const status = await _getStatusL()
        const isReferenced = status.referenciado
        return isReferenced
    }

    const isMoving: T['isMoving'] = async () => {
        const pos0 = await getCurrentAbsolutePosition()
        const status = await _getStatusL()
        const pos1 = await getCurrentAbsolutePosition()
        const isNotMoving = pos1-pos0 === 0
        const isAccelerating = status.aceleracaoLigada === true || status.desaceleracaoLigada === true
        const isMoving = !isNotMoving || !isAccelerating
        return isMoving        
    }
  
    const start: T['_start'] = async () => {
        return transportLayer.set('Start serial', 'ligado')
    }

    const stop: T['_start'] = async () => {
        //FIX: For simplicity I'm using the loose reference routine
        //     but conceptually stop must just stop imediatelly the axis moviment
        //     without loosing the reference
        await _forceLooseReference()
        return
    }

    const getAxisName: T['getAxisName']  = () => axisName

    const getCurrentAbsolutePosition: T['getCurrentAbsolutePosition'] = async () => {
        const curPos = await getPosicaoAtual(portName, baudRate, channel)
        const timeStamp = now()
        if(trajectory!==undefined) {
            trajectory = [
                ...trajectory.slice(0,TRAJECTORY_HISTORY_LIMIT),
                [curPos, timeStamp]
            ]
        } else {
            trajectory = [[curPos, timeStamp]]
        }
        
        return curPos
        
    }

    const goToAbsolutePosition: T['goToAbsolutePosition'] = async (targetPosition_, kinematic, monitor) => {
        //FIX: Maybe be 1 or 2 pulses only
        const tightWindow = [3,3] as const // lower upper bound inclusive
        const targetPosition = _convertMilimeterToPulseIfNecessary(targetPosition_)
        const curPos = await getCurrentAbsolutePosition()
        const isSamePosition_ = async (): Promise<boolean> => { 
            const nextPosition = [targetPosition-tightWindow[0], targetPosition+tightWindow[1]] as const
            const isSamePosition = isInsideRange(curPos, nextPosition)
            return isSamePosition
        }
        const isSamePosition = await isSamePosition_()

        console.log(`Eixo=${axisName}, goToPosition: target=${targetPosition}, currentPos=${curPos}, isSame= ${isSamePosition}`)
        
        const setKinematicsIfNecessary = async () => {
            if (kinematic!==undefined) {
                const [vel, ac] = kinematic(defaultVelocity, defaultAcceleration)
                await _setVelocity(vel)
                await _setAcceleration(ac)
            } 
            return
        }

        const returnKinematicsToDefaultIfNecessary = async () => {
            if (kinematic!==undefined) {
                await _setVelocityDefault()
                await _setAccelerationDefault()
            } 
            return
        }

        const go = async () => {
            await _setPosicaoFinal(targetPosition)
            await start()
            await _waitUntilCurrentPositionIsAbout(targetPosition,tightWindow, monitor)
            return
        }

        if (isSamePosition===false) {
            await setKinematicsIfNecessary()
            await go()
            await returnKinematicsToDefaultIfNecessary()
            return 
        } else {
            return
        }
    }

    const doReferenceIfNecessary: T['doReferenceIfNecessary'] = async () =>{
        const isReferenced_ = await isReferenced()
        if (isReferenced_===true) {
            return
        } else {
            await preReferenceConfig(axisName, velRef, acRef)
            await start()
            while(await isReferenced()===false) {

            }
            await afterReferenceConfig(axisName, minAbsolutePosition, maxAbsolutePOsition, defaultVelocity, defaultAcceleration)
        }  
    }
        

    const _setPosicaoInicial: T['_setPosicaoInicial'] = async (positionInPulses) => {
        await transportLayer.set('Posicao inicial', Pulses(positionInPulses)) //TODO: Remove this type cast
        return 
    }

    const _setPosicaoFinal: T['_setPosicaoFinal'] = async (positionInPulses) => {
        await transportLayer.set('Posicao final', Pulses(positionInPulses)) //TODO: Remove this type cast
        return 
    }

    const _waitUntilCurrentPositionIsAbout: T['_waitUntilCurrentPositionIsAbout'] = async (position, window = [3,3], monitor ) => {
        // fix: timeout should be estimated based on current position, velocity and speed
        const timeout = 120000       
        const LBound = position-window[0]
        const UBound = position+window[1] 
        const targetPositionRange = [LBound, UBound] as const

        await WaitUntilTrueFastPooling(
            () => getCurrentAbsolutePosition(),
            curPos => {
                const hasReachedTargetPosition = isInsideRange(curPos, targetPositionRange)
                if(monitor!==undefined) {
                    monitor(curPos, targetPositionRange, hasReachedTargetPosition, )
                }
                return isInsideRange(curPos, targetPositionRange)
            },
            timeout,
        )

        return
    } 

    const _getStatusL: T['_getStatusL'] = async () => {
        const statusL = await getStatusLow(portName, baudRate, channel)
        return statusL
    }

    const _forceLooseReference: T['_forceLooseReference'] = async () => {
        const isReferenced = (await _getStatusL()).referenciado
        if (isReferenced===true) {
            await transportLayer.set('Pausa serial', 'ligado') 
            return
        } else {
            return
        }
    }

    const _printTest: T['_printTest'] = async () => {
        return await transportLayer.set('Teste de impressao serial', 'ligado')
    }

    const _getAbsolutePositionRange: T['_getAbsolutePositionRange'] = () => {
        return [minAbsolutePosition, maxAbsolutePOsition]
    }

    const _setVelocity: T['_setVelocity'] = async velocity => {
        await transportLayer.set('Velocidade de avanco', PulsesPerTick(velocity)) //TODO: Remove this type cast
        await transportLayer.set('Velocidade de retorno', PulsesPerTick(velocity)) //TODO: Remove this type cast
        return
    }

    const _setAcceleration: T['_setAcceleration'] = async acceleration => {
        await transportLayer.set('Aceleracao de avanco', PulsesPerTickSquared(acceleration)) //TODO: remove this type cast
        await transportLayer.set('Aceleracao de retorno', PulsesPerTickSquared(acceleration)) //TODO: remove this type cast
        return
    }

    const _setVelocityDefault: T['_setVelocityDefault'] = async () => {
        await transportLayer.set('Velocidade de avanco', PulsesPerTick(defaultVelocity)) //TODO: remove this type cast
        await transportLayer.set('Velocidade de retorno', PulsesPerTick(defaultVelocity)) //TODO: remove this type cast
        return
    }

    const _setAccelerationDefault: T['_setAccelerationDefault'] = async () => {
        await transportLayer.set('Aceleracao de avanco', PulsesPerTickSquared(defaultAcceleration)) //TODO: remove this type cast
        await transportLayer.set('Aceleracao de retorno', PulsesPerTickSquared(defaultAcceleration)) //TODO: remove this type cast
        return
    }

    const _setPrintMessages: T['_setPrintMessages'] = async (settings) => {
        const { 
            numeroDeMensagensNoAvanco,
            numeroDeMensagensNoRetorno,
            posicaoDaPrimeiraMensagemNoAvanco,
            posicaoDaPrimeiraMensagemNoRetorno,
            posicaoDaUltimaMensagemNoAvanco,
            posicaoDaUltimaMensagemNoRetorno,
        } = settings

        await transportLayer.set('Numero de mensagem no avanco', numeroDeMensagensNoAvanco)
        await transportLayer.set('Numero de mensagem no retorno', numeroDeMensagensNoRetorno)
        await transportLayer.set('Posicao da primeira impressao no avanco', Pulses(posicaoDaPrimeiraMensagemNoAvanco)) //TODO: Remove those types cast
        await transportLayer.set('Posicao da ultima mensagem no avanco', Pulses(posicaoDaUltimaMensagemNoAvanco))
        await transportLayer.set('Posicao da primeira impressao no retorno', Pulses(posicaoDaPrimeiraMensagemNoRetorno))
        await transportLayer.set('Posicao da ultima mensagem no retorno', Pulses(posicaoDaUltimaMensagemNoRetorno))
        return
    }

    const _clearPrintingMessages: T['_clearPrintingMessages'] = async () => {
        await transportLayer.set('Numero de mensagem no avanco', 0)
        await transportLayer.set('Numero de mensagem no retorno', 0)
        return  
    }

    const _convertMilimeterToPulseIfNecessary: T['_convertMilimeterToPulseIfNecessary'] = position => {
        if (typeof position === 'number') {
            return position
        } else {
            const value = position.value
            switch(position.kind) {
                case 'Milimeter': return Math.round(value / milimeterToPulseRatio)
            } 
        }
    }

    const _convertAbsolutePulsesToMilimeter:T['_convertAbsolutePulsesToMilimeter'] = pulses => {
        const value = pulses * milimeterToPulseRatio
        return Milimeter(value)
    }

    const _getEstimatedVelocity: T['_getEstimatedVelocity'] = async () => {
        //Fix:  When to read direct the position and when to use cached trajectory information?
        //      what whould imply in this decision
        //      How not to rush the communication channel with not urgent data? 
        //      What the trade-offs evolved? (ie: accuracy, precision vs ???)
        const s0 = await getCurrentAbsolutePosition()
        const t0 = now()
        const s1 = await getCurrentAbsolutePosition()
        const t1 = now()
        const isStoped = s0===s1
        if (isStoped) {
            return 0
        } else {
            const ds = s1 - s0
            const dt = t1 - t0
            const v = ds/dt
            const v_ = v*1000 // by sec instead of by milisec
            return v_ // pulses per sec (vectorial which means velocity may be negative or positive)
        }
    }

    const _getEstimatedAcceleration: T['_getEstimatedAcceleration'] = async () => {
        // Fix: we're reading 4 space positions (2 velocities, ie: s0,s1,s2,s3), but should be more eficient
        // to read only 3 space positions (ie: s0,s1,s2)
        const v0 = await _getEstimatedVelocity()
        const t0 = now()
        const v1 = await _getEstimatedVelocity()
        const t1 = now()
        const noAcceleration = v0===v1
        if (noAcceleration) {
            return 0
        } else {
            const dv = v1 - v0
            const dt = t1 - t0
            const a = dv/dt
            const a_ = a*1000 // by sec instead of by milisec
            return a_ // pulses per sec (vectorial which means velocity may be negative or positive)
        }
    }

    const _getTrajectory: T['_getTrajectory'] = () => {
        //fix: I would this function just return trajectory instead trajectory | undefined !
        return trajectory
    }

    const _isSafePosition: T['_isSafePosition'] = (pos) => {
        const [min, max] = _getAbsolutePositionRange()
        const isPositionSafe = isInsideRange(pos,[min, max])
        return isPositionSafe
    }

    const _moveRelative: T['_moveRelative'] = async (relativePos_) => {
        const relativePos = _convertMilimeterToPulseIfNecessary(relativePos_)
        const [min, max] = await _getAbsolutePositionRange()
        const currentPos = await getCurrentAbsolutePosition()
        const nextPos = Math.round(currentPos+relativePos)
        const isNextPositionValid = _isSafePosition(nextPos)
        if (isNextPositionValid===true) {
            await goToAbsolutePosition(nextPos)
        }
        return 
        
    }

    return {
        isReferenced,
        isMoving,
        _start: start,
        _stop: stop,
        getAxisName,
        getCurrentAbsolutePosition: getCurrentAbsolutePosition,
        goToAbsolutePosition: goToAbsolutePosition,
        doReferenceIfNecessary,
        _setPosicaoInicial,
        _setPosicaoFinal,
        _waitUntilCurrentPositionIsAbout,
        _getStatusL,
        _forceLooseReference,
        _printTest,
        _getAbsolutePositionRange,
        _setVelocity,
        _setAcceleration,
        _setVelocityDefault,
        _setAccelerationDefault,
        _setPrintMessages,
        _clearPrintingMessages,
        _convertMilimeterToPulseIfNecessary,
        _convertAbsolutePulsesToMilimeter,
        _getEstimatedAcceleration,
        _getEstimatedVelocity,
        _getTrajectory,
        _isSafePosition,
        _moveRelative,
    }
}

