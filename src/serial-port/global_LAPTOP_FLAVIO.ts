
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
            portName: 'com31',
            baudRate: 9600,
            channel: 0,
        },
        YAxis: {
            portName: 'com29',
            baudRate: 9600,
            channel: 0,
        },
        ZAxis: {
            portName: 'com30',
            baudRate: 9600,
            channel: 0,
        },
    }
    
}

//31 -> X
//29 -> Y
//30 -> Z

