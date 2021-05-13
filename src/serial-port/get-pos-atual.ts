import { BaudRate } from "../serial-local-driver"
import { FrameCore, word2int } from "./cmpp/datalink/cmpp-datalink-protocol"
import { setParam_ } from "./cmpp-memmap-layer"
import { Driver } from "./mapa_de_memoria"
import { sendCmpp } from "./send-receive-cmpp-datalink"



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
            .then( res => {
                const dataH = res.dataHigh[0]
                const dataL = res.dataLow[0]
                const posicaoAtual = word2int(dataH, dataL)
                resolve(posicaoAtual)
            })

})

const Test = () => {

    const portName = 'com8'

    const Z = setParam_('com8',9600,0)(Driver)

    getPosicaoAtual(portName, 9600, 0)
        .then( posicaoAtualIni => {
            console.log(`POSICAO ATUAL = ${posicaoAtualIni}`)
            Z('Start serial', true)
            .then( () => {
                getPosicaoAtual(portName, 9600, 0)
                .then( posicaoAtual => {
                    console.log(`POSICAO ATUAL = ${posicaoAtual}`)
                })
        })

        })
    
}


//Test();