import { BaudRate } from '../../../serial/baudrate'
import { FrameCore } from "../../datalink/index"
import { sendCmpp } from "../../datalink/send-receive-cmpp-datalink"
import { word2int } from '../../datalink/int-to-word-conversion'
import { ACK } from '../../datalink/core/core-types'

// obtem posicao atual
// TODO:
//  qual o endereço correto?
//  qual a unidade de medida da leitura ?
//  como monitorar frequentemente sem bloquear a comunicacao para outros blocos?

//TODO: Return type Pulses instead of uncasted 'number'
//TODO: change parameters to Tunnel
export const getPosicaoAtual = (portName: string, baudRate: BaudRate, channel: number): Promise<number> => 
    new Promise( (resolve, reject) => {

        const direction = 'Solicitacao'
        const waddr = 0x60/2
        const data = 0
        const frame = FrameCore('STX', direction, channel, waddr, data)
        sendCmpp(portName, baudRate)(frame)
            .then( frameInterpreted => {
                if(frameInterpreted.startByte[0] === ACK) {
                    const {dataHigh, dataLow } = frameInterpreted
                    const dataH = dataHigh[0]
                    const dataL = dataLow[0]
                    const posicaoAtual = word2int(dataH, dataL)
                    resolve(posicaoAtual)
                } else {
                    throw new Error('ACK quando tentou-se saber a posicao atual do cmpp')
                }
                
            })
            .catch( err => reject(err))

})