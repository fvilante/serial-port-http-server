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



export type DetectionResult = 'Detected' | 'NotDetected'


//TODO: Implement 'Milisecond' as the return type instead of 'number'
const calculateTimeout = (baudRate: BaudRate): number => {
    //Here we stabilish the timeout as a function of baudRate
    //NOTE: the 100 miliseconds below is totaly arbitrary based in my feelings and experience, maybe this number can be optimized in future
    const timeout =  (9600/baudRate) * 100 // Note: for 9600 is acceptable a 100 miliseconds timeout for wait the reception frame from cmpp then...
    return Math.round(timeout)
}

export const scanCmppInTunnel = (tunnel: Tunnel):Future<Result<FrameInterpreted, Fail>> => {
    const timeout = calculateTimeout(tunnel.portSpec.baudRate)
    const totalRetries = 10 //being ignorante in number of retries :D
    return detectCmpp(tunnel,timeout, totalRetries)
}


//TODO: If we return an Iterator instead of an Array, we can earlier return in case of error 
const main = async () => {

    const spinner = ora('Loading...')

    //param
    const scanFromChannel = 1
    const scanToChannel = 64
    const baudRatesToScan: readonly BaudRate[] = PossibleBaudRates.filter( b => b >=2400 && b<=9600)
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
    spinner.info(msg)

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
                            const msg = `DETECTED: port=${path} baudrate=${baudRate}, cannal=${channel}`
                            spinner.succeed(msg)
                            //console.log(msg)
                        },
                        Error: err => {
                            spinner.start()
                            spinner.text = `channel= ${tunnel.channel} port=${tunnel.portSpec.path} baudrate=${tunnel.portSpec.baudRate} error type=${err.kind} `
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


main()