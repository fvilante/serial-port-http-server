import { communicate} from '../../serial/communicate'
import { 
    FrameCore, 
    FrameInterpreted,
    compileCoreFrame,
    flattenFrameSerialized,
    frameCoreToPayload,
} from './frame-core'
import { CmppDataLinkInterpreter } from './interpreter'
import { BaudRate } from '../../serial/baudrate'
import { listSerialPorts } from '../../serial/index'
import { PortSpec } from '../../serial/port-opener-cb'
import { safePayloadTransact } from './transactioners/safe-payload-transact'
import { RetryPolicy } from './transactioners/retry-logic-ADT'
import { calculateTimeout } from '../../cli-tools/scan-cmpp'

export const sendCmpp = (
        portName: string, baudRate: BaudRate
    ) => (
        frame: FrameCore
    ): Promise<FrameInterpreted> => new Promise ( (resolve, reject) => {

        const portSpec: PortSpec = {
            path: portName,
            baudRate,
        }

        const dataToSend_ = frameCoreToPayload(frame)

        const timeout = calculateTimeout(baudRate)

        const retryPolicy: RetryPolicy = {
            totalRetriesOnInterpretationError: 10,
            totalRetriesOnTimeoutError: 5
        }

        safePayloadTransact(portSpec,dataToSend_, timeout, retryPolicy)
        .forResult({
            Ok: frameInterpreted => {
                console.log(`Received a frame from CMPP on port ${portName}/${String(baudRate)}`)        
                console.log("Frame interpreted:")
                console.table(frameInterpreted)
                resolve(frameInterpreted)
            },
            Error: err => {
                console.log(`Error on receiving data from cmpp: '${err.kind}'`) 
                console.table(err)
                reject(err)
            }

        })

})


const Test1 = () => {
    
    const data = [27, 2, 64, 210, 12, 0, 27, 3, 221] //[0x1B,0x02,0x00,0x1C,0x00,0x00,0x1B,0x03,0xDF]
    const port = 'com1'
    const ports = listSerialPorts().then( portInfos => {
        portInfos.map( portInfo => {
    
            const port = portInfo.path
            const baudRate = 9600
            communicate(
                port,
                baudRate,
                data,
                (dataReceived, hasFinsihed) => {
                    hasFinsihed().then( () => {
                        console.log(`Data Received from port ${port} -> ${dataReceived}`)
                    })
                },
                5000,
            );
    
       }) 
    
    })
}

const Test2 = () => {
    //const ports = listSerialPorts().then( xs  => xs.map( ({path}) => {
        let res: readonly FrameInterpreted[] = []
        const port = 'com1' //path
        const channel = 0
        const waddr1 = 0xD2
        const waddr2 = 27
        const data = 0
        const baudRate = 9600
        const frame1 = FrameCore('STX','Solicitacao',channel,waddr1,data)
        console.log(`esta sendo enviado um frame pela porta ${port}:`)
        const frame2 = FrameCore('STX','Solicitacao',channel,waddr2,data)
        console.table(frame1)
        sendCmpp(port, baudRate)(frame1)
            .then( responseFrame => {
                res = [...res, responseFrame]
                console.log(`**** frame respondido pela porta ${port}: ***`)
                console.table(responseFrame)

                console.log("Enviando mais um frame em seguida apos ter recebido o anterior com sucesso:")
                console.log("segundo frame:")
                console.table(frame2)
                sendCmpp(port, baudRate)(frame2)
                    .then( responseFrame => {
                        res = [...res, responseFrame]
                        console.log(`**** Segundo frame respondido pela porta ${port}: ***`)
                        console.table(responseFrame)

                        console.log("RESUMO:")
                        console.table(res)
                    })


            })



    //}))
}

//Test2();






