
import { Address } from "./global";
    

export const AddressFromLocal: Address = {
    Printers: {
        printerBlack: {
            portName: 'com9', //com17
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