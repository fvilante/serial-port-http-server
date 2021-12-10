import { BaudRate } from '../../serial/baudrate'
import { bit_test } from "../../core/bit-wise-utils"
import { FrameCore } from "../datalink/index"
import { sendCmpp } from "../datalink/send-receive-cmpp-datalink"
import { word2int } from '../datalink/int-to-word-conversion'
import { CMPP00LG } from '../transport/memmap-CMPP00LG'

const makeAxis = CMPP00LG

export type StatusL = {
    referenciado: boolean, //d0
    posicaoExecutada: boolean, //d1
    referenciando: boolean, //d2
    direcaoDoMovimento: 'Avanco' | 'Retorno', //d3
    aceleracaoLigada: boolean //d4
    desaceleracaoLigada: boolean //d5
    //velocidadeConstante: boolean // derivado de d4 e d5
}

const castStatusL = (statusL: number): StatusL => {
    return {
        referenciado: bit_test(statusL,0),
        posicaoExecutada: bit_test(statusL,1),
        referenciando: bit_test(statusL,2),
        direcaoDoMovimento: bit_test(statusL,3) === true ? 'Avanco' : 'Retorno',
        aceleracaoLigada: bit_test(statusL,4),
        desaceleracaoLigada: bit_test(statusL,5),
    }
}

//TODO: Change arguments to type Tunnel
export const getStatusLow = (portName: string, baudRate: BaudRate, channel: number): Promise<StatusL> => 

    new Promise( (resolve, reject) => {

        //TODO: Get the correct waddr of Status byte, to avoid bellow indirect algorighm
        //algorigthm: I cannot resolve the waddr of statusL correctly, so I will
        //read 'posicao inicial' and write the same value to get a return packet with the statusL
        const waddr = 0xA0/2
        const frameToGet = FrameCore('STX', 'Solicitacao', channel, waddr, 0)

        sendCmpp(portName, baudRate)(frameToGet)
            .then( response => {

                const dataL = response.dataLow[0]
                const dataH = response.dataHigh[0]
                const data = word2int(dataH, dataL)
                const frameToSet = FrameCore('STX', 'Envio', channel, waddr, data)
                
                sendCmpp(portName, baudRate)(frameToSet)
                    .then( response => {
                        //TODO: Should check if received frame is an ACK frame!
                        //      I mean if it is an "pacote de retorno sem erro"
                        const statusL_ = response.dataLow[0]
                        const statusH_ = response.dataHigh[0]

                        const statusL = castStatusL(statusL_)
                        resolve(statusL)
            }) 
        })
        
})

// TODO: delete this test code
const Test1 = () => {

    getStatusLow('com51',9600,0)
        .then( statusL => {
            console.table(statusL)
        })


}


//Test1();

