import { executeInSequence } from "../../core/promise-utils"
import { explodeTunnel, Tunnel } from "../datalink/tunnel"
import { CMPP00LG, LigadoDesligado, ContinuoPassoAPasso, AbertoFechado } from "../transport/memmap-CMPP00LG"
import { Pulses, PulsesPerTick, PulsesPerTickSquared, TicksOfClock } from "../transport/memmap-types"
import { forceLooseReference } from "./utils/force-loose-reference"
import { getPosicaoAtual } from "./utils/get-pos-atual"
import { doReferenceIfNecessary, forceReference, isReferenced, isReferencing, ReferenceParameters } from "./utils/reference"
import { isStoped, start, waitToStop } from "./utils/start"

const makeTransportLayer = CMPP00LG

export type CmppControler = {
    kind: 'CmppControler'
    start: () => Promise<void>
    waitToStop: () => Promise<void>
    isReferencing: () => Promise<boolean>
    isReferenced: () => Promise<boolean>
    isStoped: () => Promise<boolean>
    forceReference: (program: ReferenceParameters) => Promise<void>
    forceLooseReference: () => Promise<void>
    doReferenceIfNecessary: (program: ReferenceParameters) => Promise<void>
    setMainParameters: (parameters: Partial<MainParameters>) => Promise<void>
    //getMainParameters: () => Promise<MainParameters>
    getCurrentPosition: () => Promise<Pulses>
    // TODO: decide if the below functions should be removed
    //__set: () => void
    //__get: () => void
}


export type ParametrosDeMovimento = {
    'Posicao inicial': Pulses
    'Posicao final': Pulses
    'Aceleracao de avanco': PulsesPerTickSquared
    'Aceleracao de retorno': PulsesPerTickSquared
    'Velocidade de avanco': PulsesPerTick
    'Velocidade de retorno': PulsesPerTick
}

export type ParametrosDeImpressao = {
    'Numero de mensagem no avanco': number
    'Numero de mensagem no retorno': number
    'Posicao da primeira impressao no avanco': Pulses
    'Posicao da primeira impressao no retorno': Pulses
    'Posicao da ultima mensagem no avanco': Pulses
    'Posicao da ultima mensagem no retorno': Pulses
    //'Mensagem reversa ligada': 'retorno' | 'avanco' // TODO: nao identifiquei este parametro no meu mapa de memoria cadastrado CMPP00LG (talvez esteja com outro nome verificar quando possivel.)
}

export type ConfiguracaoDeCiclo = {
    'Tempo para o start automatico': TicksOfClock
    'Tempo para o start externo': TicksOfClock
    'Start automatico no avanco': LigadoDesligado
    'Start automatico no retorno': LigadoDesligado
    'Modo continuo/passo a passo': ContinuoPassoAPasso
}

export type ConfiguracaoDaImpressora = {
    'Logica do sinal de impressao': AbertoFechado
    'Largura do sinal de impressao': TicksOfClock
    'Reversao de impressao via serial': LigadoDesligado //TODO: checar se/porque esta qualidade 'via serial' é necessaria
    'Selecao de impressao via serial': LigadoDesligado //TODO: checar se/porque esta qualidade 'via serial' é necessaria
}

export type IntertravamentoParaDoisEixos = {
    //'Antecipacao de saida de start': Pulses // TODO: nao identifiquei este parametro no meu mapa de memoria cadastrado CMPP00LG (talvez esteja com outro nome verificar quando possivel.)
    'Saida de start no avanco': LigadoDesligado
    'Saida de start no retorno': LigadoDesligado
    'Entrada de start entre eixo habilitado': LigadoDesligado
    'Referencia pelo start externo': LigadoDesligado
}

export type ProgramaDeEixo =
    & ParametrosDeMovimento
    & ParametrosDeImpressao
    & ConfiguracaoDeCiclo
    & ConfiguracaoDaImpressora
    & IntertravamentoParaDoisEixos

export type ConfiguracaoDoEixo = {
    //'Numero do canal': Channel // TODO: Numero do canal nao é um parametro em si do mapa de memoria mas um parametro. Definir como tratar isto neste contexto. (Na verdade estas divisoes sao mais relativas ao menu TTC3100, mas aqui nao estamos definindo o menu mas um modo de acesso aos parametros do cmpp). (lembrar que a funcao para setar o numero de canal de uma placa nao esta implementado aqui ainda)
    'Numero de pulsos por volta do motor': Pulses
    //'Janela de protecao do giro': Pulses // TODO: nao identifiquei este parametro no meu mapa de memoria cadastrado CMPP00LG (talvez esteja com outro nome verificar quando possivel.)
    //'Deslocamento/Giro do motor': [60.96; 71.12; 81.28; etc...] // TODO: nao identifiquei este parametro no meu mapa de memoria cadastrado CMPP00LG (talvez esteja com outro nome verificar quando possivel.)
    'Giro com funcao de protecao': LigadoDesligado
    'Giro com funcao de correcao': LigadoDesligado
    'Logica do start externo': LigadoDesligado
    'Valor da posicao de referencia': Pulses
    'Velocidade de referencia': PulsesPerTick
    'Aceleracao de referencia': PulsesPerTickSquared
    'Reducao da corrente em repouso': LigadoDesligado
    'Start externo habilitado': LigadoDesligado //NOTE: O texto do ttc3100 diz 'Start pelo teclado e externo' porém como esta interface visa apenas o layer referente a placa cmpp e elea nao tem teclado entao acredito que está ok esta descricao.
}

export type MainParameters = {
    'Posicao inicial': Pulses
    'Posicao final': Pulses
    'Velocidade de avanco': PulsesPerTick
    'Velocidade de retorno': PulsesPerTick
    'Aceleracao de avanco': PulsesPerTickSquared
    'Aceleracao de retorno': PulsesPerTickSquared
    'Start automatico no avanco': LigadoDesligado
    'Start automatico no retorno': LigadoDesligado
    'Tempo para o start automatico': TicksOfClock
    'Reducao da corrente em repouso': LigadoDesligado
}

export const makeCmppControler = (tunnel: Tunnel):CmppControler => {
    const transportLayer = makeTransportLayer(tunnel)

    const defaultReferenceParameters: ReferenceParameters = {
        "Velocidade de referencia": PulsesPerTick(600),
        "Aceleracao de referencia": PulsesPerTickSquared(5000),
    }

    return {
        kind: 'CmppControler',

        start: async () => {
            return await start(tunnel)
        },
        waitToStop: async () => {
            return await waitToStop(tunnel)
        },
        isReferencing: async () => {
            return await isReferencing(tunnel) 
        },
        isReferenced: async () => {
            return await isReferenced(tunnel)
        },
        isStoped: async () => {
            return await isStoped(tunnel)
        },
        forceReference: async (program: Partial<ReferenceParameters> = defaultReferenceParameters) => {
            const program_ = {...defaultReferenceParameters, ...program}
            return await forceReference(tunnel, program_)   
        },
        forceLooseReference: async () => {
            return await forceLooseReference(tunnel)
        },
        doReferenceIfNecessary: async (program: ReferenceParameters) => {
            return await doReferenceIfNecessary(tunnel, program)
        },
        setMainParameters: async (parameters: Partial<MainParameters>) => {
            const keys = Object.keys(parameters) as readonly (keyof MainParameters)[]
            return await executeInSequence(keys.map( key => {
                const value = parameters[key]
                if (value!==undefined) {
                    return () => transportLayer.set(key,value)
                } else {
                    throw new Error('This branch should never happen')
                }
            }))
        },

        /*getMainParameters: async (): Promise<MainParameters> => {
            const fetch = async(): Promise<MainParameters> => {
                return {
                    'Posicao inicial': await transportLayer.get('Posicao inicial'),
                    'Posicao final': await transportLayer.get('Posicao final'),
                    'Velocidade de avanco':await transportLayer.get('Velocidade de avanco'),
                    'Velocidade de retorno': await transportLayer.get('Velocidade de retorno'),
                    'Aceleracao de avanco': await transportLayer.get('Aceleracao de avanco'),
                    'Aceleracao de retorno': await transportLayer.get('Aceleracao de retorno'),
                    'Start automatico no avanco': await transportLayer.get('Start automatico no avanco'),
                    'Start automatico no retorno': await transportLayer.get('Start automatico no retorno'),
                    'Tempo para o start automatico': await transportLayer.get('Tempo para o start automatico'),
                    'Reducao do nivel de corrente em repouso': await transportLayer.get('Reducao do nivel de corrente em repouso'),
                }
            }
            return fetch()
        },*/

        getCurrentPosition: async () => {
            const { path, baudRate, channel} = explodeTunnel(tunnel)
            const pos = await getPosicaoAtual(path, baudRate, channel) 
            return Pulses(pos) 
        },

        // TODO: decide if the below functions should be removed
        //__set: axis.set,
        //__get: axis.get,
    }

}