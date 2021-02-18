

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
import { getKnownJobs, ImpressoesX, Job__, KnownJobsKeys } from "./known-jobs"
//import { ProgramaImpressora } from "./programa-impressora"


export type Milimeter = {
    kind: 'Milimeter'
    value: number
}
export const Milimeter = (value: number): Milimeter => ({kind: 'Milimeter', value})

export type Pulse = {
    kind: 'Pulse'
    value: number
}
export const Pulse = (value: number): Pulse => ({kind: 'Pulse', value})

export type DisplacementUnits = Milimeter['kind'] | Pulse['kind']


export type Displacement = {
    toAbsoluteMilimeter: (axis: AxisControler) => Milimeter
    toAbsolutePulse: (axis: AxisControler) => Pulse
    //map: (f: (_: Displacement) => Displacement) => Displacement
  //  add: (value: Displacement) => Displacement
  //  sub: (value: Displacement) => Displacement
}

// Note: uom stands for unit of measurement 
export const Displacement = (data: Milimeter | Pulse): Displacement => {
    
    type T = Displacement

    const qty = data.value
    const unit = data.kind

    const toAbsoluteMilimeter: T['toAbsoluteMilimeter'] = axis => {
        const mm = unit === 'Milimeter' 
            ? Milimeter(qty) 
            : axis._convertAbsolutePulsesToMilimeter(qty)
        return mm
    }

    const toAbsolutePulse: T['toAbsolutePulse'] = axis => {
        const pulse = unit === 'Milimeter' 
            ? axis._convertMilimeterToPulseIfNecessary(Milimeter(qty)) 
            : qty
        return Pulse(pulse)
    }

    /*const map: T['map'] = f => {
        return Displacement
    }*/

    return {
        toAbsoluteMilimeter: toAbsoluteMilimeter,
        toAbsolutePulse: toAbsolutePulse,
        //map,
       // add,
       // sub,
    }

}

export type Position_ = {
    fromMilimeter: (value: number) => Displacement
    fromPulse: (value: number) => Displacement
}




//export const Position = (value: value, )



export type MovimentKit = {
    x: AxisControler,
    y: AxisControler,
    z: AxisControler,
    m: MachineControler,
}


//type ImpressoesX = readonly number[]




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
    readonly xyPositions: readonly {y: number, xs: ImpressoesX }[],
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
                const [minX, maxX] = x._getAbsolutePositionRange()
                const XMeiodaJanela = 2500
                const YfrenteDaMaquina = maxY
                const InicioDoY = minY
                const FinalDoX = maxX
                const YParkPosition = InicioDoY
                const XParkPosition = FinalDoX
                await ExecuteInParalel([
                    () => executeInSequence([
                        () => x.goToAbsolutePosition(XParkPosition),
                        () => x._forceLooseReference(),
                    ]),
                    () => executeInSequence([
                        () => y.goToAbsolutePosition(YParkPosition),
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

const makeMovimentKit = async ():Promise<MovimentKit> => {
    const z = getAxisControler(Z_AxisStarterKit)
    const x = getAxisControler(X_AxisStarterKit)
    const y = getAxisControler(Y_AxisStarterKit)
    const m = await MachineControler({x,y,z})
    return { x, y, z, m }
}

// ================================================================
//      Tests
// ================================================================

const Test7F = {
    // move para coordenada calcusando vetorialmente 
    //a componente dos eixos que realizarao o deslocamento
}




const Test9 = async () => {

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
        

        const doTheJob = async (job: Job__): Promise<void> => {

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
            const getJobByName = getKnownJobs()
            const arr = jobs.map( job => async () => {
                await doTheJob(job);
                await delay(timeDelayInSecs*1000)

            })
        }

        // release Z 
        await z._moveRelative(Milimeter(zLevel))
        //await executeManyJobsWithTimeDelay(jobs,(1.5*60));
        await doTheJob(job)
        // sobe Z
        await z.goToAbsolutePosition(minZ);


    }

    const performJobByItsName = async (jobName: KnownJobsKeys): Promise<void> => {
        const job = getKnownJobs()[jobName]()
        return performJob(job)
        
    }


    // Faz termo M1-255937
    //await performJob(getTermo2559370Job());
    //await performJob(getTermoM1Job());
    
    //await m.safelyReferenceSystemIfNecessary()
   // await m.parkSafelyIfItisPossible()
    //throw new Error('haha')
    await m.safelyReferenceSystemIfNecessary()
    const arr = Range(0,10,1).map( gavetada => async () => {
        await performJobByItsName('E44.A5') //Fix: Job in milimeters must be correct typed as milimeter instead of number
        await delay(1.5*60*1000)
    })
    await executeInSequence(arr)
    
}

Test9();


/// programas


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


