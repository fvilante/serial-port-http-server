import SerialPort  from 'serialport'
import { PortInfo } from "./port-info";
import { Future, Future_, UnsafePromiseError } from '../adts/future'
import { Result } from '../adts/result'
import { LoopBackPortsInfo } from './loopback';

// NOTE: Today both PortInfo types are equals, but they may differ in future code changings
//       this is why we preffer to not reuse SerialPort.PortInfo type
const castPortInfo = (ports: SerialPort.PortInfo[]): readonly PortInfo[] => {
    return ports.map( p => {
        return { 
            path: p.path,
            serialNumber: p.serialNumber,
            manufacturer: p.manufacturer,
            pnpId: p.pnpId,
            locationId: p.locationId,
            productId: p.productId,
            vendorId: p.vendorId,
        }
    })
}


export const listSerialPorts = (): Future<Result<readonly PortInfo[],UnsafePromiseError>> => {
    return Future_
        .fromUnsafePromise(async () => {
            const official_ports = await SerialPort.list()
            const offered_ports = [...official_ports, ...LoopBackPortsInfo]
            return offered_ports
        })
        .map( oficialports => oficialports.map(castPortInfo))  
    }


// NOTE: 
//  com0com is a free software to emulate a pair of loopback serial ports in microsoft-windows.
//  below is a conventional output from a 'listSerialPorts' call:
/*  
    {
        "locationId": "CNCA1",
        "manufacturer": "Vyacheslav Frolov" as const,
        "path": "COM4",                           
        "pnpId": "COM0COM\\PORT\\CNCA1",
        "productId": undefined,
        "serialNumber": undefined,
        "vendorId": undefined,
    },
    {
        "locationId": "CNCB1",
        "manufacturer": "Vyacheslav Frolov" as const,
        "path": "COM5",                           
        "pnpId": "COM0COM\\PORT\\CNCB1",
        "productId": undefined,
        "serialNumber": undefined,
        "vendorId": undefined,
    },
*/
export const isSerialPortEmulatedWithCom0Com = (port: PortInfo):boolean => {
    return port.manufacturer === "Vyacheslav Frolov"
}

export const isSerialPortLoopBackForTest = (port: PortInfo):boolean => {
    return port.manufacturer === "Flavio Vilante"
}
