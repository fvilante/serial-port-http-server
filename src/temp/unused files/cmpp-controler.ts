import { BaudRate } from '../../software/serial/baudrate'
import { setParam_ } from '../../software/cmpp/transport/cmpp-memmap-layer'
import { getStatusLow, StatusL } from '../../software/cmpp/utils/get-status-low'
import { getPosicaoAtual } from '../../software/cmpp/utils/get-pos-atual'
import { Driver, HyperDriver } from '../../software/cmpp/transport/mapa_de_memoria'
import { isInsideRange, now } from "../../software/core/utils"



// Responsible to wrap the cmpp parameters in a logical way
// We want also to diferentiate pure and impure commands

const FTickPerMilisec = 1.024 // ?? fator de conversao de tick pra milisegundo


type PositiveInteger = {
    run: () => { kind: 'PositiveInteger', value: number}
}


type Milisecond = {
    run: () => { kind: 'Milisecond', value: number }
    scale: (scale: number) => Milisecond
    toTickClock: (factor: number) => TickClock
}
declare const Milisecond: (value: number) => Milisecond


// CMPP tick clock
type TickClock = {
    run: () => { kind: 'TickClock', value: number }
    toMilisecs: (factor: number) => Milisecond
}
type TickClock_ = {
    fromMiliSecond: (_: Milisecond) => TickClock
}
declare const TickClock_: TickClock_

type Time = Milisecond | TickClock

type InferKindFromRunner<T extends { run: () => { kind: string }}> = T extends { run: () => { kind: infer R }} ? R : never

type TimeKind = InferKindFromRunner<Time>



// ie: position
type Step = {
    run: () => { kind: 'Step', value: number }
    isEqual: (other: Step) => boolean
    sub: (other: Step) => Step
    add: (other: Step) => Step
    scale: (scale: number) => Step
}
declare const Step: (value: number) => Step

type Milimeter = {
    run: () => { kind: 'Milimeter', value: number }
}


type Position = Milimeter | Step

type AbsolutePosition = {
    run: () => { kind: 'AbsolutePosition', value: Position }
    displacement: (other: AbsolutePosition) => PositionDisplacement
}
declare const AbsolutePosition: (_: Position) => AbsolutePosition

type PositionDisplacement = {
    run: () => { kind: 'PositionDisplacement', value: Position }
}

type AbsoluteTime = {
    kind: 'AbsoluteTime'
    run: () => { value: number }
    sub: <K extends TimeKind>(other: AbsoluteTime, unit: K) => Time
    //displacement: (other: AbsoluteTime) => TimeDisplacement
}
declare const AbsoluteTime: (_: number) => AbsoluteTime
type AbsoluteTime_ = {
    now: () => AbsoluteTime
    
}
declare const AbsoluteTime_: AbsoluteTime_

type TimeDisplacement = {
    run: () => { kind: 'TimeDisplacement', value: Time }
}
declare const TimeDisplacement: (_:Time) => TimeDisplacement 


type Velocity = {
    run: () => { kind: 'Velocity', ds: PositionDisplacement, dt: TimeDisplacement }
}
declare const Velocity: (ds: PositionDisplacement, dt: TimeDisplacement) => Velocity 


 


// ie: velocity
type StepFrequency = {
    run: () => { kind: 'StepFrequency', steps: Step, ticks: TickClock, ratio: number }
}
declare const StepFrequency: (steps: Step, ticks: TickClock) => StepFrequency

// ie: acceleration
type StepFrequencyChangeRate = {
    run: () => { kind: 'StepFrequencyChangeRate', fraquency: StepFrequency, time: TickClock, ratio: number }
}

export type CmppKinematic = {
    avanco: {
        velocidade: StepFrequency, // fix: type 'number' for this case is not type-safe
        aceleracao: StepFrequencyChangeRate,
        startAutomatico: false,
    },
    retorno: {
        velocidade: StepFrequency,
        aceleracao: StepFrequencyChangeRate,
        startAutomatico: false,
    },
    referencia: {
        velocidade: StepFrequency,
        aceleracao: StepFrequencyChangeRate,
    }  
}

// deprecated: Fix -> substitute by CmppPrintingSettings
export type PrintingPositions = {
    readonly numeroDeMensagensNoAvanco: number,
    readonly numeroDeMensagensNoRetorno: number,
    readonly posicaoDaPrimeiraMensagemNoAvanco: number,
    readonly posicaoDaUltimaMensagemNoAvanco: number,
    readonly posicaoDaPrimeiraMensagemNoRetorno: number,
    readonly posicaoDaUltimaMensagemNoRetorno: number, 
}

export type CmppPrintingSettings = {
    avanco: {
        numeroDeMensagens: PositiveInteger,
        posicaoDaPrimeiraImpressao: Step,
        posicaoDaUltimaImpressao: Step,
    }, 
    retorno: {
        numeroDeMensagens: PositiveInteger,
        posicaoDaPrimeiraImpressao: Step,
        posicaoDaUltimaImpressao: Step,
    }
}

export type CmppGeneralOptions = {
    reducaoDoNivelDaCorrenteNoRepouso: 'Ligado' | 'Desligado',
    zeroIndexHabilitadoParaProtecao: 'Ligado' | 'Desligado',
    startExternoHabilitado: 'Ligado' | 'Desligado',
    entradaDeStartEntreEixosHabilitado: 'Ligado' | 'Desligado',
    saidaDeStartNoAvancoLigado: 'Ligado' | 'Desligado',
    saidaDeStartNoRetornoLigado: 'Ligado' | 'Desligado',
} 


type CmppControlerInfo = {
    kind: 'CmppControlerInfo'
    portName: string,
    baudRate: BaudRate
    channel: number // fix: make it a Result<Channel, ChannelOutOfRange>
    cmppDriverName: 'Not Implemented' // fix: should show driverName and this kind of metadata also
}

type CmppControler = {
    getInfo: () => Promise<CmppControlerInfo>
    _getStatusL: () => Promise<StatusL>
    //onDisconnect: () => Promise<DisconnectionStatus>
    _isConnected: (_since: Milisecond) => Promise<boolean> // fix: consider a parameter like (sinceMiliseconds: number) to avoid unnecessary polling
    _isReferenced: () => Promise<boolean> 
    _setKinematics: (_: CmppKinematic) => Promise<void>
    _setPrintingsSettings: (_: CmppPrintingSettings) => Promise<void>
    __start: () => Promise<void>
    __forceLooseReference: () => Promise<void>
    __sendPrintSignal: () => Promise<void>
    _setGeneralOptions: (_: CmppGeneralOptions) => Promise<void>
    _getCurrentAbsolutePosition: () => Promise<Step>
    _getEstimatedFrequency: () => Promise<StepFrequency>
    _getEstimatedFrequencyChangeRate: () => Promise<StepFrequencyChangeRate>
    _getPosition: () => Promise<Step> // informed by cmpp
    _getSensors: () => {giro: boolean, fcMenos: boolean}
}

//type X = CmppControler<Driver, 'Com1', 0>


const CmppControler = (portName: string, baudRate: BaudRate, channel: number): CmppControler => {

    type T = CmppControler

    const axis = setParam_(portName, baudRate, channel)(Driver)

    const getInfo: T['getInfo'] = async () => {
        return {
            kind: 'CmppControlerInfo',
            portName,
            baudRate,
            channel,
            cmppDriverName: 'Not Implemented',
        }
    }

    const _getStatusL: T['_getStatusL'] = async () => {
        const statusL = await getStatusLow(portName, baudRate, channel)
        return statusL
    }

    const _isConnected: T['_isConnected'] = async since => {
        // fix: use since to avoid pool everytime
        const a = await _getStatusL()
        return true
    }

    const _isReferenced: T['_isReferenced'] = async () => {
        const status = await _getStatusL()
        const isReferenced = status.referenciado
        return isReferenced
    } 

    const _setKinematics: T['_setKinematics'] = async kinematics => {
        const {
            avanco,
            retorno,
            referencia,
        } = kinematics

        const velAv = avanco.velocidade.run().ratio
        const velRet = retorno.velocidade.run().ratio
        const velRef = referencia.velocidade.run().ratio
        const acAv = avanco.aceleracao.run().ratio
        const acRet = retorno.aceleracao.run().ratio
        const acRef = referencia.aceleracao.run().ratio
        
        // Fix: only reset what has been changed since last modify
        //      everything is beeing changed now, but this is not communication-eficient
        await axis('Velocidade de avanco', velAv)
        await axis('Aceleracao de avanco', acAv)
        await axis('Velocidade de retorno', velRet)
        await axis('Aceleracao de retorno', acRet)
        await axis('Velocidade de referencia', velRef)
        await axis('Aceleracao de referencia', acRef)       
    }

    const __start: T['__start'] = async () => {
        return axis('Start serial', true)
    }

    const _setPrintingsSettings: T['_setPrintingsSettings'] = async settings => {
        const {
            avanco,
            retorno
        } = settings

        const nma = avanco.numeroDeMensagens.run().value
        const nmr = retorno.numeroDeMensagens.run().value
        const ppia = avanco.posicaoDaPrimeiraImpressao.run().value
        const puia = avanco.posicaoDaUltimaImpressao.run().value
        const ppir = retorno.posicaoDaPrimeiraImpressao.run().value
        const puir = retorno.posicaoDaUltimaImpressao.run().value

        // Fix: Would be more descriptive, precise and eficient for clients to program avanco and 
        //      retorno separetely
        await axis('Numero de mensagem no avanco', nma)
        await axis('Numero de mensagem no retorno', nmr)
        await axis('Posicao da primeira impressao no avanco', ppia)
        await axis('Posicao da ultima mensagem no avanco', puia)
        await axis('Posicao da primeira impressao no retorno', ppir)
        await axis('Posicao da ultima mensagem no retorno', puir)
    }

    const __forceLooseReference: T['__forceLooseReference'] = async () => {
        const isReferenced = (await _getStatusL()).referenciado
        if (isReferenced===true) {
            await axis('Pausa serial', true)
            return
        } else {
            return
        }
    }

    const __sendPrintSignal: T['__sendPrintSignal'] = async () => {
        return await axis('Teste de impressao serial', true)
    }

    const _setGeneralOptions: T['_setGeneralOptions'] = async opts => {

        type Options_ = typeof opts

        type CmppOptionsCaster = {
            [K in keyof Options_]: (key: undefined, value: Options_[K]) => boolean
        }

        const ligadoIsTrueDesligadoIsFalse = (key: undefined, value: Options_[keyof Options_] ) => {
            if (key===key) { }
            return value==='Ligado' ? true : false
        }

        const caster: CmppOptionsCaster = {
            entradaDeStartEntreEixosHabilitado: (key, value) => ligadoIsTrueDesligadoIsFalse(undefined,value),
            reducaoDoNivelDaCorrenteNoRepouso: (key, value) => ligadoIsTrueDesligadoIsFalse(undefined,value),
            saidaDeStartNoAvancoLigado: (key, value) => ligadoIsTrueDesligadoIsFalse(undefined,value),
            saidaDeStartNoRetornoLigado: (key, value) => ligadoIsTrueDesligadoIsFalse(undefined,value),
            startExternoHabilitado: (key, value) => ligadoIsTrueDesligadoIsFalse(undefined,value),
            zeroIndexHabilitadoParaProtecao: (key, value) => ligadoIsTrueDesligadoIsFalse(undefined,value),
        }

        type OptsCasted = {
            [K in keyof Options_]: boolean
        }

        const casted = (opts: Options_, caster: CmppOptionsCaster): OptsCasted => {
            let r: Partial<OptsCasted>  = {}
            Object.keys(opts).forEach( key_ => {
                const key: keyof Options_ = key_ as keyof Options_
                const castedValue = opts[key]
                const f = caster[key]
                const newValue = f(undefined, castedValue)
                r = {...r, [key]: newValue}
            })
            return (r as OptsCasted)
        }

        const {
            entradaDeStartEntreEixosHabilitado,
            reducaoDoNivelDaCorrenteNoRepouso,
            saidaDeStartNoAvancoLigado,
            saidaDeStartNoRetornoLigado,
            startExternoHabilitado,
            zeroIndexHabilitadoParaProtecao,
        } = casted(opts, caster)

        await axis('Entrada de start entre eixo habilitado', entradaDeStartEntreEixosHabilitado)
        await axis('Reducao do nivel de corrente em repouso',reducaoDoNivelDaCorrenteNoRepouso)
        await axis('Saida de start no avanco ligado', saidaDeStartNoAvancoLigado)
        await axis('Saida de start no retorno ligado', saidaDeStartNoRetornoLigado)
        await axis('Start externo habilitado', startExternoHabilitado)
        await axis('Zero Index habilitado p/ protecao', zeroIndexHabilitadoParaProtecao)
    }

    const _getCurrentAbsolutePosition: T['_getCurrentAbsolutePosition'] = async () => {
        const curPos = Step(await getPosicaoAtual(portName, baudRate, channel))
        return curPos
    }

    const _getEstimatedFrequency: T['_getEstimatedFrequency'] = async () => {
         //Fix:  When to read direct the position and when to use cached trajectory information?
        //      what whould imply in this decision
        //      How not to rush the communication channel with not urgent data? 
        //      What the trade-offs evolved? (ie: accuracy, precision vs ???)
        const s0 = await _getCurrentAbsolutePosition()
        const t0 = AbsoluteTime(now())
        const s1 = await _getCurrentAbsolutePosition()
        const t1 = AbsoluteTime(now())
        const ds = s1.sub(s0) // ds = s1-s0
        const dt = t1.displacement(t0) // dt = t1-t0
        const dt_ = dt.toTickClock(FTickPerMilisec)
        return StepFrequency(ds,dt_)
    }


    return {
        getInfo,
        _getStatusL,
        _isConnected,
        _isReferenced,
        _setKinematics,
        _setPrintingsSettings,
        __start,
        __forceLooseReference,
        __sendPrintSignal,
        _setGeneralOptions,
        _getCurrentAbsolutePosition,
        _getEstimatedFrequency,
        _getEstimatedFrequencyChangeRate,
        _getPosition,
        _getSensors,
    }

}