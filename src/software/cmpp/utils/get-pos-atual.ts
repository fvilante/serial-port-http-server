import { BaudRate } from '../../serial/baudrate'
import { FrameCore } from "../datalink/index"
import { sendCmpp } from "../datalink/send-receive-cmpp-datalink"
import { word2int } from '../datalink/int-to-word-conversion'



// obtem posicao atual
// PE:
//  qual o endereço correto?
//  qual a unidade de medida da leitura ?
//  como monitorar frequentemente sem bloquear a comunicacao para outros blocos?


export const getPosicaoAtual = (portName: string, baudRate: BaudRate, channel: number): Promise<number> => 
    new Promise( (resolve, reject) => {

        const direction = 'Solicitacao'
        const waddr = 0x60/2
        const data = 0
        const frame = FrameCore('STX', direction, channel, waddr, data)
        sendCmpp(portName, baudRate)(frame)
            .then( frameInterpreted => {
                //fix: checar se resposta em frameInterpreted foi 'ACK' ou 'NACK'
                const {dataHigh, dataLow } = frameInterpreted
                const dataH = dataHigh[0]
                const dataL = dataLow[0]
                const posicaoAtual = word2int(dataH, dataL)
                resolve(posicaoAtual)
            })
            .catch( err => reject(err))

})