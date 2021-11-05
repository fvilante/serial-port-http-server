import { BaudRate } from '../serial/baudrate'
import { listSerialPorts } from "../listSerialPorts"
import { ExecuteInParalel, executeInSequence } from "../promise-utils"
import { sendPrinter2 } from "../printer/send-receive-printer"


type Channel = {portName: string, baudRate: BaudRate}
type PrinterDetectionResponse = Map<Channel, {
    type: 'IMAGE 9232 detected' | 'Printer NOT present'
    detail: string
}>

const detectPrinters = async ():Promise<PrinterDetectionResponse> => {

    const res: PrinterDetectionResponse = new Map()
    console.log(`Detectando portas seriais...`)
    const portsInfo = await listSerialPorts()
    const ports = portsInfo.map( x => x.path) as readonly string[]
    console.log(`Portas detectadas:`, ports)
    const baudRates: readonly BaudRate[] = [9600]
    console.log(`As tentativas serao feitas feita em nestas velocidades (bps):`, baudRates)
    console.log('Aguarde detectando...')
    const DetectAll = ports.map( portName => {
        // Fix: I would like to look for more speeds like 2400 etc
        const baudRate = 9600
        // same port but different baud rates --> process it sequencially and not in parallel

        return  () => {
            console.log(`Procurando na porta/baudrate = ${portName}/${baudRate}`)
            return sendPrinter2(portName, baudRate)(3, portName)
            .then( () => {
                console.log(`Encontrado na porta: ${portName}/${baudRate}`)
                res.set({portName, baudRate},{
                    type: 'IMAGE 9232 detected',
                    detail: 'Can select remote field and set message'
                })
            })
            .catch( err => {
                console.log(`**NÃO** encontrado na porta: ${portName}/${baudRate}`)
                res.set({portName, baudRate},{
                    type: 'Printer NOT present',
                    detail: `Error, cannot found printer -> '${err}'`
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

    const printers = await detectPrinters()

}

run()

