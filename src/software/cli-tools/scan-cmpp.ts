import ora from 'ora'
import { detectCmppInTunnel, Tunnel } from "../cmpp/utils/detect-cmpp"
import { ExecuteInParalel, executeInSequence } from "../core/promise-utils"
import { makeRange } from "../core/utils"
import { listSerialPorts, isSerialPortEmulatedWithCom0Com, isSerialPortLoopBackForTest} from "../serial/list-serial-ports"
import { BaudRate, PossibleBaudRates } from "../serial/baudrate"
import { PortSpec } from '../serial'
import { Channel } from '../cmpp/datalink/core-types'


// Strategy: First all tunnels of same baudrate, then the second baudarate, until the end
const makeAllTunnels = (from: Channel, to: Channel, baudRates: readonly BaudRate[], paths: readonly string[]):(readonly Tunnel[])[] => {
    const channelsToScan = [...makeRange(from,to,1)]
    const makeAllTunnelsForPortPath = (path: Tunnel['portSpec']['path']): readonly Tunnel[] => {
        let tunnels: readonly Tunnel[] = []
        baudRates.forEach( baudRate => {
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
    const allTunnelsByPorts = paths.map( port => {
        return makeAllTunnelsForPortPath(port)
    }) 
    return allTunnelsByPorts
}

const getPortsToScan = async ():Promise<string[]> => {
    return (await listSerialPorts()).filter( port => {
        //TODO: There is an error if we try to scan Software emulated serial port. The program halts. Solve this problem when possible
        const isSoftwareEmulatedPort = isSerialPortEmulatedWithCom0Com(port) || isSerialPortLoopBackForTest(port)
        const isPhysicalPort = !isSoftwareEmulatedPort
        return isPhysicalPort
    }).map( port => port.path)
}


//TODO: If we return an Iterator instead of an Array, we can earlier return in case of error 
const runProgram = async () => {

    const spinner = ora('Loading...')

    //configure
    const [ scanFromChannel, scanToChannel] = [1,64] //[inclusive, exclusive]
    const portsToScan = await getPortsToScan()
    const baudRatesToScan: readonly BaudRate[] = [9600,2400]

    //program
    const msg = `Scanning CMPP devices...
    Looking at:
        Ports [${portsToScan}], 
        Channels [${scanFromChannel}..${scanToChannel}], 
        Baudrates [${baudRatesToScan}]:
    
    Results:
    `
    console.log(msg)

    const allTunnelsByPorts = makeAllTunnels(scanFromChannel, scanToChannel, baudRatesToScan, portsToScan)

    const x = allTunnelsByPorts.map( tunnels => {
        const y = tunnels.map( tunnel => {
            return () => { 
                //console.log(`scanning...`, tunnel)
                return detectCmppInTunnel(tunnel)
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


//runProgram()