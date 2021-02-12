import { BaudRate } from '../serial-local-driver'
import { CommDriver, communicate } from './communicate'
import { mkSetRemoteMessageFrame, mkSelectRemoteMessageFrame } from './printer-protocol'

const ACK = 6
const NACK = 21

const printerTimeout = 5000

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
    
    const ports = CommDriver.listPorts().then( portInfos => {
        portInfos.map( portInfo => {
    
            const port = portInfo.uid
            sendPrinter(port, 9600)(1, 'oi')
                .then( () => {
                    setTimeout( () => { 
                        sendPrinter(port, 9600)(4,'E44.A5')
                    },1500)
                })
                .catch( err => {
                    console.log("Has some Error", err)
                })
    
       }) 
    
    })
}
//11944724357

Test1()


