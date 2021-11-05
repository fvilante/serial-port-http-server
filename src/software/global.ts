import { BaudRate } from "../serial-local-driver";
import { AddressFromLocal as Address_LAPTOP_FLAVIO} from './global_LAPTOP_FLAVIO'
import { AddressFromLocal as Address_MAQUINA_LEONI} from './global_MAQUINA_LEONI'

const LAPTOP_FLAVIO = 'LAPTOP_FLAVIO'
const MAQUINA_LEONI = 'MAQUINA_LEONI'
type LAPTOP_FLAVIO = typeof LAPTOP_FLAVIO
type MAQUINA_LEONI = typeof MAQUINA_LEONI


export type ComputerOrigin = LAPTOP_FLAVIO | MAQUINA_LEONI

// Enviromental parameters (specific of each machine state)
const useInThisMachine = 'LAPTOP_FLAVIO' as ComputerOrigin

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
    

export const Address: Address = 
    useInThisMachine === MAQUINA_LEONI ? Address_MAQUINA_LEONI : Address_LAPTOP_FLAVIO  