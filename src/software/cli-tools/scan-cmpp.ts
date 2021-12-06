import ora from 'ora'
import { detectCmpp, Tunnel } from "../cmpp/utils/detect-cmpp"
import { ExecuteInParalel, executeInSequence } from "../core/promise-utils"
import { makeRange } from "../core/utils"
import { listSerialPorts, isSerialPortEmulatedWithCom0Com, isSerialPortLoopBackForTest} from "../serial/list-serial-ports"
import { BaudRate, PossibleBaudRates } from "../serial/baudrate"
import { Future } from "../adts/future"
import { Result } from "../adts/result"
import { FrameInterpreted } from "../cmpp/datalink"
import { Fail } from "../cmpp/datalink/transactioners/safe-payload-transact"
import { RetryPolicy } from '../cmpp/datalink/transactioners/retry-logic-ADT'



export type DetectionResult = 'Detected' | 'NotDetected'


//TODO: In future extract this function to a better place
//TODO: Implement 'Milisecond' as the return type instead of 'number'
export const calculateTimeout = (baudRate: BaudRate): number => {
    //Here we stabilish the timeout as a function of baudRate
    //NOTE: the 100 miliseconds below is totaly arbitrary based in my feelings and experience, maybe this number can be optimized in future
    const timeout =  (9600/baudRate) * 100 // Note: for 9600 is acceptable a 100 miliseconds timeout for wait the reception frame from cmpp then...
    return Math.round(timeout)
}

export const scanCmppInTunnel = (tunnel: Tunnel):Future<Result<FrameInterpreted, Fail>> => {
    const timeout = calculateTimeout(tunnel.portSpec.baudRate)
    const retryPolicy: RetryPolicy = {
        totalRetriesOnTimeoutError: 0,        // low because most of the attempts will return a timeout error
        totalRetriesOnInterpretationError: 15 // higher so we can deal with very noise enviroments
    }
    return detectCmpp(tunnel,timeout, retryPolicy)
}


//TODO: If we return an Iterator instead of an Array, we can earlier return in case of error 
const test1 = async () => {

    const spinner = ora('Loading...')

    //param
    const scanFromChannel = 1
    const scanToChannel = 64
    const baudRatesToScan: readonly BaudRate[] = [9600,2400] //[9600,2400, 115200] //PossibleBaudRates.filter( b => b >=2400 && b<=19200)
    const portsToScan = (await listSerialPorts()).filter( port => {
        //TODO: There is an error if we try to scan Software emulated serial port. The program halts. Solve this problem when possible
        const isSoftwareEmulatedPort = isSerialPortEmulatedWithCom0Com(port) || isSerialPortLoopBackForTest(port)
        const isPhysicalPort = !isSoftwareEmulatedPort
        return isPhysicalPort
    }).map( port => port.path)
    
    //program
    const channelsToScan = [...makeRange(scanFromChannel,scanToChannel,1)]

    
    const makeAllTunnelsForPortPath = (path: Tunnel['portSpec']['path']): readonly Tunnel[] => {
        let tunnels: readonly Tunnel[] = []
        baudRatesToScan.forEach( baudRate => {
            channelsToScan.forEach( channel => {
                tunnels = [...tunnels, {
                    channel,
                    portSpec: {
                        path,
                        baudRate,
                    },
                }]
            }) 
        })
        return tunnels
    }

    const allTunnelsByPorts = portsToScan.map( port => {
        return makeAllTunnelsForPortPath(port)
    }) 


    const msg = `Scanning CMPP devices...
    Looking at:
        Ports [${portsToScan}], 
        Channels [${scanFromChannel}..${scanToChannel}], 
        Baudrates [${baudRatesToScan}]:
    
    Results:
    `
    console.log(msg)

    const x = allTunnelsByPorts.map( tunnels => {
        const y = tunnels.map( tunnel => {
            return () => { 
                //console.log(`scanning...`, tunnel)
                return scanCmppInTunnel(tunnel)
                .map(result => {
                    result.forEach({
                        Ok: response => {
                            const { channel, portSpec} = tunnel
                            const { path, baudRate} = portSpec
                            const msg = `CMPP DEVICE DETECTED: port=${path} baudrate=${baudRate}, channel=${channel}.`
                            spinner.succeed(msg)
                            //console.log(msg)
                        },
                        Error: err => {
                            spinner.start()
                            if(err.kind==='TimeoutErrorEvent') {
                                spinner.text = `channel=${tunnel.channel}, port=${tunnel.portSpec.path}, baudrate=${tunnel.portSpec.baudRate}, error_type=${err.kind}.`
                            } else {
                                const msg = `error_type=${err.kind}: channel=${tunnel.channel}, port=${tunnel.portSpec.path}, baudrate=${tunnel.portSpec.baudRate}`
                                spinner.warn(msg)
                            }

                            //console.log(tunnel, err)
                        }
                    })
                }).async()
            }
        })
        return () => executeInSequence(y)
    })

    await ExecuteInParalel(x)
        .then( () => {
            spinner.stop()
        })

}


//test1()