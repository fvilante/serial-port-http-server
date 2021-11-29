
//Represents the position of a bit inside the a 16 bits word

import { Byte } from "../../core/byte"

//TODO: Extract this type to a more convenient file (ie: core-types.ts ?!)
export type StartBit = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 

export type ParamCore<T extends string> = {
    name: T
    waddr: Byte   // word address 
}

export type Param_16bits<T extends string> = {
    type: '16 Bits'
} & ParamCore<T>


export type Param_8bits<T extends string> = {
    type: '8 Bits'
    startBit: StartBit //takes 8 bits stating in 'startsBit' (included)
} & ParamCore<T>


export type Param_1bit<T extends string> = { 
    type: '1 Bit'
    startBit: StartBit //takes 1 bits stating in 'startsBit' (included)
} & ParamCore<T>

export type Param<T extends string> = 
    | Param_16bits<T>
    | Param_8bits<T>
    | Param_1bit<T>


// constructors

export const param_16bits = <T extends string>(etc: Omit<Param_16bits<T>,'type'>):Param_16bits<T> => {
    return {  type: '16 Bits', ...etc }
}

export const param_8bits = <T extends string>(etc: Omit<Param_8bits<T>,'type'>):Param_8bits<T> => {
    return {  type: '8 Bits', ...etc }
}

export const param_1bit = <T extends string>(etc: Omit<Param_1bit<T>,'type'>):Param_1bit<T> => {
    return {  type: '1 Bit', ...etc }
}