import { BaudRate } from '../../serial/baudrate'
import { bit_test } from "../../core/bit-wise-utils"
import { FrameCore } from "../datalink/cmpp-datalink-protocol"
import { sendCmpp } from "../datalink/send-receive-cmpp-datalink"
import { word2int } from '../datalink/core-operations'

//let statusLRaw: number | undefined = undefined 




export type StatusLCasted = {
    referenciado: boolean, //d0
    posicaoExecutada: boolean, //d1
    referenciando: boolean, //d2
    direcaoDoMovimento: 'Avanco' | 'Retorno', //d3
    aceleracaoLigada: boolean //d4
    desaceleracaoLigada: boolean //d5
    //velocidadeConstante: boolean // derivado de d4 e d5
}

const castStatusL = (statusL: number): StatusLCasted => {
    return {
        referenciado: bit_test(statusL,0),
        posicaoExecutada: bit_test(statusL,1),
        referenciando: bit_test(statusL,2),
        direcaoDoMovimento: bit_test(statusL,3) === true ? 'Avanco' : 'Retorno',
        aceleracaoLigada: bit_test(statusL,4),
        desaceleracaoLigada: bit_test(statusL,5),
    }
}

export const fetchCMPPStatusL = (portName: string, baudRate: BaudRate, channel: number): Promise<StatusLCasted> => 
    new Promise( (resolve, reject) => {
        //algorigthm: I cannot resolve the waddr of statusL correctly, so I will
        //read 'posicao inicial' and write the same value to get a return packet with the statusL
        const waddr = 0xA0/2
        const frame = FrameCore('STX', 'Solicitacao', channel, waddr, 0)

        sendCmpp(portName, baudRate)(frame)
            .then( res => {

                const dataL = res.dataLow[0]
                const dataH = res.dataHigh[0]
                const data = word2int(dataH, dataL)
                const frame2 = FrameCore('STX', 'Envio', channel, waddr, data)
                
                sendCmpp(portName, baudRate)(frame2)
                    .then( frameRes => {
                        //fix: Should check if received frame is an ACK frame!
                        //     The means if it is an "pacote de retorno sem erro"
                        const statusL = frameRes.dataLow[0]
                        const statusH = frameRes.dataHigh[0]

                        const casted = castStatusL(statusL)
                        
                        resolve(casted)
            }) 
        })
        
})


const Test1 = () => {

    fetchCMPPStatusL('com8',9600,0)
        .then( statusL => {
            console.table(statusL)
        })


}


//Test1();
//console.log('haha real')
