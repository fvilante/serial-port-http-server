import { delay } from "./core/delay"
import { Address, Axis } from "./global-env/global"
import { executeInSequence } from "./core/promise-utils"
import { CMPP00LG } from "./cmpp/transport/memmap-CMPP00LG"
import { Pulses, PulsesPerTick, PulsesPerTickSquared } from "./cmpp/physical-dimensions/physical-dimensions"
import { Tunnel } from "./cmpp/datalink/core/tunnel"

// This is an append file for axis-controler.ts, and my dreem is to use another
// strategy for initialization of the axis. Something more robust.

const makeTransportLayer = CMPP00LG


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
        const tunnel: Tunnel = {
            portSpec: { 
                path: portName,
                baudRate,
            },
            channel,
        }
        const transportLayer = makeTransportLayer(tunnel)

        return executeInSequence([
            //Atencao: O sensor da gaveta 1 parece estar ligado no pino do start entre eixos de uma das placas
            //por esta razao, antes de tudo é necessario desabilitar o start entre eixos das placas
            () => transportLayer.set('Start externo habilitado', 'desligado'),
            () => transportLayer.set('Entrada de start entre eixo habilitado', 'desligado'),
            () => transportLayer.set('Saida de start no avanco', 'desligado'),
            () => transportLayer.set('Saida de start no retorno', 'desligado'),
            //
            () => transportLayer.set('Start automatico no avanco', 'desligado'),
            () => transportLayer.set('Start automatico no retorno', 'desligado'),
            //O eixo Z é vertical, por isto a corrente nele é mantida em máxima
            //As correcoes são desligadas para evitar a situacao onde o motor seja desenergijado
            //e o cabeçote caia sem aviso previo.
            // FIX: O referenciamento do eixo Z deveria ser monitorado, de modo que uma perda da referencia no Z deveria levar aos demais eixos a parar
            // como medida preventiva
            () => transportLayer.set('Reducao da corrente em repouso', 'desligado'),
            () => transportLayer.set('Giro com funcao de protecao', 'ligado'), // veja FIX acima (nao foi ainda implementado por completo!)
            () => transportLayer.set('Giro com funcao de correcao', 'desligado'),
            // uma velocidade de referencia nao muito alta por se tratar do eixo vertical
            () => transportLayer.set('Velocidade de referencia', PulsesPerTick(velRef)), // TODO: Remove this unsafe type coersion here
            () => transportLayer.set('Aceleracao de referencia', PulsesPerTickSquared(acRef)), // TODO: Remove this unsafe type coersion here
            // necessario para referencia quando o equipamento é ligado ou foi forçado a perda da referencia
            // remove pausa serial
            () => transportLayer.set('Pausa serial', 'desligado'),
            // parece ser necessario um delay para que a placa processe estas
            // informacoes antes de receber o start
            // talvez este seja o motivo de algumas vezes na referencia, o eixo sair correndo velozmente
            // acompanhar se isto resolverá este problema em definitivo
            // RESPOSTA: Apos alguns meses o problema parece estar resolvido, porem nao estou certo que é este delay que resolveu
            //           mas uma serie de ações para deixar a communicacao com o cmpp mais robusta e menos sucetivel a erros
            // TODO: Remove below delay if possible
            () => delay(1500), 
        ])
    },
    afterReferenceConfig: async (axisName, min, max, defaultVelocity, defaultAcceleration) => {
        const { portName, baudRate, channel} = Address[`Axis`][axisName]
        const tunnel: Tunnel = {
            portSpec: { 
                path: portName,
                baudRate,
            },
            channel,
        }
        const transportLayer = makeTransportLayer(tunnel)
        return executeInSequence([
            () => transportLayer.set('Posicao inicial', Pulses(min)),
            () => transportLayer.set('Posicao final', Pulses(max)),
            () => transportLayer.set('Velocidade de avanco', PulsesPerTick(defaultVelocity)), //400
            () => transportLayer.set('Velocidade de retorno', PulsesPerTick(defaultVelocity)), //600
            () => transportLayer.set('Aceleracao de avanco', PulsesPerTickSquared(defaultAcceleration)),
            () => transportLayer.set('Aceleracao de retorno', PulsesPerTickSquared(defaultAcceleration)),
            () => transportLayer.set('Start automatico no avanco', 'desligado'),
            () => transportLayer.set('Start automatico no retorno', 'desligado'),
        ])
    }   
}

export const X_AxisStarterKit: AxisStarterKit = {
    axisName: 'XAxis',
    minAbsolutePosition: 610,
    maxAbsolutePOsition: 8355+25,
    milimeterToPulseRatio: (152.87/1000),
    velRef: 350,
    acRef: 3000,
    defaultVelocity: 2000,
    defaultAcceleration: 4000,
    preReferenceConfig: (axisName: Axis, velRef, acRef) => {
        const { portName, baudRate, channel} = Address[`Axis`][axisName]
        const tunnel: Tunnel = {
            portSpec: { 
                path: portName,
                baudRate,
            },
            channel,
        }
        const transportLayer = makeTransportLayer(tunnel)

        return executeInSequence([
            //Atencao: O sensor da gaveta 1 parece estar ligado no pino do start entre eixos de uma das placas
            //por esta razao, antes de tudo é necessario desabilitar o start entre eixos das placas
            () => transportLayer.set('Start externo habilitado', 'desligado'),
            () => transportLayer.set('Entrada de start entre eixo habilitado', "desligado"),
            () => transportLayer.set('Saida de start no avanco', "desligado"),
            () => transportLayer.set('Saida de start no retorno', "desligado"),
            //
            () => transportLayer.set('Start automatico no avanco', "desligado"),
            () => transportLayer.set('Start automatico no retorno', "desligado"),
            //
            () => transportLayer.set('Reducao da corrente em repouso', 'ligado'),
            () => transportLayer.set('Giro com funcao de protecao', 'ligado'), // veja FIX acima (nao foi ainda implementado por completo!)
            () => transportLayer.set('Giro com funcao de correcao', "desligado"),
            // uma velocidade de referencia nao muito alta por se tratar do eixo vertical
            () => transportLayer.set('Velocidade de referencia', PulsesPerTick(velRef)),
            () => transportLayer.set('Aceleracao de referencia', PulsesPerTickSquared(acRef)),
            // necessario para referencia quando o equipamento é ligado ou foi forçado a perda da referencia
            // remove pausa serial
            () => transportLayer.set('Pausa serial', "desligado"),
            // parece ser necessario um delay para que a placa processe estas
            // informacoes antes de receber o start
            // talvez este seja o motivo de algumas vezes na referencia, o eixo sair correndo velozmente
            // acompanhar se isto resolverá este problema em definitivo
            () => delay(1500), 
        ])
    },
    afterReferenceConfig: async (axisName, min, max, defaultVelocity, defaultAcceleration) => {
        const { portName, baudRate, channel} = Address[`Axis`][axisName]
        const tunnel: Tunnel = {
            portSpec: { 
                path: portName,
                baudRate,
            },
            channel,
        }
        const transportLayer = makeTransportLayer(tunnel)
        return executeInSequence([
            () => transportLayer.set('Posicao inicial', Pulses(min)),
            () => transportLayer.set('Posicao final', Pulses(max)),
            () => transportLayer.set('Velocidade de avanco', PulsesPerTick(defaultVelocity)), 
            () => transportLayer.set('Velocidade de retorno', PulsesPerTick(defaultVelocity)),
            () => transportLayer.set('Aceleracao de avanco', PulsesPerTickSquared(defaultAcceleration)),
            () => transportLayer.set('Aceleracao de retorno', PulsesPerTickSquared(defaultAcceleration)),
            () => transportLayer.set('Start automatico no avanco', 'desligado'),
            () => transportLayer.set('Start automatico no retorno', 'desligado'),
        ])
    }
}


export const Y_AxisStarterKit: AxisStarterKit = {
    axisName: 'YAxis',
    minAbsolutePosition: 610,
    maxAbsolutePOsition: 7310,
    milimeterToPulseRatio: (69.82*0.9936/0.9984523)/1000,//((69.82)*(420+2.7/420))/1000, //1. 7.22/100, 2. 69.82/1000
    velRef: 350,
    acRef: 3000,
    defaultVelocity: 1000,
    defaultAcceleration: 1500,
    preReferenceConfig: (axisName: Axis, velRef, acRef) => {
        const { portName, baudRate, channel} = Address[`Axis`][axisName]
        const tunnel: Tunnel = {
            portSpec: { 
                path: portName,
                baudRate,
            },
            channel,
        }
        const axis = makeTransportLayer(tunnel)

        return executeInSequence([
            //Atencao: O sensor da gaveta 1 parece estar ligado no pino do start entre eixos de uma das placas
            //por esta razao, antes de tudo é necessario desabilitar o start entre eixos das placas
            () => axis.set('Start externo habilitado', 'desligado'),
            () => axis.set('Entrada de start entre eixo habilitado', 'desligado'),
            () => axis.set('Saida de start no avanco', 'desligado'),
            () => axis.set('Saida de start no retorno', 'desligado'),
            //desliga modo passo a passo e garante modo continuo,
            () => axis.set('Numero de mensagem no avanco', 0),
            () => axis.set('Numero de mensagem no retorno', 0),
            () => axis.set('Modo continuo/passo a passo', 'continuo'),
            //
            () => axis.set('Start automatico no avanco', 'desligado'),
            () => axis.set('Start automatico no retorno', 'desligado'),
            //
            () => axis.set('Reducao da corrente em repouso', 'ligado'),
            () => axis.set('Giro com funcao de protecao', 'ligado'), // veja FIX acima (nao foi ainda implementado por completo!)
            () => axis.set('Giro com funcao de correcao', 'desligado'),
            // uma velocidade de referencia nao muito alta por se tratar do eixo vertical
            () => axis.set('Velocidade de referencia', PulsesPerTick(velRef)),
            () => axis.set('Aceleracao de referencia', PulsesPerTickSquared(acRef)),
            // necessario para referencia quando o equipamento é ligado ou foi forçado a perda da referencia
            // remove pausa serial
            () => axis.set('Pausa serial', 'desligado'),
            // parece ser necessario um delay para que a placa processe estas
            // informacoes antes de receber o start
            // talvez este seja o motivo de algumas vezes na referencia, o eixo sair correndo velozmente
            // acompanhar se isto resolverá este problema em definitivo
            () => delay(1500), 
        ])
    },
    afterReferenceConfig: async (axisName, min, max, defaultVelocity, defaultAcceleration) => {
        const { portName, baudRate, channel} = Address[`Axis`][axisName]
        const tunnel: Tunnel = {
            portSpec: { 
                path: portName,
                baudRate,
            },
            channel,
        }
        const axis = makeTransportLayer(tunnel)
        return executeInSequence([
            () => axis.set('Posicao inicial', Pulses(min)),
            () => axis.set('Posicao final', Pulses(max)),
            () => axis.set('Velocidade de avanco', PulsesPerTick(defaultVelocity)), 
            () => axis.set('Velocidade de retorno', PulsesPerTick(defaultVelocity)), 
            () => axis.set('Aceleracao de avanco', PulsesPerTickSquared(defaultAcceleration)),
            () => axis.set('Aceleracao de retorno', PulsesPerTickSquared(defaultAcceleration)),
            () => axis.set('Start automatico no avanco', 'desligado'),
            () => axis.set('Start automatico no retorno', 'desligado'),
        ])
    }
}