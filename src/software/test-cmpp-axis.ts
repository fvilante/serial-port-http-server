import { BaudRate } from './serial/baudrate'
import { delay } from "./utils/delay"
import { AxisStarterKit } from "./axis-controler"
import { setParam_ } from "./cmpp-memmap-layer"
import { Address, Axis } from "./global"
import { Driver } from "./mapa_de_memoria"
import { executeInSequence } from "./promise-utils"


export const test_starterKit: AxisStarterKit = {
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

const startNoCmpp = async (portName: string, baudRate: BaudRate, channel: number = 0): Promise<void> => {

    const axis = setParam_(portName,baudRate,channel)(Driver)
    const velRef = 50
    const acRef = 1000

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
        () => axis('Start serial',true)

    ])

}

const run = async () => {   
    const portName = 'com8'
    const baudRate = 9600
    const channel = 0
    console.log(`Tentando referenciar CMPP que esta em: ${portName}/${baudRate} canal=${channel}`)
    await startNoCmpp(portName,baudRate,channel)
}

run()

