import { detectCmpp, Tunnel } from "../cmpp/utils/detect-cmpp"
import { ExecuteInParalel, executeInSequence } from "../core/promise-utils"
import { makeRange } from "../core/utils"
import { listSerialPorts, isSerialPortEmulatedWithCom0Com, isSerialPortLoopBackForTest} from "../serial/list-serial-ports"
import { BaudRate, PossibleBaudRates } from "../serial/baudrate"



export type DetectionResult = 'Detected' | 'NotDetected'


//TODO: Implement 'Milisecond' as the return type instead of 'number'
const calculateTimeout = (baudRate: BaudRate): number => {
    //Here we stabilish the timeout as a function of baudRate
    //NOTE: the 100 miliseconds below is totaly arbitrary based in my feelings and experience, maybe this number can be optimized in future
    const timeout =  (9600/baudRate) * 100 // Note: for 9600 is acceptable a 100 miliseconds timeout for wait the reception frame from cmpp then...
    return Math.round(timeout)
}

export const scanCmppInTunnel = (tunnel: Tunnel): Promise<DetectionResult> => {

    return new Promise( (resolve, reject) => {

        const timeout = calculateTimeout(tunnel.portSpec.baudRate)
        //console.log(timeout)

        detectCmpp(tunnel,timeout, {
            BEGIN: () => {
                
            },
            onDetected: tunnel => {
                resolve('Detected')
            },
            onNotDetected: () => {
                resolve('NotDetected')
            },
            onError: () => {
                resolve('NotDetected')
            },
            END: () => {
    
            }
        })


    })
}

const main = async () => {


    const allPaths = (await listSerialPorts()).filter( port => {
        //TODO: There is an error if we try to scan Software emulated serial port. The program halts. Solve this problem when possible
        const isSoftwareEmulatedPort = isSerialPortEmulatedWithCom0Com(port) || isSerialPortLoopBackForTest(port)
        const isPhysicalPort = !isSoftwareEmulatedPort
        return isPhysicalPort
    }).map( port => port.path)
    const allBaudRates: readonly BaudRate[] = [9600,2400] 
    const allChannels = [...makeRange(1,10,1)]

    
    const makeAllTunnels = (): readonly Tunnel[] => {
        let tunnels: readonly Tunnel[] = []
        allPaths.forEach( path => {
            allBaudRates.forEach( baudRate => {
                allChannels.forEach( channel => {
                    tunnels = [...tunnels, {
                        channel,
                        portSpec: {
                            path,
                            baudRate,
                        },
                    }]
                })
            })
        })
        return tunnels
    }

    const allTunnels = makeAllTunnels()

    //TODO: If we return an Iterator instead of an Array, we can earlier return if any error 

    const scanAll = allTunnels.map( tunnel => {
        
        return () => scanCmppInTunnel(tunnel)
            .then(result => {
                if (result==='Detected') {
                    const { channel, portSpec} = tunnel
                    const { path, baudRate} = portSpec
                    console.log(`${result}: porta=${path}/${baudRate}, cannal=${channel}`)
                }
            })
    })

    

    await executeInSequence(scanAll)

}


main()