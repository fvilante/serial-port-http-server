
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
            portName: 'com53', 
            baudRate: 9600,
            channel: 0,
        },
        YAxis: {
            portName: 'com48',
            baudRate: 9600, 
            channel: 0,
        },
        ZAxis: {
            portName: 'com50',
            baudRate: 9600,
            channel: 0,
        },
    }
    
}