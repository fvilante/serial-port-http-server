
import { StartByteNum } from "./core-types"


export type Payload = readonly [
    dirChan: number, 
    waddr: number, 
    dataLow: number, 
    dataHigh: number
]

//TODO: Implement this type if it worth
//TODO: rename to 'Payload' because this type is isomorphic with 'FrameInterpreted' and 'FrameCore'
export type PayloadCore = { 
    readonly payload: Payload, 
    readonly startByte: StartByteNum //TODO: Rename to 'startByteNum'
}
