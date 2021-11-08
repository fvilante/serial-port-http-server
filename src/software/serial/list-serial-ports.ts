import SerialPort  from 'serialport'
import { PortInfo } from "./types";


export const listSerialPorts = (): Promise<readonly PortInfo[]> => SerialPort.list()


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
