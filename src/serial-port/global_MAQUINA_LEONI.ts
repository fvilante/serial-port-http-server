import { BaudRate } from "../serial-local-driver";

export type Address = {
    Printers: {
        printerBlack: {
            portName: string,
            baudRate: BaudRate,
        },
        printerWhite: {
            portName: string,
            baudRate: BaudRate,
        },
    },
    Axis: {
        XAxis: {
            portName: string,
            baudRate: BaudRate,
            channel: number,
        },
        YAxis: {
            portName: string,
            baudRate: BaudRate,
            channel: number,
        },
        ZAxis: {
            portName: string,
            baudRate: BaudRate,
            channel: number,
        },
    }
}

export type Peripherals = keyof Address
export type Axis = keyof Address['Axis']
export type Printers = keyof Address['Printers']
    

export const Address: Address = {
    Printers: {
        printerBlack: {
            portName: 'com2',
            baudRate: 9600,
        },
        printerWhite: {
            portName: 'com9',
            baudRate: 9600,
        },
    },
    Axis: {
        XAxis: {
            portName: 'com1',
            baudRate: 9600,
            channel: 0,
        },
        YAxis: {
            portName: 'com2',
            baudRate: 9600,
            channel: 0,
        },
        ZAxis: {
            portName: 'com8',
            baudRate: 9600,
            channel: 0,
        },
    }
    
}