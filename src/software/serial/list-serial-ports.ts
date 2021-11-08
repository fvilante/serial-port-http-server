import SerialPort  from 'serialport'
import { PortInfo } from "./types";


export const listSerialPorts = (): Promise<readonly PortInfo[]> => SerialPort.list()
