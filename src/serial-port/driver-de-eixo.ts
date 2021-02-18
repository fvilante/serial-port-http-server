

// A generic Axis driver
// offers an CNC-like API (removing CMPP-classic behavior)
// And wraps the CMPP-classic PCBoard API

import { Printer } from "typescript"
import { delay } from "../utils/delay"
import { setParam_ } from "./cmpp-memmap-layer"
import { fetchCMPPStatusL, StatusLCasted } from "./get-cmpp-status"
import { getPosicaoAtual } from "./get-pos-atual"
import { Address, Axis, Printers } from "./global"
import { LeMSinais } from "./le-sinais-da-maquina"
import { Driver } from "./mapa_de_memoria"
import { ExecuteInParalel, executeInSequence } from "./promise-utils"
import { WaitUntilTrue } from "./promise-utils"
import { now, Range } from "./utils"
import { fazLinhaXBranca, fazLinhaXPreta} from './imprime-matriz'
import { CommDriver } from "./communicate"
import { sendPrinter, sendPrinter2 } from './send-receive-printer'
import { mili2PulseX, PosicaoInicialX } from "./referencia_eixos"
//import { ProgramaImpressora } from "./programa-impressora"


export type Milimeter = {
    kind: 'Milimeter'
    value: number
}
export const Milimeter = (value: number): Milimeter => ({kind: 'Milimeter', value})

export type ImpressoesX = readonly [
    readonly [x0: number, x1: number],
    readonly [x2: number, x3: number],
    readonly [x4: number, x5: number],
]

//type ImpressoesX = readonly number[]


type Job__ = {
    // Proxy
    partNumber: string
    barCode: string
    // Message
    printer: Printers
    msg: string
    passes?: number
    remoteFieldId: number // selection of remote field -> normally 1 to 4 (inclusive-both-sides) but theoretically any number between 1 and 99
    // Message kinematics
    printVelocity: number // in pulses per 1024 milisec  // fix: Not implemented

    // Print positions
    zLevel: number // mm in relation to MinZ //Fix: Should be safe move (and give back an clear error msg if user try to access an physically impossible position)
    impressoesX: ImpressoesX
    linhasY: readonly number[]

}

/*
const { portName:portNameX, baudRate:baudRateX, channel:channelX} = Address[`Axis`]['XAxis']
const X = setParam_(portNameX,baudRateX,channelX)(Driver)

const { portName:portNameY, baudRate:baudRateY, channel:channelY} = Address[`Axis`]['YAxis']
const Y = setParam_(portNameY,baudRateY,channelY)(Driver)
*/

// helper
//window is inclusive bound in both sides
const isInsideRange = (x: number, range: readonly [lowerBoundInclusive: number, upperBoundInclusive: number]) => {
    const lowerBound = range[0]
    const upperBound = range[1]
    const isInsideRange_ = ((x>=lowerBound) && (x<=upperBound)) 
    return isInsideRange_
        ? true
        : false
}

type PrintingPositions = {
    readonly numeroDeMensagensNoAvanco: number,
    readonly numeroDeMensagensNoRetorno: number,
    readonly posicaoDaPrimeiraMensagemNoAvanco: number,
    readonly posicaoDaUltimaMensagemNoAvanco: number,
    readonly posicaoDaPrimeiraMensagemNoRetorno: number,
    readonly posicaoDaUltimaMensagemNoRetorno: number, 
}

type NumericRange = readonly [LBound: number, UBound: number]

/*
type GoToPositionCB = (settings: {
    readonly targetPosition: number
    readonly velocity: number
    readonly acceleration: number
    readonly 
    readonly monitor: (currentPosition: number, target: readonly [position: number, targetRange: NumericRange], hasReached: boolean) => Promise<void>,
    readonly interceptor: (currentPosition: number, axis: ) => Promise<void>
    readonly minAbsolutePosition: number, // in pulses
    readonly maxAbsolutePOsition: number, // in pulses
    readonly milimeterPerPulseRatio: number,
}) => Promise<GoToPositionCBResult>
*/

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

type AxisStarterKit = {
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

const Z_AxisStarterKit: AxisStarterKit = {
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

const X_AxisStarterKit: AxisStarterKit = {
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


const Y_AxisStarterKit: AxisStarterKit = {
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

type Trajectory = ([position: number, timeStamp: number])[]

const getAxisControler = (starterKit: AxisStarterKit): AxisControler => {
    
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

//
/*
type ImpressoesX = readonly [
    readonly [x0: number, x1: number],
    readonly [x2: number, x3: number],
    readonly [x4: number, x5: number],
]*/

type Job = {
    readonly remoteFieldIndex: number
    readonly text: string,
    readonly printer: Printers,
    readonly zPosition: number,
    readonly xyPositions: readonly {y: number, xs: ImpressoesX}[],
    readonly printSpeed: number
}

export type MachineControler = {
    safelyReferenceSystemIfNecessary: () => Promise<void>
    parkSafelyIfItisPossible: () => Promise<void>
    doOneJob: (job: Job) => Promise<void>
    _assureZisSafe: () => Promise<void>
}

const MachineControler = async (
    axisCommanders: {x: AxisControler, y: AxisControler, z: AxisControler}
    ): Promise<MachineControler> => {

        type T = MachineControler

        const {x, y, z} = axisCommanders

        const safelyReferenceSystemIfNecessary:T['safelyReferenceSystemIfNecessary'] = async () => {
            const referenceXandYIfNecessary = async () => {
                await ExecuteInParalel([
                    () => x.doReferenceIfNecessary(),
                    () => y.doReferenceIfNecessary(),
                ]) 
                return
            }
            //FIX: I'm not being completely eficient here, because I'm
            //     performing same device call multiple times in both
            //     functions below
            //     solution: to cache response or to improve logic (or both)
            await _assureZisSafe()
            await referenceXandYIfNecessary()
            return
        }

        const parkSafelyIfItisPossible: T['parkSafelyIfItisPossible'] = async () => {
            const [xIsRef, yIsRef, zIsRef] = await ExecuteInParalel([
                () => x.isReferenced(),
                () => y.isReferenced(),
                () => z.isReferenced(),
            ] as const)

            const performParking = async () => {
                const [minY, maxY] = y._getAbsolutePositionRange()
                const XMeiodaJanela = 2500
                const YfrenteDaMaquina = maxY
                await ExecuteInParalel([
                    () => executeInSequence([
                        () => x.goToAbsolutePosition(XMeiodaJanela),
                        () => x._forceLooseReference(),
                    ]),
                    () => executeInSequence([
                        () => y.goToAbsolutePosition(YfrenteDaMaquina),
                        () => y._forceLooseReference(),
                    ])
                ])
                return
            }

            const isSafeToPark = (xIsRef && yIsRef) && zIsRef

            if (isSafeToPark) {
                await performParking()
            } else {
                // not safe to peform park
                // Fix: What should I do here? Should I assure Y is safe (and have the cost to hereference all the system just to park?)
                //      I want to avoid do lots of moviments without any log information, because in Maintanence Mode some akward behavior may happen
                //      I should think a solution for this (how to log information and improve maintenance mode (fail mode))
                //      Currently I'm doing nothing (without no feed back to the caler :( ))
                return
            }
            
        }

        const doOneJob: T['doOneJob'] = async (job) => {

            const { 
                printSpeed,
                text,
                remoteFieldIndex,
                printer,
                xyPositions,
                zPosition,
               
            } = job

            //Assure Z is safe, before perform the job
            //Only job has autorith to move down Z
            await _assureZisSafe()

            // program printer
            //await ProgramaImpressora(printer,remoteFieldIndex,text)
            //
            await z.goToAbsolutePosition(zPosition)
            //
            for (const nextLine of xyPositions.values()) {
                const xs = nextLine.xs
                const impressoes = xs
                // position y
                await y.goToAbsolutePosition(nextLine.y)
                // first print
                if (printer ==='printerWhite') {
                    //await fazLinhaXBranca(impressoes)
                } else {
                    //await fazLinhaXPreta(impressoes)
                }
                
            }

            //Put Z at a safe position at job end
            await _assureZisSafe()
        }

        // Z is safe if:
        //  - It is at the safe position
        //  - Otherwise Z is not safe
        // If Z is unreferenced all other axis are stopped
        //  then Z is referenced first, and it go to MINY position, 
        //  then others axis can be referenced in parallel if necessary
        // FIX: The logic should improve to preserve X and Y reference if possible
        //      I'm not being efficient at not lossing X and Y reference if possible
        const _assureZisSafe = async () => {
            // FIX: See ideas bellow
            // what if only a job can move down Z, otherwise it is aways at safe position?
            // how to park Z definetely and unsafly? 
            const [minZ, maxZ] = z._getAbsolutePositionRange()    
            const zIsRef = await z.isReferenced()
           
            const stopAxisIfItIsMoving = async (axis: AxisControler): Promise<void> => {
                const isMoving = await axis.isMoving()
                if (isMoving===true) {
                    await x._stop()
                }
                return
            }

            const stopXandY = async () => {
                await ExecuteInParalel([
                    () => x._stop(),
                    () => y._stop(),
                ])
                return 
            }
            
            const isZCurrentAtASafePosition = async (): Promise<boolean> => {
                
                if (zIsRef===true) {
                    const zSafePositionRange = [minZ-10,minZ+10] as const
                   
                    const zCurrentPosition = await z.getCurrentAbsolutePosition()
            
                    const zIsAtSafePosition = isInsideRange(zCurrentPosition, zSafePositionRange)
                    return zIsAtSafePosition
                } else {
                    //Z is not referenced, so it is not safe
                    return false
                }
                
            }

            const isZCurrentAtASafePosition_ = await isZCurrentAtASafePosition()
            
            if(isZCurrentAtASafePosition_===false) {
                //Fix: Supose Z is down (or not referenced), if X and Y are not moving you do not need to stop it. 
                //You should monitor X and Y while you are putting Z at a safe state, and only to
                //produce effect on Y or Y if they try to move, otherwise you should not touch them
                await stopXandY()
                await z.doReferenceIfNecessary()
                await z.goToAbsolutePosition(minZ)
            } 

            // Z is safe and referenced here !
            
            await ExecuteInParalel([
                () => x.doReferenceIfNecessary(),
                () => y.doReferenceIfNecessary(),
            ]) 

            // X,Y and Z are referenced here, and Z is at his safe position

            
            return

        }

        return {
            safelyReferenceSystemIfNecessary,
            parkSafelyIfItisPossible: parkSafelyIfItisPossible,
            doOneJob,
            _assureZisSafe,
        }
}


const Test1 = async () => {

    const z = getAxisControler(Z_AxisStarterKit)

    await z.doReferenceIfNecessary()

    const pa1 = await z.getCurrentAbsolutePosition()
    const pf1 = pa1+150
    await delay(1000)
    console.log( `No momento o eixo esta na posicao ${pa1}.`)
    console.log(` será movimentado para posicao ${pf1}, aguarde`)
    await z.goToAbsolutePosition(pf1)
    await delay(1000)
    console.log(` concluido.`)
    const pa2 = await z.getCurrentAbsolutePosition()
    console.log( `No momento o eixo esta na posicao ${pa2}.`)
    console.log(`Agora vou puxar a posicao final 50 pulsos pra baixo`)
    const pf2 = pa2 + 50
    await z.goToAbsolutePosition(pf2)
    console.log(` concluido.`)
    const pa3 = await z.getCurrentAbsolutePosition()
    console.log( `No momento o eixo esta na posicao ${pa3}.`)
    console.log(`Agora vou puxar a posicao final 50 pulsos pra baixo`)
    const pf3 = pa3 + 50
    await z.goToAbsolutePosition(pf3)

    //volta
    console.log(` concluido.`)
    const pa4 = await z.getCurrentAbsolutePosition()
    console.log( `No momento o eixo esta na posicao ${pa4}.`)
    console.log(`Agora vou puxar a posicao final 200 pulsos pra cima`)
    const pf4 = pa4 - 200
    await z.goToAbsolutePosition(pf4)
    console.log(` concluido.`)
    const pa5 = await z.getCurrentAbsolutePosition()
    console.log( `No momento o eixo esta na posicao ${pa5}.`)
    console.log('Finalizado')
}

const Test2 = async () => {

    const z = getAxisControler(Z_AxisStarterKit)

    await z.doReferenceIfNecessary()

    const poss = [700, 750, 850, 900, 1000, 1100, 1150, 800, 700, 1200, 700, 800, 700]

    const arr = poss.map(  pos => async () => {
        console.log(`-----------------------------`)
        const p0 = await z.getCurrentAbsolutePosition()
        console.log(`Voce esta na posicao ${p0}`)
        console.log(`Buscando posicao ${pos}, aguarde`)
        await z.goToAbsolutePosition(pos)
        console.log(`pronto.`)
        const p1 = await z.getCurrentAbsolutePosition()
        console.log( `No momento o eixo esta na posicao ${p1}.`)
        return

    })

    return executeInSequence(arr)
    

}

const Test3 = async () => {

    const z = getAxisControler(Z_AxisStarterKit)

    await z.doReferenceIfNecessary()
    await z.goToAbsolutePosition(1620);
    await z._forceLooseReference();
    await z.doReferenceIfNecessary();

    const arr = [...Range(650,1500,250), ...Range(1500,650,-250)].map( pos => async () => {
        console.log(`-----------------------------`)
        const p0 = await z.getCurrentAbsolutePosition()
        console.log(`Voce esta na posicao ${p0}`)
        console.log(`Buscando posicao ${pos}, aguarde`)
        await z.goToAbsolutePosition(pos)
        console.log(`pronto.`)
        const p1 = await z.getCurrentAbsolutePosition()
        console.log( `No momento o eixo esta na posicao ${p1}.`)
        return
    })
    const x = executeInSequence(arr)


}

const Test4 = async () => {

    const z = getAxisControler(Z_AxisStarterKit)

    await z.doReferenceIfNecessary()

    const arr = Range(1640,1680,10).map( pos => async () => {
        console.log(`indo para a posicao ${pos}`)
        await z.goToAbsolutePosition(pos)
        await delay(1500)
        return
    })
    const x = executeInSequence(arr)


}

const Test5 = async () => {

    const z = getAxisControler(Z_AxisStarterKit)

    await z.doReferenceIfNecessary()

    await z.goToAbsolutePosition(1620);
    await z._forceLooseReference();
    await z.doReferenceIfNecessary();
    await z.goToAbsolutePosition(700)
    await z._printTest()
    await z.goToAbsolutePosition(1200)
    await z._printTest()
    

}

const Test6 = async () => {

    const z = getAxisControler(Z_AxisStarterKit)
    const x = getAxisControler(X_AxisStarterKit)

    const xIsRef = await x.isReferenced()

    //assure z is UP before move X
    const assureYisSafe = async () => {
        const zIsRef = await z.isReferenced()
        const [minZ, maxZ] = z._getAbsolutePositionRange()       
        if(zIsRef) {
            await z.goToAbsolutePosition(minZ)
            return
        } else {
            await z.doReferenceIfNecessary()
            await z.goToAbsolutePosition(minZ)
            return
        }

    }

    const referenceXIfNecessary = async () => {
        await x.doReferenceIfNecessary()
        return
    }

    const findLastPosiionX = async () => {
        type Monitor = (pos: number, target: readonly [number, number]) => void
        const monitor: Monitor = (curPos, target) => {
            console.log(`Buscando posicao ${target}, posicao_atual=${curPos}, targetRange=${target}`)
        }
        
        const [minX, maxX] = x._getAbsolutePositionRange() 
        console.log(`Comecando a brincadeira`)
        console.log(`Buscando posicao ${minX}, posicao_atual=${await x.getCurrentAbsolutePosition()}`)
        console.log('1')
        await x.goToAbsolutePosition(minX, undefined, monitor ) 
        console.log('2')
        await x.goToAbsolutePosition(maxX, undefined, monitor)
        console.log('3')
        await x.goToAbsolutePosition(maxX, undefined, monitor)
        await x.goToAbsolutePosition(minX, undefined, monitor) 
        console.log('4')
        const arr = Range(minX, maxX, 800).map( pos => async () => {
            await x.goToAbsolutePosition(pos, undefined, monitor)
            return 
        })
        await executeInSequence(arr)
        console.log('4')
        await x.goToAbsolutePosition(maxX, undefined, monitor) 
        await delay(1000)
        console.log('5')
        await x.goToAbsolutePosition(minX, undefined, monitor) 
        return
    }
    //await x._forceLooseReference()
    await assureYisSafe()
    await referenceXIfNecessary()
    await findLastPosiionX()


}


const Test7 = async () => {

    const z = getAxisControler(Z_AxisStarterKit)
    const x = getAxisControler(X_AxisStarterKit)
    const y = getAxisControler(Y_AxisStarterKit)

    const m = await MachineControler({x,y,z})

    const doAOperationWithAxis = async (axis: AxisControler) => {
        console.log(`--> Tou no Axis ${axis.getAxisName()}.`)
        console.log('dando um delay pra ver se resolve o erro')
        await delay(2000)
        type Monitor = (pos: number, target: readonly [number, number]) => void
        const monitor: Monitor = (curPos, target) => {
            //console.log(`Eixo ${axis.getAxisName()}: Buscando posicao ${target}, posicao_atual=${curPos}, targetRange=${target}`)
        }

        if (axis.getAxisName()==='ZAxis') {
            throw new Error('Com eixo Z nao se brinca')
        }
        const [min_, max_] = axis._getAbsolutePositionRange()
        let min = min_
        let max = max_
        if(axis.getAxisName()==='XAxis') {
            max = max*0.5
        }
        console.log(`Comecando a brincadeira:`)
        console.log(`Buscando posicao ${min}, posicao_atual=${await axis.getCurrentAbsolutePosition()}`)
        console.log('1')
        await ExecuteInParalel([
            () => axis.goToAbsolutePosition(min, undefined, monitor), 
        ])

        console.log('2')
        await axis.goToAbsolutePosition(max, undefined,monitor)
        console.log('3')
        await axis.goToAbsolutePosition(min, undefined, monitor) 
        console.log('4')
        const step = Math.floor(max-min)/7
        const arr = Range(min, max, step).map( pos => async () => {
            await axis.goToAbsolutePosition(pos, (v,a) => {  
                const new_v = 
                    axis.getAxisName()==='YAxis' 
                        ? v*2 
                        : axis.getAxisName()==='XAxis'
                            ? Math.floor(v/3)
                            : v
                return [new_v,a] 
            }, monitor)
            await delay(300)
            return 
        })
        await executeInSequence(arr)
        console.log('5')
        await axis.goToAbsolutePosition(max, undefined,monitor)
    }

    await m.parkSafelyIfItisPossible()
    await m.safelyReferenceSystemIfNecessary()
    /*await ExecuteInParalel([
        () => doAOperationWithAxis(x),
        () => doAOperationWithAxis(y),
    ])*/

    doAOperationWithAxis(y);
    doAOperationWithAxis(x);

    

}


const Test7B = async () => {
    // define pulse per milimeter ratio for each axis
    const z_UNSAFE = getAxisControler(Z_AxisStarterKit)
    const x = getAxisControler(X_AxisStarterKit)
    const y = getAxisControler(Y_AxisStarterKit)
    console.log('1')
    const m = await MachineControler({x,y,z: z_UNSAFE})

    await m.safelyReferenceSystemIfNecessary()

    const [minY, maxY] = y._getAbsolutePositionRange()
    const [minX, maxX] = x._getAbsolutePositionRange()

    const moveRelative = async (axis: AxisControler, relativePos_: number | Milimeter) => {
        const relativePos = axis._convertMilimeterToPulseIfNecessary(relativePos_)
        const [min, max] = await axis._getAbsolutePositionRange()
        const currentPos = await axis.getCurrentAbsolutePosition()
        const nextPos = Math.round(currentPos+relativePos)
        const isNextPositionValid = isInsideRange(nextPos,[min,max])
        if (isNextPositionValid===true) {
            await axis.goToAbsolutePosition(nextPos)
        }
        return 
    }


    const startPoint = minX+5500
    console.log('2')
    //await x.goToPosition(1500)
    //await x.goToPosition(startPoint)
    //await y.goToPosition(maxY*0.8)
    await moveRelative(y,Milimeter(-34.5))
    console.log('3')

}

const Test7C = async () => {
    // go printing
}

const Test7D = async () => {
    // define max speed and aceleration for each axis

    const z_UNSAFE = getAxisControler(Z_AxisStarterKit)
    const x = getAxisControler(X_AxisStarterKit)
    const y = getAxisControler(Y_AxisStarterKit)
    console.log('1')
    const m = await MachineControler({x,y,z: z_UNSAFE})

    //await m.parkSafelyIfItisPossible()
    await m.safelyReferenceSystemIfNecessary()
    console.log('2')
    // posiciona Y no meio antes de iniciar teste com X
    const [minY, maxY] = y._getAbsolutePositionRange()
    const YMeioDoEixo = Math.floor((minY+maxY)/2)
    await y.goToAbsolutePosition(YMeioDoEixo)
    console.log('3')
    const range = Range(10,300,10).map( x => (x/100)+1)
    console.log('range=',range)
    //Testa velocidade com eixo X
    const [minX, maxX] = x._getAbsolutePositionRange()
    const startPoint = Math.floor(((maxX-minX)*0.1)+minX)
    const endPoint = Math.floor((maxX/2)+startPoint)
    
    type Kinematic = Parameters<AxisControler['goToAbsolutePosition']>[1]
    let kinematic = (pInc: number):Kinematic => (vel, ac) => [Math.floor(vel*pInc), ac]
    
    type Monitor = (pos: number, target: readonly [number, number]) => void
    const monitor: Monitor = (curPos, target) => {
        console.log(`Eixo ${x.getAxisName()}: Buscando posicao ${target}, posicao_atual=${curPos}, targetRange=${target}`)
    }

    const arr = range.map( (percentualIncrement) => async () => {
        const newKinematic = kinematic(percentualIncrement)
        console.log('========[ Teste de velocidade do eixo ]==========')
        console.log(`Incremento=${percentualIncrement}`)
        await x.goToAbsolutePosition(startPoint, undefined, monitor)
        await x.goToAbsolutePosition(endPoint, newKinematic, monitor)
        await x.goToAbsolutePosition(startPoint, undefined, monitor)
        await delay(1500)
    })
    executeInSequence(arr)
}

const Test7E = async () => {
    // estimate current pontual speed and acceleration based on two getPosition points
    //   this service may be delivered by the GoPosition function

    const z = getAxisControler(Z_AxisStarterKit)
    const x = getAxisControler(X_AxisStarterKit)
    const y = getAxisControler(Y_AxisStarterKit)
    console.log('1')
    const m = await MachineControler({x,y,z: z})

    await y._forceLooseReference()

    await m.safelyReferenceSystemIfNecessary()

    const [minX, maxX] = x._getAbsolutePositionRange()
    const [minY, maxY] = y._getAbsolutePositionRange()

    const moveXYSimultaneously = async (posX: number, posY: number) => {
        const isSafeX = x._isSafePosition(posX)
        const isSafeY = y._isSafePosition(posY)
        const isSafePosition = isSafeX && isSafeY
        if(isSafePosition===false) 
            return
        else {
            await ExecuteInParalel([
                () => x.goToAbsolutePosition(posX),
                () => y.goToAbsolutePosition(posY),
            ])
        }
    }

    await moveXYSimultaneously(1500, 1000)
    await moveXYSimultaneously(3500, 2000)
    await moveXYSimultaneously(2500, 2500)
    await moveXYSimultaneously(3500, 2000)
    await moveXYSimultaneously(2500, 2500)
    await moveXYSimultaneously(3500, 2000)
    await moveXYSimultaneously(2500, 2500)
    await moveXYSimultaneously(3500, 2000)
    await moveXYSimultaneously(2500, 2500)
    await moveXYSimultaneously(3500, 2000)
    await moveXYSimultaneously(2500, 2500)
    await moveXYSimultaneously(3500, 2000)
    await moveXYSimultaneously(3500, 2000)
    await moveXYSimultaneously(minX*1.5, minY*1.5)
    await moveXYSimultaneously(minX*1.5, maxY*0.8)
    await moveXYSimultaneously(1500, 1000)
    await moveXYSimultaneously(3500, 2000)
    await moveXYSimultaneously(minX, minY)
    


    const report = {
        Eixo_X: x._getTrajectory(),
        Eixo_Y: y._getTrajectory(),
        Eixo_Z: z._getTrajectory(),
    }

    console.log(report)


}

const Test7F = {
    // move para coordenada calcusando vetorialmente 
    //a componente dos eixos que realizarao o deslocamento
}


const Test8 = async () => {

    const E44_B1_probe: ImpressoesX = [
        [1000,1200],
        [1400,1600],
        [2000,2500],
    ] as const

    const z = getAxisControler(Z_AxisStarterKit)
    const x = getAxisControler(X_AxisStarterKit)
    const y = getAxisControler(Y_AxisStarterKit)




    const m = await MachineControler({x,y,z})
    
    await m.safelyReferenceSystemIfNecessary()
    await m.parkSafelyIfItisPossible()
    await delay(1500)
    await m.safelyReferenceSystemIfNecessary()
    
    const runJob = async () => {

        console.log('Starting job')

        const [minZ] = z._getAbsolutePositionRange()

        const job: Job = {
            printSpeed: 1700,
            printer: 'printerBlack',
            remoteFieldIndex: 4,
            text: 'E44.B1',
            zPosition: minZ,
            xyPositions: [
                { y: 700, xs: E44_B1_probe},
                { y: 750, xs: E44_B1_probe},
                { y: 800, xs: E44_B1_probe},
                { y: 850, xs: E44_B1_probe},
                { y: 900, xs: E44_B1_probe},
                { y: 1000, xs: E44_B1_probe},
                { y: 1500, xs: E44_B1_probe},
            ]
        }
        console.table(job)
        console.log('Doing')
        await m.doOneJob(job)
        console.log('Done')
        return
    }

    await runJob()

}

export type MovimentKit = {
    x: AxisControler,
    y: AxisControler,
    z: AxisControler,
    m: MachineControler,
}

const Test9 = async () => {

    const makeMovimentKit = async ():Promise<MovimentKit> => {
        const z = getAxisControler(Z_AxisStarterKit)
        const x = getAxisControler(X_AxisStarterKit)
        const y = getAxisControler(Y_AxisStarterKit)
        const m = await MachineControler({x,y,z: z})
        return { x, y, z, m}
    }

    // ------------ intro -------------------------

    const movimentKit = await makeMovimentKit()
    const {x,y,z,m} = movimentKit

    const [minX, maxX] = x._getAbsolutePositionRange()
    const [minY, maxY] = y._getAbsolutePositionRange()
    const [minZ, maxZ] = y._getAbsolutePositionRange()

    // ------------------- work -------------------

    const _getCurrentPositionInMilimeters = async (axis: AxisControler): Promise<Milimeter> =>{
        const curPos = await axis.getCurrentAbsolutePosition()
        const curPosMM = axis._convertAbsolutePulsesToMilimeter(curPos)
        return curPosMM
    }

    // relative movement

    const _moveRelative = async (axis: AxisControler, pos: Milimeter):Promise<Milimeter> => {
        await axis._moveRelative(pos) // safe move
        const curPosMM = await _getCurrentPositionInMilimeters(axis)
       
        return curPosMM
    }

    const _moveRelativeXY = async (xPos: Milimeter, yPos: Milimeter):Promise<[x: Milimeter, y: Milimeter]> => {
        const arr = await ExecuteInParalel([
            () => _moveRelative(x, xPos),
            () => _moveRelative(y, yPos),
        ] as const) 
        const [xPosMM,yPosMM] = arr as [x: Milimeter, y: Milimeter]
        console.log(`current XY absolute position: x=${xPosMM.value}mm, y=${yPosMM.value}mm`)
        return [xPosMM,yPosMM]
    }

    const _moveRelativeZ = async (zPos: Milimeter):Promise<Milimeter> => {
        const curZPos = await _moveRelative(z, zPos)
        console.log(`current Z absolute position: z=${curZPos.value}mm`)
        return curZPos 
    }

    // absolute movement

    const _moveAbsolute = async (axis: AxisControler, pos: Milimeter):Promise<Milimeter> => {
        const posInPulse = axis._convertMilimeterToPulseIfNecessary(pos)
        const isValidPos =  axis._isSafePosition(posInPulse)
        if(isValidPos) {
            await axis.goToAbsolutePosition(pos) // safe move
        } 
        const curPosMM = await _getCurrentPositionInMilimeters(axis)
        return curPosMM
    }

    const _moveAbsoluteXY = async (xPos: Milimeter, yPos: Milimeter):Promise<[x: Milimeter, y: Milimeter]> => {
        const arr = await ExecuteInParalel([
            () => _moveAbsolute(x, xPos),
            () => _moveAbsolute(y, yPos),
        ] as const) 
        const [xPosMM,yPosMM] = arr as [x: Milimeter, y: Milimeter]
        console.log(`current XY absolute position: x=${xPosMM.value}mm, y=${yPosMM.value}mm`)
        return [xPosMM,yPosMM]
    }

    const _moveAbsoluteZ = async (zPos: Milimeter):Promise<Milimeter> => {
        const curZPos = await _moveAbsolute(z, zPos)
        console.log(`current Z absolute position: z=${curZPos.value}mm`)
        return curZPos 
    }

    const programMessage = async (printer: Printers,remoteFieldId: number, msg: string): Promise<[remoteFieldId: number, msg: string]> => {
        //const portsInfo = await CommDriver.listPorts()
        //const ports = portsInfo.map( portInfo => portInfo.uid )
        const ports = ['com9']
        const arr = ports.map( port => async () => {
            await sendPrinter2(port, 9600)(remoteFieldId,msg)
            return
        })
        await ExecuteInParalel(arr)
        return [remoteFieldId, msg]
    }

  

    // helper aliases

    const moveRelativeXY = (xPosMM: number, yPosMM:number) => _moveRelativeXY(Milimeter(xPosMM),Milimeter(yPosMM))
    const moveRelativeZ = (zPosMM: number) => _moveRelativeZ(Milimeter(zPosMM))

    const moveAbsoluteXY = (xPosMM: number, yPosMM:number) => _moveAbsoluteXY(Milimeter(xPosMM),Milimeter(yPosMM))
    const moveAbsoluteZ = (zPosMM: number) => _moveAbsoluteZ(Milimeter(zPosMM))

    //

   
   
    
    // fazer:
    // - descobrir delta do cabecote branco pro preto
    // definir um Type para definir o programa de cada matriz
    //  - sub agrupar os parametros do type Job 
    //  - nao é urgente: Fazer duas linhas numa passada só
    //  - nao é urgente: 
    // descobrir a distancia entre cabecote
    // resolver o programMessage que esta finalizando o programa depois da execucao
    // criar o tipo AbsolutePulse e substituir todos os numbers do AxisContrler e MotorControler de number para este tipo 
    // imprimir duas gavetas
    // detectar giro
    // fazer operacao com leitura de codigo de barra/gaveta e janela de manutencao

    // --------------- routine / work / job -------------------

    //await x._forceLooseReference()
    //await y._forceLooseReference()
    await m.safelyReferenceSystemIfNecessary()


    const getTermo2559370Job = (): Job__ => {
        const firstX = 150+13.66-28.5-10.10+70-35.44-15+9.67-2.5
        const stepX = (104.96+15.24)
        const posicaoYDaLinha5EmMilimetros = 150+220-10-10+3-2-2.6+1.5-8.26-3.11-20+3.87+13.6-(7+5)
        const stepY = 60
        return {
            partNumber: '',
            barCode: '',
            printer: 'printerWhite',
            msg:  '2559370',
            remoteFieldId: 3,
            printVelocity: 2000,
            zLevel: 0,
            impressoesX: [ // em milimetros absolutos
                [firstX+(stepX*0),firstX+(stepX*1)],
                [firstX+(stepX*2),firstX+(stepX*3)],
                [0,0],
            ],
            linhasY: [ // em milimetros absolutos
                posicaoYDaLinha5EmMilimetros+(stepY*(2)),
                posicaoYDaLinha5EmMilimetros+(stepY*(1)),
                posicaoYDaLinha5EmMilimetros+(stepY*(0)),
                posicaoYDaLinha5EmMilimetros+(stepY*(-1)),
                posicaoYDaLinha5EmMilimetros+(stepY*(-2)),
                posicaoYDaLinha5EmMilimetros+(stepY*(-3)),
                posicaoYDaLinha5EmMilimetros+(stepY*(-4)),
            ]
        }
    }

    const getTermo2559371Job = (): Job__ => {
        return {
            ...getTermo2559370Job(),
            msg: '2559371',
        }
    }

    const getE44A2Job = (): Job__ => {
        const firstX = 150+13.66-28.5-10.10+70
        const stepX = 70
        const posicaoYDaLinha5EmMilimetros = 150+220-10-10+3-2-2.6+1.5-8.26-3.11-20+3.87
        const stepY = 70
        return {
            partNumber: '',
            barCode: '',
            printer: 'printerBlack',
            msg: 'E44.A2',
            remoteFieldId: 4,
            printVelocity: 2000,
            zLevel: 0,
            impressoesX: [
                [firstX+(stepX*0),firstX+(stepX*1)],
                [firstX+(stepX*2),firstX+(stepX*3)],
                [firstX+(stepX*4),firstX+(stepX*5)],
            ],
            linhasY: [
                posicaoYDaLinha5EmMilimetros+(stepY*(2)),
                posicaoYDaLinha5EmMilimetros+(stepY*(1)),
                posicaoYDaLinha5EmMilimetros+(stepY*(0)),
                posicaoYDaLinha5EmMilimetros+(stepY*(-1)),
                posicaoYDaLinha5EmMilimetros+(stepY*(-2)),
                posicaoYDaLinha5EmMilimetros+(stepY*(-3)),
                posicaoYDaLinha5EmMilimetros+(stepY*(-4)),
            ]
        } 
    }

    const getE44B5Job = (): Job__ => {

        type XYDelta = {
            x: Milimeter, // milimeter in relation to white Head
            y: Milimeter, // milimeter in relation to cmpp 0
        }

        const deltaHead: XYDelta = {
            x: Milimeter(-46.51),
            y: Milimeter(+5.90),
        }

        const deltaGaveta2: XYDelta = {
            x: Milimeter(+603.5+1.29),
            y: Milimeter(+6.34+3.98),
        }

        const deltaId: XYDelta = {
            x: Milimeter(0),
            y: Milimeter(0),
        }

        const applyDeltaToCoordinates = (xss: ImpressoesX, ys: readonly number[], delta: XYDelta): [newXs: ImpressoesX, newYs: readonly number[]] => {
            const { x: xHead, y: yHead} = delta
            const newYs = ys.map( y => y + yHead.value)
            const newXs = xss.map( xs => xs.map( x => x + xHead.value)) as unknown as ImpressoesX
            console.log('ys:', ys)
            console.log('new_ys:', newYs)
            console.log('xs', xss)
            console.log('newXs', newXs)
            return [newXs, newYs]
        }

        const E44_A2 = getE44A2Job()
        const {
            impressoesX,
            linhasY,
        } = E44_A2

        const [impressoesX_, linhasY_] = 
            applyDeltaToCoordinates(impressoesX, linhasY, deltaHead)

        const [impressoesX_adjusted, linhasY_adjusted] = 
            applyDeltaToCoordinates(impressoesX_, linhasY_, deltaGaveta2)

        return {
            ...E44_A2,
            partNumber: '',
            barCode: '',
            msg: 'E44.B5',
            passes:2,
            remoteFieldId: 3,
            printer: 'printerWhite',
            linhasY: linhasY_adjusted,
            impressoesX: impressoesX_adjusted,
        }
    }

    const getE44A5Job = (): Job__ => {
        return {
            ...getE44A2Job(),
            msg: 'E44.A5'
        }
    }

    const getE44A6Job = (): Job__ => {
        return {
            ...getE44A2Job(),
            msg: 'E44.A6'
        }
    }

    const getT110Job = (): Job__ => {
        const firstX = 150+13.66
        const stepX = 70
        const posicaoYDaLinha5EmMilimetros = 150+220-10-10+3-2-2.6+1.5-8.26-3.11
        const impressoesX: ImpressoesX = [
            [firstX+(stepX*0),firstX+(stepX*1)],
            [firstX+(stepX*2),firstX+(stepX*3)],
            [firstX+(stepX*4),firstX+(stepX*5)],
        ]
        const stepY = 70
        const linhasY = [ // em milimetros absolutos
            posicaoYDaLinha5EmMilimetros+(stepY*(2)),
            posicaoYDaLinha5EmMilimetros+(stepY*(1)),
            posicaoYDaLinha5EmMilimetros+(stepY*(0)),
            posicaoYDaLinha5EmMilimetros+(stepY*(-1)),
            posicaoYDaLinha5EmMilimetros+(stepY*(-2)),
            posicaoYDaLinha5EmMilimetros+(stepY*(-3)),
            posicaoYDaLinha5EmMilimetros+(stepY*(-4)),
        ]
        return {
            partNumber: '',
            printer: 'printerWhite',
            barCode: '',
            msg:  'T110',
            remoteFieldId: 3,
            impressoesX,
            linhasY,
            printVelocity: 1700,
            zLevel:0,
            passes: 2
            
        }

    }

    const getTermoM1Job = (): Job__ => {
        const firstX = 150+13.66-28.5-10.10+70-35.44
        const stepX = (104.96+15.24)
        const posicaoYDaLinha5EmMilimetros = 150+220-10-10+3-2-2.6+1.5-8.26-3.11-20+3.87+13.6+3.21
        const stepY = 60
        return {
            partNumber: '',
            barCode: '',
            printer: 'printerWhite',
            msg: 'M1',
            remoteFieldId: 3,
            printVelocity: 2000,
            zLevel: 0,
            impressoesX: [ // em milimetros absolutos
                [firstX+(stepX*0),firstX+(stepX*1)],
                [firstX+(stepX*2),firstX+(stepX*3)],
                [0,0],
            ],
            linhasY: [ // em milimetros absolutos
                posicaoYDaLinha5EmMilimetros+(stepY*(2)),
                posicaoYDaLinha5EmMilimetros+(stepY*(1)),
                posicaoYDaLinha5EmMilimetros+(stepY*(0)),
                posicaoYDaLinha5EmMilimetros+(stepY*(-1)),
                posicaoYDaLinha5EmMilimetros+(stepY*(-2)),
                posicaoYDaLinha5EmMilimetros+(stepY*(-3)),
                posicaoYDaLinha5EmMilimetros+(stepY*(-4)),
            ]
        }
    }

    const performJob = async (job: Job__): Promise<void> => {
        
        const {
            printer,
            remoteFieldId,
            msg,
            zLevel,
            linhasY,
        } = job

        const performYLine = async (yPos: Milimeter, impressoesX: ImpressoesX): Promise<void> => {

            const fazLinhaXPreta = async (movimentKit: MovimentKit, impressoes: ImpressoesX):Promise<void> => {

                console.log('fazLinhaPreta')
                const {x,y,z,m} = movimentKit
                    
                const rampa = mili2PulseX(100)
                const PMA = PosicaoInicialX+mili2PulseX(100)
                const UMA = PosicaoInicialX+mili2PulseX(170)
                const PI = PosicaoInicialX
                const PF = UMA + rampa
                const NMA = 2
                const velAv = 1700
                const acAv = 3000
                const velRet = 2300
                const acRet = 3000
            
                const ImprimePar = async (x0: number, x1: number, rampa: number): Promise<void> => {
            
                    await x._setPrintMessages({
                        numeroDeMensagensNoAvanco: NMA,
                        numeroDeMensagensNoRetorno: 0,
                        posicaoDaPrimeiraMensagemNoAvanco: x0,
                        posicaoDaUltimaMensagemNoAvanco: x1,
                        posicaoDaPrimeiraMensagemNoRetorno: 500,
                        posicaoDaUltimaMensagemNoRetorno: 500,
                    })
                
                    const [minX, maxX] = x._getAbsolutePositionRange()
            
                    const POSFIM = x1+x._convertMilimeterToPulseIfNecessary(Milimeter(rampa))
            
                    await x.goToAbsolutePosition(x1+rampa, (v,a) =>[velAv,acAv] )
                    await x.goToAbsolutePosition(minX, (v,a) => [velRet,acRet])
                    //await x._clearPrintingMessages() //FIX: should be unnecessary
            
                    return
                }

                const imprimeTodaLinha = async (printPositionsInPulses: ImpressoesX):Promise<void> => {
            
                    const rampa = 500 // pulses (v=2000, ac=5000,rampa=20)
                    const messageLength = 1500
                    const pma = printPositionsInPulses[0][0]
                    const uma = printPositionsInPulses[1][1]
                    const pIni = pma-rampa
                    const pEnd = uma+(messageLength+rampa)

                    console.log(`pma=${pma}, uma=${uma},pIni=${pIni}, pEnd=${pEnd}`)

                    await x._setPrintMessages({
                        numeroDeMensagensNoAvanco: 6,
                        numeroDeMensagensNoRetorno: 0,
                        posicaoDaPrimeiraMensagemNoAvanco: pma,
                        posicaoDaUltimaMensagemNoAvanco: uma,
                        posicaoDaPrimeiraMensagemNoRetorno: 500, //any number
                        posicaoDaUltimaMensagemNoRetorno: 500,  // any
                    })
                    await x.goToAbsolutePosition(pEnd, (v,a) =>[velAv,acAv] )
                    await x.goToAbsolutePosition(pIni, (v,a) => [velRet,acRet])
                } 
            
                
                await ImprimePar(impressoes[0][0],impressoes[0][1], rampa )
                await ImprimePar(impressoes[1][0],impressoes[1][1], rampa )
                await ImprimePar(impressoes[2][0],impressoes[2][1], rampa )
                    
                /*
                await imprimeTodaLinha(impressoes)
                */
                return
                        
            }

            const fazLinhaXBranca = async (movimentKit: MovimentKit, impressoes: ImpressoesX):Promise<void> => {
                console.log('fazLinhaBranca')
                await fazLinhaXPreta(movimentKit, impressoes)
                await fazLinhaXPreta(movimentKit, impressoes)
                    
            }

            const executeLinePrintings = async (printer: Printers, modelo: ImpressoesX): Promise<void> => {
                if (printer==='printerWhite') {
                    console.log('1')
                    await fazLinhaXBranca(movimentKit,modelo)
                } else {
                    // printer==='printerBlack'
                    await fazLinhaXPreta(movimentKit, modelo)
                }
                return
            }
        
            const convertImpressoesMM2Pulse = (iMM: ImpressoesX): ImpressoesX => {
                const iPulses = iMM.map( par => par.map( i => x._convertMilimeterToPulseIfNecessary(Milimeter(i)))) as unknown as ImpressoesX
                return iPulses 
            }

             //position y
             await y.goToAbsolutePosition(yPos)
             //do the line
             const iInPulses = convertImpressoesMM2Pulse(impressoesX)
             await executeLinePrintings(printer,iInPulses)

        }
        

        const doTheJob = async (job:Job__): Promise<void> => {

            console.log('=========== [Iniciando Trabajo:] ===========')
            console.table(job)

            const impressoesX = job.impressoesX

            // program printer
            await programMessage(printer, remoteFieldId, msg)

            // executa linhas
            const possYmm = linhasY.map( x => Milimeter(x))
            const fazTodasAsLinhas = possYmm.map( yPos => async () => {
                await performYLine(yPos,impressoesX)
            })
            await executeInSequence(fazTodasAsLinhas)

            //
            console.log('Trabalho finalizado')

        }

        const executeManyJobsWithTimeDelay = async (jobs: readonly Job__[], timeDelayInSecs: number): Promise<void> => {
            const arr = jobs.map( job => async () => {
                await doTheJob(job);
                await delay(timeDelayInSecs*1000)

            })
        }

        // release Z 
        const jobs = Range(1,3).map( qtdeImpressa => {
            console.log(`qtde impressa=${qtdeImpressa}`)
            return getE44A6Job()
        })
        await z._moveRelative(Milimeter(zLevel))
        //await executeManyJobsWithTimeDelay(jobs,(1.5*60));
        await doTheJob(job)
        // sobe Z
        await z.goToAbsolutePosition(minZ);


    }

    // Faz termo M1-255937
    //await performJob(getTermo2559370Job());
    //await performJob(getTermoM1Job());
    
    await m.parkSafelyIfItisPossible()
    throw new Error('haha')
    await m.safelyReferenceSystemIfNecessary()
    const arr = Range(0,2,1).map( gavetada => async () => {
        await performJob(getT110Job()) //Fix: Job in milimeters must be correct typed as milimeter instead of number
        await delay(1.5*60*1000)
    })
    await executeInSequence(arr)
    
    
   

}

Test9();


/// programas

namespace T123 {
    
    const PartNumber = ''
    const printer:Printers = 'printerWhite'
    const msg = 'T123'
    const remoteFieldId = 3
    const zLevel = 0 // (o quanto o cabecote desce em milimetros) in milimeter relative to MinZ
    const firstX = 150+13.66-28.5-10.10+70-35.44-15+9.67-2.5+4.3+8.68-2.72
    const stepX = 70
    const tempoAbastecimentoUmaLinha = 11000//-4000-3000
    const posicaoYDaLinha5EmMilimetros = 150+220-10-10+3-2-2.6+1.5-8.26-3.11-20+3.87+13.6-(7+5)+3.44+23.89-11.25
    const impressoesX:ImpressoesX = [
        [firstX+(stepX*0),firstX+(stepX*1)],
        [firstX+(stepX*2),firstX+(stepX*3)],
        [firstX+(stepX*4),firstX+(stepX*5)],
    ]
    const stepY = 70
    const linhasY = [
        posicaoYDaLinha5EmMilimetros+(stepY*(2)),
        posicaoYDaLinha5EmMilimetros+(stepY*(1)),
        posicaoYDaLinha5EmMilimetros+(stepY*(0)),
        posicaoYDaLinha5EmMilimetros+(stepY*(-1)),
        posicaoYDaLinha5EmMilimetros+(stepY*(-2)),
        posicaoYDaLinha5EmMilimetros+(stepY*(-3)),
        posicaoYDaLinha5EmMilimetros+(stepY*(-4)),
    ].reverse()

}

namespace P3 {
    
    const PartNumber = ''
    const printer:Printers = 'printerWhite'
    const msg = 'P3'
    const remoteFieldId = 3
    const zLevel = 0 // (o quanto o cabecote desce em milimetros) in milimeter relative to MinZ
    const firstX = 150+13.66-28.5-10.10+70-35.44-15+9.67-2.5+4.3
    const stepX = (54.89+15.16)
    const tempoAbastecimentoUmaLinha = 11000//-4000-3000
    const posicaoYDaLinha5EmMilimetros = 150+220-10-10+3-2-2.6+1.5-8.26-3.11-20+3.87+13.6-(7+5)+3.44
    const impressoesX:ImpressoesX = [
        [firstX+(stepX*0),firstX+(stepX*1)],
        [firstX+(stepX*2),firstX+(stepX*3)],
        [firstX+(stepX*4),firstX+(stepX*5)],
    ]
    const stepY = 60
    const linhasY = [
        posicaoYDaLinha5EmMilimetros+(stepY*(-4)),
        posicaoYDaLinha5EmMilimetros+(stepY*(-3)),
        posicaoYDaLinha5EmMilimetros+(stepY*(-2)),
        posicaoYDaLinha5EmMilimetros+(stepY*(-1)),
        posicaoYDaLinha5EmMilimetros+(stepY*(0)),
        posicaoYDaLinha5EmMilimetros+(stepY*(1)),
        posicaoYDaLinha5EmMilimetros+(stepY*(2)),
        
    ].reverse()
}

namespace TermoM1 {

    namespace M1 {
        const PartNumber = ''
        const printer:Printers = 'printerWhite'
        const msg = 'M1'
        const remoteFieldId = 3
        const zLevel = 0 // (o quanto o cabecote desce em milimetros) in milimeter relative to MinZ
        const firstX = 150+13.66-28.5-10.10+70-35.44
        const stepX = (104.96+15.24)
        const tempoAbastecimentoUmaLinha = 11000-4000-3000
        const posicaoYDaLinha5EmMilimetros = 150+220-10-10+3-2-2.6+1.5-8.26-3.11-20+3.87+13.6+3.21
        const impressoesX:ImpressoesX = [ // em milimetros absolutos
            [firstX+(stepX*0),firstX+(stepX*1)],
            [firstX+(stepX*2),firstX+(stepX*3)],
            [0,0],
        ]

        const stepY = 60
        const linhasY = [ // em milimetros absolutos
            posicaoYDaLinha5EmMilimetros+(stepY*(2)),
            posicaoYDaLinha5EmMilimetros+(stepY*(1)),
            posicaoYDaLinha5EmMilimetros+(stepY*(0)),
            posicaoYDaLinha5EmMilimetros+(stepY*(-1)),
            posicaoYDaLinha5EmMilimetros+(stepY*(-2)),
            posicaoYDaLinha5EmMilimetros+(stepY*(-3)),
            posicaoYDaLinha5EmMilimetros+(stepY*(-4)),
        ]
    }
    
    namespace _2559371 {

        const PartNumber = ''
        const printer:Printers = 'printerWhite'
        const msg = '2559371'
        const remoteFieldId = 3
        const zLevel = 0 // (o quanto o cabecote desce em milimetros) in milimeter relative to MinZ
        const firstX = 150+13.66-28.5-10.10+70-35.44-15+9.67-2.5
        const stepX = (104.96+15.24)
        const tempoAbastecimentoUmaLinha = 11000-4000-3000
        const posicaoYDaLinha5EmMilimetros = 150+220-10-10+3-2-2.6+1.5-8.26-3.11-20+3.87+13.6-(7+5)
        const impressoesX:ImpressoesX = [
            [firstX+(stepX*0),firstX+(stepX*1)],
            [firstX+(stepX*2),firstX+(stepX*3)],
            [0,0],
        ]

        const stepY = 60
        const linhasY = [
            posicaoYDaLinha5EmMilimetros+(stepY*(2)),
            posicaoYDaLinha5EmMilimetros+(stepY*(1)),
            posicaoYDaLinha5EmMilimetros+(stepY*(0)),
            posicaoYDaLinha5EmMilimetros+(stepY*(-1)),
            posicaoYDaLinha5EmMilimetros+(stepY*(-2)),
            posicaoYDaLinha5EmMilimetros+(stepY*(-3)),
            posicaoYDaLinha5EmMilimetros+(stepY*(-4)),
        ]

    } 

}

//T110
namespace T110 {
    const printer = 'printerWhite'
    const modelo = T110
    const msg = 'T110'
    const remoteFieldId = 3
    const firstX = 150+13.66
    const stepX = 70
    const tempoAbastecimentoUmaLinha = 11000
    const posicaoYDaLinha5EmMilimetros = 150+220-10-10+3-2-2.6+1.5-8.26-3.11
    const impressoes:ImpressoesX = [
        [firstX+(stepX*0),firstX+(stepX*1)],
        [firstX+(stepX*2),firstX+(stepX*3)],
        [firstX+(stepX*4),firstX+(stepX*5)],
    ]
}


//E44.A5
namespace E44_Black {

    namespace E44_A5 {
        const firstX = 150+13.66-28.5-10.10+70
        const stepX = 70
        const posicaoYDaLinha5EmMilimetros = 150+220-10-10+3-2-2.6+1.5-8.26-3.11-20+3.87
        const stepY = 70
        const Job_E44_A3: Job__ = {
            partNumber: '',
            barCode: '',
            printer: 'printerBlack',
            msg: 'E44.A5',
            remoteFieldId: 4,
            printVelocity: 2000,
            zLevel: 0,
            impressoesX: [
                [firstX+(stepX*0),firstX+(stepX*1)],
                [firstX+(stepX*2),firstX+(stepX*3)],
                [firstX+(stepX*4),firstX+(stepX*5)],
            ],
            linhasY: [
                posicaoYDaLinha5EmMilimetros+(stepY*(2)),
                posicaoYDaLinha5EmMilimetros+(stepY*(1)),
                posicaoYDaLinha5EmMilimetros+(stepY*(0)),
                posicaoYDaLinha5EmMilimetros+(stepY*(-1)),
                posicaoYDaLinha5EmMilimetros+(stepY*(-2)),
                posicaoYDaLinha5EmMilimetros+(stepY*(-3)),
                posicaoYDaLinha5EmMilimetros+(stepY*(-4)),
            ]
        }
    }

  

}

namespace Test {
    type Position1D = {
        kind: 'Position'
        relativeTo: 'AbsoluteZeroMachineAt2021FEV16' | 'MinimumSafePoint'
        value: Milimeter
    }

    type Position3D = {
        kind: 'Position3D'
        x: Position1D
        y: Position1D
        z: Position1D
    }

    type Message = {
        printer: Printers
        remoteFieldId: number
        text: string
        textLength: Milimeter // the length of the printed text
        passes: number
    }


    type PrintLine = {
        zLevel: number // mm in relation to MinZ //Fix: Should be safe move (and give back an clear error msg if user try to access an physically impossible position)
        xPos: readonly number[] //mm in relation of cmpp 0
        yPos: number //mm in relation of cmpp 0
        message: Message
    }

}


