import { delay } from "../utils/delay"
import { setParam_ } from "./cmpp-memmap-layer"
import { Milimeter } from "./displacement"
import { fetchCMPPStatusL, StatusLCasted } from "./get-cmpp-status"
import { getPosicaoAtual } from "./get-pos-atual"
import { Address, Axis } from "./global"
import { Driver } from "./mapa_de_memoria"
import { executeInSequence, WaitUntilTrue } from "./promise-utils"
import { isInsideRange, now } from "./utils"

// ***********************************************************
// A generic Axis driver
// offers an CNC-like API (removing CMPP-classic behavior)
// Hides and wrap the CMPP-classic PCBoard API
// ***********************************************************

export type PrintingPositions = {
    readonly numeroDeMensagensNoAvanco: number,
    readonly numeroDeMensagensNoRetorno: number,
    readonly posicaoDaPrimeiraMensagemNoAvanco: number,
    readonly posicaoDaUltimaMensagemNoAvanco: number,
    readonly posicaoDaPrimeiraMensagemNoRetorno: number,
    readonly posicaoDaUltimaMensagemNoRetorno: number, 
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
    readonly _getStatusL: () => Promise<StatusLCasted>
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
}

export type AxisStarterKit = {
    readonly axisName: Axis
    readonly minAbsolutePosition: number //in pulses
    readonly maxAbsolutePOsition: number //in pulses
    readonly milimeterToPulseRatio: number 
    readonly velRef: number,
    readonly acRef: 3000,
    // todo: positionResolution = [3,3] //in pulses
    readonly defaultVelocity: number,
    readonly defaultAcceleration: number,
    readonly preReferenceConfig: (axisName: Axis, velRef: number, acRef: number) => Promise<void> // used before config
    readonly afterReferenceConfig: (axisName: Axis, min: number, max: number, defaultVelocity: number, defaultAcceleration: number) => Promise<void> // represents the initial defaults

}

export const Z_AxisStarterKit: AxisStarterKit = {
    axisName: 'ZAxis',
    minAbsolutePosition: 610,
    maxAbsolutePOsition: 2610,
    milimeterToPulseRatio: ((12.97+12.32)/2)/100,
    velRef: 350,
    acRef: 3000,
    defaultVelocity: 400,
    defaultAcceleration: 5000,
    preReferenceConfig: (axisName: Axis, velRef, acRef) => {
        const { portName, baudRate, channel} = Address[`Axis`][axisName]
        const axis = setParam_(portName,baudRate,channel)(Driver)

        return executeInSequence([
            //Atencao: O sensor da gaveta 1 parece estar ligado no pino do start entre eixos de uma das placas
            //por esta razao, antes de tudo é necessario desabilitar o start entre eixos das placas
            () => axis('Start externo habilitado', false),
            () => axis('Entrada de start entre eixo habilitado', false),
            () => axis('Saida de start no avanco ligado', false),
            () => axis('Saida de start no retorno ligado', false),
            //
            () => axis('Start automatico no avanco ligado', false),
            () => axis('Start automatico no retorno ligado', false),
            //O eixo Z é vertical, por isto a corrente nele é mantida em máxima
            //As correcoes são desligadas para evitar a situacao onde o motor seja desenergijado
            //e o cabeçote caia sem aviso previo.
            // FIX: O referenciamento do eixo Z deveria ser monitorado, de modo que uma perda da referencia no Z deveria levar aos demais eixos a parar
            // como medida preventiva
            () => axis('Reducao do nivel de corrente em repouso', false),
            () => axis('Zero Index habilitado p/ protecao', true), // veja FIX acima (nao foi ainda implementado por completo!)
            () => axis('Zero Index habilitado p/ correcao', false),
            // uma velocidade de referencia nao muito alta por se tratar do eixo vertical
            () => axis('Velocidade de referencia', velRef),
            () => axis('Aceleracao de referencia', acRef),
            // necessario para referencia quando o equipamento é ligado ou foi forçado a perda da referencia
            // remove pausa serial
            () => axis('Pausa serial', false),
            // parece ser necessario um delay para que a placa processe estas
            // informacoes antes de receber o start
            // talvez este seja o motivo de algumas vezes na referencia, o eixo sair correndo velozmente
            // acompanhar se isto resolverá este problema em definitivo
            () => delay(1500), 
        ])
    },
    afterReferenceConfig: async (axisName, min, max, defaultVelocity, defaultAcceleration) => {
        const { portName, baudRate, channel} = Address[`Axis`][axisName]
        const axis = setParam_(portName,baudRate,channel)(Driver)
        return executeInSequence([
            () => axis('Posicao inicial', min),
            () => axis('Posicao final', max),
            () => axis('Velocidade de avanco', defaultVelocity), //400
            () => axis('Velocidade de retorno', defaultVelocity), //600
            () => axis('Aceleracao de avanco', defaultAcceleration),
            () => axis('Aceleracao de retorno', defaultAcceleration),
            () => axis('Start automatico no avanco ligado', false),
            () => axis('Start automatico no retorno ligado', false),
        ])
    }
}

export const X_AxisStarterKit: AxisStarterKit = {
    axisName: 'XAxis',
    minAbsolutePosition: 610,
    maxAbsolutePOsition: 8300,
    milimeterToPulseRatio: 152.87/1000,
    velRef: 350,
    acRef: 3000,
    defaultVelocity: 2000,
    defaultAcceleration: 4000,
    preReferenceConfig: (axisName: Axis, velRef, acRef) => {
        const { portName, baudRate, channel} = Address[`Axis`][axisName]
        const axis = setParam_(portName,baudRate,channel)(Driver)

        return executeInSequence([
            //Atencao: O sensor da gaveta 1 parece estar ligado no pino do start entre eixos de uma das placas
            //por esta razao, antes de tudo é necessario desabilitar o start entre eixos das placas
            () => axis('Start externo habilitado', false),
            () => axis('Entrada de start entre eixo habilitado', false),
            () => axis('Saida de start no avanco ligado', false),
            () => axis('Saida de start no retorno ligado', false),
            //
            () => axis('Start automatico no avanco ligado', false),
            () => axis('Start automatico no retorno ligado', false),
            //
            () => axis('Reducao do nivel de corrente em repouso', true),
            () => axis('Zero Index habilitado p/ protecao', true), // veja FIX acima (nao foi ainda implementado por completo!)
            () => axis('Zero Index habilitado p/ correcao', false),
            // uma velocidade de referencia nao muito alta por se tratar do eixo vertical
            () => axis('Velocidade de referencia', velRef),
            () => axis('Aceleracao de referencia', acRef),
            // necessario para referencia quando o equipamento é ligado ou foi forçado a perda da referencia
            // remove pausa serial
            () => axis('Pausa serial', false),
            // parece ser necessario um delay para que a placa processe estas
            // informacoes antes de receber o start
            // talvez este seja o motivo de algumas vezes na referencia, o eixo sair correndo velozmente
            // acompanhar se isto resolverá este problema em definitivo
            () => delay(1500), 
        ])
    },
    afterReferenceConfig: async (axisName, min, max, defaultVelocity, defaultAcceleration) => {
        const { portName, baudRate, channel} = Address[`Axis`][axisName]
        const axis = setParam_(portName,baudRate,channel)(Driver)
        return executeInSequence([
            () => axis('Posicao inicial', min),
            () => axis('Posicao final', max),
            () => axis('Velocidade de avanco', defaultVelocity), 
            () => axis('Velocidade de retorno', defaultVelocity),
            () => axis('Aceleracao de avanco', defaultAcceleration),
            () => axis('Aceleracao de retorno', defaultAcceleration),
            () => axis('Start automatico no avanco ligado', false),
            () => axis('Start automatico no retorno ligado', false),
        ])
    }
}


export const Y_AxisStarterKit: AxisStarterKit = {
    axisName: 'YAxis',
    minAbsolutePosition: 610,
    maxAbsolutePOsition: 7310,
    milimeterToPulseRatio: 69.82/1000, //1. 7.22/100, 2. 69.82/1000
    velRef: 350,
    acRef: 3000,
    defaultVelocity: 1000,
    defaultAcceleration: 1500,
    preReferenceConfig: (axisName: Axis, velRef, acRef) => {
        const { portName, baudRate, channel} = Address[`Axis`][axisName]
        const axis = setParam_(portName,baudRate,channel)(Driver)

        return executeInSequence([
            //Atencao: O sensor da gaveta 1 parece estar ligado no pino do start entre eixos de uma das placas
            //por esta razao, antes de tudo é necessario desabilitar o start entre eixos das placas
            () => axis('Start externo habilitado', false),
            () => axis('Entrada de start entre eixo habilitado', false),
            () => axis('Saida de start no avanco ligado', false),
            () => axis('Saida de start no retorno ligado', false),
            //desliga modo passo a passo e garante modo continuo,
            () => axis('Numero de mensagem no avanco', 0),
            () => axis('Numero de mensagem no retorno', 0),
            () => axis('Modo continuo/passo a passo', false),
            //
            () => axis('Start automatico no avanco ligado', false),
            () => axis('Start automatico no retorno ligado', false),
            //
            () => axis('Reducao do nivel de corrente em repouso', true),
            () => axis('Zero Index habilitado p/ protecao', true), // veja FIX acima (nao foi ainda implementado por completo!)
            () => axis('Zero Index habilitado p/ correcao', false),
            // uma velocidade de referencia nao muito alta por se tratar do eixo vertical
            () => axis('Velocidade de referencia', velRef),
            () => axis('Aceleracao de referencia', acRef),
            // necessario para referencia quando o equipamento é ligado ou foi forçado a perda da referencia
            // remove pausa serial
            () => axis('Pausa serial', false),
            // parece ser necessario um delay para que a placa processe estas
            // informacoes antes de receber o start
            // talvez este seja o motivo de algumas vezes na referencia, o eixo sair correndo velozmente
            // acompanhar se isto resolverá este problema em definitivo
            () => delay(1500), 
        ])
    },
    afterReferenceConfig: async (axisName, min, max, defaultVelocity, defaultAcceleration) => {
        const { portName, baudRate, channel} = Address[`Axis`][axisName]
        const axis = setParam_(portName,baudRate,channel)(Driver)
        return executeInSequence([
            () => axis('Posicao inicial', min),
            () => axis('Posicao final', max),
            () => axis('Velocidade de avanco', defaultVelocity), 
            () => axis('Velocidade de retorno', defaultVelocity), 
            () => axis('Aceleracao de avanco', defaultAcceleration),
            () => axis('Aceleracao de retorno', defaultAcceleration),
            () => axis('Start automatico no avanco ligado', false),
            () => axis('Start automatico no retorno ligado', false),
        ])
    }
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
    const axis = setParam_(portName,baudRate,channel)(Driver)


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
        return axis('Start serial', true)
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
        await axis('Posicao inicial', positionInPulses)
        return 
    }

    const _setPosicaoFinal: T['_setPosicaoFinal'] = async (positionInPulses) => {
        await axis('Posicao final', positionInPulses)
        return 
    }

    const _waitUntilCurrentPositionIsAbout: T['_waitUntilCurrentPositionIsAbout'] = async (position, window = [3,3], monitor ) => {
        // fix: timeout should be estimated based on current position, velocity and speed
        const timeout = 120000       
        const LBound = position-window[0]
        const UBound = position+window[1] 
        const targetPositionRange = [LBound, UBound] as const
        await WaitUntilTrue(
            async () => {
                const vel = await _getEstimatedVelocity()
                const ac = await _getEstimatedAcceleration()
                const pos = await getCurrentAbsolutePosition()
                console.log(`Est. velocity=${vel.toFixed(2)}, Est. acceleration=${ac.toFixed(2)}`)
                return pos
            },
            curPos => {
                const hasReachedTargetPosition = isInsideRange(curPos, targetPositionRange)
                if(monitor!==undefined) {
                    monitor(curPos, targetPositionRange, hasReachedTargetPosition, )
                }
                return isInsideRange(curPos, targetPositionRange)
            },
            600, //FIX: how to optimize and generalize this value?
            timeout,
        )

        return
    } 

    const _getStatusL: T['_getStatusL'] = async () => {
        const statusL = await fetchCMPPStatusL(portName, baudRate, channel)
        return statusL
    }

    const _forceLooseReference: T['_forceLooseReference'] = async () => {
        const isReferenced = (await _getStatusL()).referenciado
        if (isReferenced===true) {
            await axis('Pausa serial', true)
            return
        } else {
            return
        }
    }

    const _printTest: T['_printTest'] = async () => {
        return await axis('Teste de impressao serial', true)
    }

    const _getAbsolutePositionRange: T['_getAbsolutePositionRange'] = () => {
        return [minAbsolutePosition, maxAbsolutePOsition]
    }

    const _setVelocity: T['_setVelocity'] = async velocity => {
        await axis('Velocidade de avanco', velocity)
        await axis('Velocidade de retorno', velocity)
        return
    }

    const _setAcceleration: T['_setAcceleration'] = async acceleration => {
        await axis('Aceleracao de avanco', acceleration)
        await axis('Aceleracao de retorno', acceleration)
        return
    }

    const _setVelocityDefault: T['_setVelocityDefault'] = async () => {
        await axis('Velocidade de avanco', defaultVelocity)
        await axis('Velocidade de retorno', defaultVelocity)
        return
    }

    const _setAccelerationDefault: T['_setAccelerationDefault'] = async () => {
        await axis('Aceleracao de avanco', defaultAcceleration)
        await axis('Aceleracao de retorno', defaultAcceleration)
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

        await axis('Numero de mensagem no avanco', numeroDeMensagensNoAvanco)
        await axis('Numero de mensagem no retorno', numeroDeMensagensNoRetorno)
        await axis('Posicao da primeira impressao no avanco', posicaoDaPrimeiraMensagemNoAvanco)
        await axis('Posicao da ultima mensagem no avanco', posicaoDaUltimaMensagemNoAvanco)
        await axis('Posicao da primeira impressao no retorno', posicaoDaPrimeiraMensagemNoRetorno)
        await axis('Posicao da ultima mensagem no retorno', posicaoDaUltimaMensagemNoRetorno)
        return
    }

    const _clearPrintingMessages: T['_clearPrintingMessages'] = async () => {
        await axis('Numero de mensagem no avanco', 0)
        await axis('Numero de mensagem no retorno', 0)
        return  
    }

    const _convertMilimeterToPulseIfNecessary: T['_convertMilimeterToPulseIfNecessary'] = (position: number | Milimeter):number => {
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

