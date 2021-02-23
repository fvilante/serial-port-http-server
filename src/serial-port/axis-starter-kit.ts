

// This is an append file for axis-controler.ts, and my dreem is to use another
// strategy for initialization of the axis. Something more robust.

import { delay } from "../utils/delay"
import { setParam_ } from "./cmpp-memmap-layer"
import { Address, Axis } from "./global"
import { Driver } from "./mapa_de_memoria"
import { executeInSequence } from "./promise-utils"


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
    maxAbsolutePOsition: 8355+25,
    milimeterToPulseRatio: (152.87/1000),
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
    milimeterToPulseRatio: (69.82*0.9936)/1000,//((69.82)*(420+2.7/420))/1000, //1. 7.22/100, 2. 69.82/1000
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