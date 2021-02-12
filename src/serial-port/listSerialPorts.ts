// tslint:disable: no-expression-statement
// tslint:disable: typedef

import * as SerialPort  from 'serialport';

const serialPort = SerialPort.default

export type PortInfo = {
    path: string;
    manufacturer?: string;
    serialNumber?: string;
    pnpId?: string;
    locationId?: string;
    productId?: string;
    vendorId?: string;
}

export const listSerialPorts = async ():Promise<readonly PortInfo[]> => serialPort.list()

// informal test

const main = async () => {
    const a: SerialPort.PortInfo[] = await serialPort.list()
    a.map( p => console.log(p) )
}

main()
