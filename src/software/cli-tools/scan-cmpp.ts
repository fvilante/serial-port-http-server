import { detectCmpp, Tunnel } from "../cmpp/utils/detect-cmpp"
import { executeInSequence } from "../core/promise-utils"
import { makeRange } from "../core/utils"
import { listSerialPorts, isSerialPortEmulatedWithCom0Com, isSerialPortLoopBackForTest} from "../serial/list-serial-ports"
import { BaudRate } from "../serial/baudrate"


export type DetectionResult = 'Detected' | 'NotDetected'

export const scanCmppInTunnel = (tunnel: Tunnel): Promise<DetectionResult> => {

    return new Promise( (resolve, reject) => {

        const timeout = tunnel.portSpec.baudRate >= 9600 ? 100 : 250 //TODO: Arbitrary defined, should be a better form to define time between transmitted and received payload

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