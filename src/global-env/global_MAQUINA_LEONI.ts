import { Address } from "./global";
    

export const AddressFromLocal: Address = {
    Printers: {
        printerBlack: {
            portName: 'com18',
            baudRate: 9600,
        },
        printerWhite: {
            portName: 'com14',
            baudRate: 9600,
        },
    },
    Axis: {
        XAxis: {
            portName: 'com12',
            baudRate: 9600,
            channel: 0,
        },
        YAxis: {
            portName: 'com1',
            baudRate: 9600,
            channel: 0,
        },
        ZAxis: {
            portName: 'com13',
            baudRate: 9600,
            channel: 0,
        },
    }
    
}