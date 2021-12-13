import { executeInSequence } from "../../core/promise-utils"
import { CMPP00LG, LigadoDesligado } from "../transport/memmap-CMPP00LG"
import { Pulses, PulsesPerTick, PulsesPerTickSquared, TicksOfClock } from "../transport/memmap-types"
import { explodeTunnel, Kinematics } from "./core"
import { Tunnel } from "../utils/detect-cmpp"
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
    getMainParameters: () => Promise<MainParameters>
    getCurrentPosition: () => Promise<Pulses>
    // TODO: decide if the below functions should be removed
    //__set: () => void
    //__get: () => void
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
    'Reducao do nivel de corrente em repouso': LigadoDesligado
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

        getMainParameters: async (): Promise<MainParameters> => {
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
        },

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