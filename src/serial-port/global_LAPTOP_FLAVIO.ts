
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
        // 35 = no; 
        // 36 = eixo pequeno (Z);
        // 37 = eixo sem braço (Y);
        // 38 = no;
        // 39 = eixo longo  (X);
        XAxis: {
            portName: 'com39',
            baudRate: 9600,
            channel: 0,
        },
        YAxis: {
            portName: 'com37',
            baudRate: 9600,
            channel: 0,
        },
        ZAxis: {
            portName: 'com36',
            baudRate: 9600,
            channel: 0,
        },
    }
    
}

//31 -> X
//29 -> Y
//30 -> Z

