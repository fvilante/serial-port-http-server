import { BaudRate } from './baudrate';

//TODO: In future make it a Validated<string> or something similar.


export type PortPath = string; // ie: 'com1', 'com2', etc...


export type PortSpec = {
  readonly path: PortPath;
  readonly baudRate: BaudRate;
};
