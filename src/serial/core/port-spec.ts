import { BaudRate } from './baudrate';
import { PortInfo } from './port-info';

//TODO: In future make it a Validated<string> or something similar.


export type PortPath = PortInfo['path']; // ie: 'com1', 'com2', etc... in Microsoft Windows. //NOTE: In Unix-like operation systems this strings have different structure (ie: 'USBA1', 'USBA2', etc...)

export type PortSpec = {
  readonly path: PortPath;
  readonly baudRate: BaudRate;
};
