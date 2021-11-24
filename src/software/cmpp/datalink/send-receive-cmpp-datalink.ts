import { communicate} from '../../serial/communicate'
import { 
    FrameCore, 
    FrameInterpreted,
    compileCoreFrame,
    flattenFrameSerialized,
} from './frame'
import { CmppDataLinkInterpreter } from './interpreter'
import { BaudRate } from '../../serial/baudrate'
import { listSerialPorts } from '../../serial/index'

const CmppTimeout = 5000

export const sendCmpp = (
        portName: string, baudRate: BaudRate
    ) => (
        frame: FrameCore
    ): Promise<FrameInterpreted> => new Promise ( (resolve, reject) => {

        let hasError: boolean = false

        const s0 = compileCoreFrame(frame)
        const dataToSend = flattenFrameSerialized(s0)
        //console.log(`Enviando para CMPP: `, dataToSend)
        const hasSentSignal = () => undefined // do nothing

        communicate(
            portName, 
            baudRate, 
            dataToSend, 
            //onData
            (dataReceived, hasFinished):void => {

                //console.log(`==============================> recebeu!`)
                //console.log(dataReceived)
                
                const handleByte = CmppDataLinkInterpreter({
                    onSuccess: event => {
                        const {frameInterpreted, rawInput} = event
                        console.log(`Received a frame from CMPP on port ${portName}/${String(baudRate)}`)
                        console.log(`original input raw:`, rawInput)
                        console.log("Frame interpreted:")
                        console.table(frameInterpreted)
                        hasFinished().then( () => {
                            resolve(frameInterpreted)
                        })
                        
                    },
                    onError: event => {
                        const {errorMessage, partialFrame, rawInput, coreState} = event
                        console.log(`Error on interpreting cmpp returned frame: ${errorMessage}`) 
                        hasError = true
                        hasFinished().then( () => {
                            reject(event)
                        })
                    }
                })

                for (const eachByte of dataReceived) {
                    if (hasError===false) {
                        handleByte(eachByte)
                    } else {
                        //console.log(`TO BE DONE: fix: What to do with unhandled remaining data in the case of a error detection in between receved data`)
                        // fix: What to do with unhandled remaining data in the case of a error detection in between receved data
                    }
                }

            }, 
            CmppTimeout,
            )
})


const Test1 = () => {

    const Helper_ListPorts_or_Throw = async () => await listSerialPorts().fmap( r => r.orDie()).async()
    
    const data = [27, 2, 64, 210, 12, 0, 27, 3, 221] //[0x1B,0x02,0x00,0x1C,0x00,0x00,0x1B,0x03,0xDF]
    const port = 'com1'
    const ports = Helper_ListPorts_or_Throw().then( portInfos => {
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






