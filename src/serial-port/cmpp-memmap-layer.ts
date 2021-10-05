import { BaudRate } from "../serial-local-driver";
import { DirectionKeys, FrameCore, word2int } from "./cmpp/datalink/cmpp-datalink-protocol";
import { GetAllNames, HyperDriver, GetCastFromName, Driver, Param } from "./mapa_de_memoria";
import { executeInSequence } from "./promise-utils";
import { sendCmpp } from './send-receive-cmpp-datalink'



export const setParam_ = 
    (portName: string, baudRate: BaudRate, channel: number) =>
    <D extends HyperDriver>(drive: D) => 
    <N extends GetAllNames<D>, T extends GetCastFromName<D,N>>(name: N, value: T)
    : Promise<void> => new Promise ( (resolve, reject) => {

        console.log(`Enviando para cmpp parametro: '${name}' --> `,value)

        const valueToUint16 = (value:T):number => value as number
        const valueToUint8 = (value: T): number => value as number
        const valueToBoolean = (value:T): boolean => value as boolean

        const sendCmpp_ = sendCmpp(portName,baudRate)
        let direction: DirectionKeys = 'Solicitacao'
        const param = drive.find(p => p.name === name) as Param<string, unknown>
        const {waddr: waddr_,bitLen: bitLen_,startBit: startBit_} = param
        const waddr = waddr_ / 2
        const bitLen = bitLen_ === undefined ? 16 : bitLen_
        const startBit = startBit_ === undefined ? 0 : startBit_
        if (bitLen===16) {
            direction = 'Envio'
            const data = valueToUint16(value);
            const frame = FrameCore('STX', direction, channel, waddr, data)
            sendCmpp_(frame)
                .then( frameInterpreted => resolve())
                .catch( err => reject(err))
        } else if (bitLen===8) {
            if (startBit===0) {
                //byte low
                direction = 'Solicitacao'
                const data = 0;
                const frame = FrameCore('STX', direction, channel, waddr, data)
                sendCmpp_(frame)
                    .then( frameInterpreted => {
                        const { dataHigh, dataLow } = frameInterpreted;
                        const dataL = valueToUint8(value)
                        const dataH = dataHigh[0];
                        const uint16 = word2int(dataH, dataL )
                        const direction = 'Envio';
                        const frame = FrameCore('STX', direction, channel, waddr, uint16)
                        sendCmpp_(frame)
                            .then( frameInterpreted => {
                                resolve()
                            })
                    })
                    .catch( err => reject(err))


            } else if (startBit===8) {
                //byte high
                direction = 'Solicitacao'
                const data = 0;
                const frame = FrameCore('STX', direction, channel, waddr, data)
                sendCmpp_(frame)
                    .then( frameInterpreted => {
                        const { dataHigh, dataLow } = frameInterpreted;
                        const dataL = dataLow[0];
                        const dataH = valueToUint8(value) 
                        const uint16 = word2int(dataH, dataL )
                        const direction = 'Envio';
                        const frame = FrameCore('STX', direction, channel, waddr, uint16)
                        sendCmpp_(frame)
                            .then( frameInterpreted => {
                                resolve()
                            })
                    })
                    .catch( err => reject(err))


            } else {
                throw new Error('TO BE DONE! bitLenght and startBit is only implemented for [1,0] and [1,8] respectivelly.')
            }
            //to be done
            
        } else if (bitLen===1) {
            let mask: number = 0 
            const bit = valueToBoolean(value)
            if(bit===true) {
                direction = 'MascaraParaSetar'     
            } else /*bit===false*/ {
                direction = 'MascaraParaResetar'
            }
            mask = 1 << startBit
            const frame = FrameCore('STX', direction, channel, waddr, mask)
            sendCmpp_(frame)
                .then( frameInterpreted => resolve())
                .catch( err => reject(err))
        } else {
            reject(`bitlen=${bitLen} decimal not found on CMPP memory map.`)
        }
        

})



const Test1 = () => {

    const setParam = setParam_('com1',9600,0)(Driver)

    console.log('Iniciando teste')
    console.log('setando posicao inicial')
    setParam('Posicao final', 2)
        .then( () => {
            console.log('************* posicao inicial setada com sucesso')
            setParam('Start automatico no avanco ligado', false)
        })
        .catch( err => {
            console.log('************* Erro ao setar posicao inicial:', err)
        })

}

const Position = (value: number): number => value
const Acceleration = (value: number): number => value
const Speed = (value: number): number => value
const Time = (value: number): number => value
const Pulses = (value: number): number => value
const LigadoDesligado = (value: 'Ligado'| 'Desligado'): boolean => value === 'Ligado' ? true : false
const AbertoFechado = (value: 'Aberto' | 'Fechado'): boolean => value === 'Aberto' ? true : false
const ContinuoPassoAPasso = (value: 'Continuo' | 'Passo-a-Passo'): boolean => value ==='Continuo' ? true : false
const Adimensional = (value: number): number => value

const Test2 = () => {

    const setParam = setParam_('com1',9600,0)(Driver)
    const X = setParam
    const Z = setParam_('com8',9600,0)(Driver)



    const forcaReferenciaZ = [
        // perde a referencia
        () => Z('Pausa serial', false),
        () => Z('Modo manual serial', false), // bit de desliga o motor
        /*
        // busca a referencia
        //() => setParam('Pausa serial', true),
        //() => setParam('Modo manual serial', false), // bit de desliga o motor
        */
        () => Z('Start serial', true),
    ]

    const forcaReferenciaX = [
        // perde a referencia
        () => X('Pausa serial', false),
        () => X('Modo manual serial', false), // bit de desliga o motor
        /*
        // busca a referencia
        //() => setParam('Pausa serial', true),
        //() => setParam('Modo manual serial', false), // bit de desliga o motor
        */
        () => X('Start serial', true),
    ]

    const SetaposicaofinalpralongeNoX = [
        () => X('Posicao final', Position(5000)),
    ]

    const StartNoX = [
        () => X('Start serial', true),
    ]

    const arr = [
        /*
        () => setParam('Posicao inicial', Position(200)),
        () => setParam('Posicao final', Position(5000)),
        () => setParam('Aceleracao de avanco', Acceleration(1000)),
        () => setParam('Aceleracao de retorno', Acceleration(2000)),
        () => setParam('Velocidade de avanco', Speed(1000)),
        () => setParam('Velocidade de retorno', Speed(2000)),
        
        //() => setParam('Numero de mensagem no avanco',  // byte
        //() => setParam('Numero de mensagem no retorno', // byte
        () => setParam('Posicao da primeira impressao no avanco', Position(10)),
        () => setParam('Posicao da primeira impressao no retorno', Position(100)),
        () => setParam('Posicao da ultima mensagem no avanco', Position(100)),
        () => setParam('Posicao da ultima mensagem no retorno', Position(10)),
        () => setParam('Largura do sinal de impressao', Time(100)),
        () => setParam('Tempo para o start automatico', Time(100)),
        () => setParam('Tempo para o start externo', Time(100)),
        () => setParam('Cota de antecipacao do start entre eixos (pinelmatico)', Pulses(50)),
        () => setParam('Retardo para o start automatico passo a passo', Time(100)),
        // X+0x20 = Flag de configuracao da programacao
        () => setParam('Start automatico no avanco ligado', LigadoDesligado('Desligado')),
        () => setParam('Start automatico no retorno ligado', LigadoDesligado('Desligado')),
        () => setParam('Saida de start no avanco ligado', LigadoDesligado('Desligado')),
        () => setParam('Saida de start no retorno ligado', LigadoDesligado('Desligado')),
        
        () => setParam('Start externo habilitado', LigadoDesligado('Ligado')),
        
        () => setParam('Logica do start externo', AbertoFechado('Aberto')),
        () => setParam('Entrada de start entre eixo habilitado', LigadoDesligado('Desligado')),
        () => setParam('Start externo para referenciar habilitado', LigadoDesligado('Ligado')),
        // X+0x21 = Flag de configuracao da programacao
        () => setParam('Logica do sinal de impressao', AbertoFechado('Aberto')),
        () => setParam('Logica do sinal de reversao', AbertoFechado('Aberto')),
        () => setParam('Selecao de impressao via serial ligada', LigadoDesligado('Desligado')),
        () => setParam('Reversao de impressao via serial ligada', LigadoDesligado('Desligado')),
        () => setParam('Zero Index habilitado p/ protecao', LigadoDesligado('Desligado')),
        () => setParam('Zero Index habilitado p/ correcao', LigadoDesligado('Desligado')),
        () => setParam('Reducao do nivel de corrente em repouso', LigadoDesligado('Desligado')),
        () => setParam('Modo continuo/passo a passo', ContinuoPassoAPasso('Continuo')),
        () => setParam('Retardo para o sinal de impressao', Time(50)),
        //() => setParam('Divisor programado do taco', Adimensional()),
        //Param<'Vago', unknown>,
        //----
        () => setParam('Tolerancia de Erro do zero index', Adimensional(50)),
        () => setParam('Numero de pulsos por volta do motor', Pulses(400)),
        () => setParam('Valor programado da referencia', Adimensional(500)),
        () => setParam('Aceleracao de referencia', Adimensional(500)),
        () => setParam('Velocidade de referencia', Adimensional(5000)),
        // X+0x30 = Flag especial de intertravamento
        () => setParam('Saida de start passo a passo', LigadoDesligado('Desligado')),
        () => setParam('Start automatico passo a passo', LigadoDesligado('Desligado')),
        () => setParam('Selecao de mensagem por multipla', LigadoDesligado('Desligado')),
        () => setParam('Selecao de mensagem por impres�o', LigadoDesligado('Desligado')),
        () => setParam('Selecao de mensagem pela paralela', LigadoDesligado('Desligado')),
        () => setParam('Selecao de mensagem Decrementado no retorno', LigadoDesligado('Desligado')),
        // ------
        //() => setParam('Divisor programado do motor', X()),
        */


        // perde a referencia
        () => X('Pausa serial', true),
        () => X('Modo manual serial', true), // bit de desliga o motor
        
        // busca a referencia
        () => setParam('Pausa serial', false),
        () => setParam('Modo manual serial', false), // bit de desliga o motor
        
        () => X('Start serial', true),
    ]

    

    const juca = () => {
        const arr2 = [...forcaReferenciaZ, ...forcaReferenciaX, ...SetaposicaofinalpralongeNoX]

        executeInSequence(forcaReferenciaZ);
        setTimeout( () => { 
            executeInSequence([...SetaposicaofinalpralongeNoX,...forcaReferenciaX])
            setInterval(() => { 
                executeInSequence([...StartNoX])
            },15000)
        }, 15000)
    }

    //juca();

    executeInSequence(arr);

    

    

    



}


//Test2();

