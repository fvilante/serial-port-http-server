import { listSerialPorts, PortOpener } from "../serial";
import { frameCoreToPayload } from "../cmpp/datalink/frame";
import { cmppSimpleTransaction } from "../cmpp/datalink/transactioners/simple-transaction";
import { isSerialPortEmulatedWithCom0Com, isSerialPortLoopBackForTest } from "../serial/list-serial-ports";
import { executeInSequence } from "../core/promise-utils";
import { BaudRate } from "../serial/baudrate";

//TODO: For some reason when CMPP is 'NOT DETECTED' some resource got not cleanned correctly. Solve this problem.
//      Eventually should be better to change de algorithm to a more phase controled step-by-step 
//      (ie: first open all different ports in a particular baudrate, proccess then in sequence, close, re-open in another baudrate until the end) 

type DetectionResult = 'Detected' | 'Not Detected'

// NOTE: the result promise never rejects, always resolve
const detectCmppInPort = async (portPath: string, baudRate: BaudRate, timeout: number): Promise<DetectionResult> => {
    const [payload] = frameCoreToPayload({
        startByte: 'STX',
        direction: 'Solicitacao',
        waddr: 0x00,
        channel: 0,
        uint16: 0x00,
    })
    return new Promise( (resolve_, reject) => {
        let id = setTimeout( () => {
            resolve_('Not Detected')
        }, timeout)
        const resolve = (value:DetectionResult):void => {
            clearTimeout(id)
            resolve_(value)
        }
        PortOpener(portPath,baudRate)
            .then( portOpened => {
                cmppSimpleTransaction(portOpened)(payload)
                    .then( frameInterpreted => {
                        portOpened.close()
                            .then( () => {
                                resolve('Detected')
                            })
                            .catch( err => {
                                resolve('Detected')
                            })
                        
                    })
                    .catch( err => {
                        portOpened.close()
                            .then( () => {
                                resolve('Not Detected')
                            })
                            .catch( err => {
                                resolve('Not Detected')
                            })
                    })
            })
            .catch( err => {
                resolve('Not Detected')
            })
    })

    
}


//TODO: Extract this function to a util lib
export const crossProduct = <A,B>(as: readonly A[], bs: readonly B[]): readonly (readonly [A,B])[] => {
    let buffer: readonly (readonly [A,B])[] = []
    as.forEach( a => {
        bs.forEach( b => {
            buffer = [...buffer, [a,b]]
        })
    })
    return buffer
}

const main = async () => {
    const timeout = 400 //TODO: improve this number
    const baudRates: readonly BaudRate[] = [9600]
    const ports_ = await listSerialPorts()
    const ports = ports_.filter( portInfo => {
        const isPortEmulated = isSerialPortEmulatedWithCom0Com(portInfo) || isSerialPortLoopBackForTest(portInfo)
        return !isPortEmulated
    })
    const [...toCheck] = crossProduct(ports, baudRates)
    const effects = toCheck.map( probe => {
        return () => new Promise<void>( (resolve, reject) => {
            const [portToCheck, baudRate] = probe
            const path = portToCheck.path
            //console.log(`verificando em: ${path}/${baudRate}`)
            detectCmppInPort(path, baudRate, timeout)
                .then( result => {
                    console.log(`Resultado em: ${path}/${baudRate}  ===> ${result}`)
                    resolve()
                })
            })
            
    })

    await executeInSequence(effects)
        
     

}

main().then( () => {
    console.log('fim')
});