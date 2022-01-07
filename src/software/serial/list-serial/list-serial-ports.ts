import SerialPort  from 'serialport'
import { PortInfo } from "../core/port-info";
import { LoopBackPortsInfo } from '../port-controler/loopback/loopback';

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


export const listSerialPorts = (): Promise<readonly PortInfo[]> => {
    return new Promise( (resolve, reject) => {
        //TODO: Should this code be inside a try..catch clause ?
        SerialPort.list().then( official_ports => {
            const official_ports_ = castPortInfo(official_ports)
            const offered_ports = [...official_ports_, ...LoopBackPortsInfo]
            resolve(offered_ports)
        }).catch( reason => reject(reason))
        
    })
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
