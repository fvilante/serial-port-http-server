import { BaudRate } from '../serial/baudrate'
import { FrameCore, FrameInterpreted } from "../cmpp/datalink/index"
import { listSerialPorts } from "../serial/index"
import { ExecuteInParalel } from "../core/promise-utils"
import { sendCmpp } from "../cmpp/datalink/send-receive-cmpp-datalink"



type SerialChannel = {portName: string, baudRate: BaudRate}
type CMPPDetectionResponse = Map<SerialChannel, {
    type: 'CMPP - Posijet Mortor Driver' | 'CMPP NOT present'
    detail: FrameInterpreted | string
}>

const detectCMPP = async ():Promise<CMPPDetectionResponse> => {

    const Helper_ListPorts_or_Throw = async () => await listSerialPorts().fmap( r => r.orDie()).async()

    const res: CMPPDetectionResponse = new Map()
    console.log(`Detectando portas seriais...`)
    const portsInfo = await Helper_ListPorts_or_Throw()
    const ports = portsInfo.map( x => x.path) as readonly string[]
    console.log(`Portas detectadas:`, ports)
    const baudRates: readonly BaudRate[] = [9600]
    console.log(`As tentativas serao feitas feita em nestas velocidades (bps):`, baudRates)
    console.log('Aguarde detectando...')
    const DetectAll = ports.map( portName => {
        // Fix: I would like to look for more speeds like 2400 etc and mult channel
        const baudRate = 9600
        const channel = 0
        const waddr = 0xA0
        const frame = FrameCore('STX','Solicitacao',channel, waddr,0)
        return  async () => {
            console.log(`Procurando na porta/baudrate = ${portName}/${baudRate}`)
            return sendCmpp(portName, baudRate)(frame)
            .then( frameInterpreted => {
                console.log(`Encontrado na porta: ${portName}/${baudRate}`)
                res.set({portName, baudRate},{
                    type: 'CMPP - Posijet Mortor Driver',
                    detail: frameInterpreted,
                })
            })
            .catch( err => {
                console.log(`**NÃO** encontrado na porta: ${portName}/${baudRate}`)
                res.set({portName, baudRate},{
                    type: 'CMPP NOT present',
                    detail: `${err}`
                })
            })
        }
    })
    await ExecuteInParalel(DetectAll)
        .then( () => {
            // FIX: This report is not being show I do not found why
            //      but console.log of low level functions are show the detection phase (provisorily)
            console.log('Fim da busca.')
            console.log("Produzindo report final")
            res.forEach( (result, channel) => {
                console.log(result, channel)
            })

        })

    return res

}


const run = async ():Promise<void> => {

    const printers = await detectCMPP()
    
}

run()
