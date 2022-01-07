import { BaudRate } from '../serial/core/baudrate'
import { delay } from '../core/delay'
import { communicate } from '../serial/communicate'
import { mkSetRemoteMessageFrame, mkSelectRemoteMessageFrame } from './printer-protocol'
//test
import { listSerialPorts } from '../serial/index'

const ACK = 6
const NACK = 21

const printerTimeout = 3000


const sendReceiveFrameToPrinter = (
    portName: string, baudRate: BaudRate = 9600
) => async (
    frame: readonly number[]
): Promise<void> => new Promise( (resolve, reject) => {
    console.log('oi10')
    communicate(
        portName,
        baudRate,
        frame,
        //onData
        (dataReceived, hasFinished) => {
            const printerResponse = dataReceived[0]
           
            hasFinished() 
                .then( () => {
                    if (printerResponse===ACK) {
                        resolve()
                    } else if (printerResponse === NACK) {
                        reject('Printer responded with NACK instead of ACK')
                    } else {
                        reject(`Printer do not responded ACK or NACK as expected, but responded with byte='${printerResponse}'.`)
                    }
                })


        },
        printerTimeout,
    )
    console.log('oi11')
    
})

// Fix: Rename sendPrinter2 to sendPrinter but before remove the current sendPrint
//      This was named to 2 just temporarily to avoid broke sendPrinter in the transition
//      This is the official up-to-date function
export const sendPrinter2 = (
    portName: string, baudRate: BaudRate = 9600
) => async (
    remoteFieldIndex: number, text: string
): Promise<void> => {

    const selectMessage = mkSelectRemoteMessageFrame(remoteFieldIndex)
    const setText = mkSetRemoteMessageFrame(text)
    await sendReceiveFrameToPrinter(portName, baudRate)(selectMessage)
    await delay(500) // fix: May be unecessary this delay
    await sendReceiveFrameToPrinter(portName, baudRate)(setText)
    await delay(500) // fix: May be unecessary this delay
    console.log(`Successfully selected remote field "${remoteFieldIndex}" and set remote text to "${text}" on Printer on port ${portName}/${String(baudRate)}.`);
    return 
}





export const sendPrinter = (
        portName: string, baudRate: BaudRate = 9600
    ) => (
        remoteFieldIndex: number, text: string
    ): Promise<void> => new Promise ( (resolve, reject) => {
        const selectMessage = mkSelectRemoteMessageFrame(remoteFieldIndex)
        const setText = mkSetRemoteMessageFrame(text)
        communicate(
            portName,
            baudRate,
            selectMessage,
            //onData
            (dataReceived, hasFinsihed) => {
                const printerResponse = dataReceived[0]
                if (printerResponse===ACK) {
                    
                    hasFinsihed().then( () => {

                        communicate(
                            portName,
                            baudRate,
                            setText,
                            (dataReceived, hasFinsihed) => {
                                const printerResponse2 = dataReceived[0]
                                if (printerResponse2===ACK) {
                                    // FIX: Preciso esperar a promise hasFinisehd resolver ante sde tentar abrir novamente a porta
                                    hasFinsihed().then( () => resolve());
                                    console.log(`Successfully selected remote field "${remoteFieldIndex}" and set remote text to "${text}" on Printer on port ${portName}/${String(baudRate)}.`);

                                } else if (printerResponse2 === NACK) {
                                    hasFinsihed().finally( () => {
                                        const err =`Printer on port ${portName}/${String(baudRate)} returned an NACK when we tried to "set text" to "${text}" on remote field number "${remoteFieldIndex}".`
                                        console.log(err)
                                        reject(err);
                                    });

                                } else {
                                    hasFinsihed().finally( () => {
                                        const err = `Printer on port ${portName}/${String(baudRate)} returned an unknown return value (expected some of [${ACK}, ${NACK}] and got [${printerResponse2}]). `
                                        console.log(err)
                                        reject(err);
                                    })
                                    
                                }
                                console.log(`Data Received from port ${portName} -> ${dataReceived}`)
                            },
                            printerTimeout);


                    });

                } else if (printerResponse === NACK) {
                    hasFinsihed().finally( () => {
                        const err = `Printer on port ${portName}/${String(baudRate)} returned an NACK when we tried to select remote field number ${remoteFieldIndex}.`
                        console.log(err)
                        reject(err);
                    });
                } else {
                    hasFinsihed().finally( () => {
                        const err = `Printer on port ${portName}/${String(baudRate)} returned an unknown return value (expected some of [${ACK}, ${NACK}] and got [${printerResponse}]). `
                        console.log(err)
                        reject(err);
                    })
                }
                console.log(`Data Received from port ${portName} -> ${dataReceived}`)
            },
            printerTimeout,
        );
})

const Test1 = () => {

    const ports = listSerialPorts().then( portInfos => {
        portInfos.map( portInfo => {
    
            const port = portInfo.path
            sendPrinter(port, 9600)(2, 'oi')
                .then( () => {
                    setTimeout( () => { 
                        sendPrinter(port, 9600)(2,'T202')
                    },1500)
                })
                .catch( err => {
                    console.log("Has some Error", err)
                })
    
       }) 
    
    })
}


const Test2 = async (): Promise<void> => {

  const index = 3
  await sendPrinter2('COM9',9600)(2,`EMS344`)
// 30
/*
    const arr = Range(0,5,1).map( index => async (): Promise<void> => {

        console.log(`CampoRemoto=${index}`)
        await sendPrinter('COM9',9600)(index,`->${index}`)
        await delay(7000)

    })
    await executeInSequence(arr)
*/

}


//Test1();

//Test2()


