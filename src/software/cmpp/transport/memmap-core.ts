
//Represents the position of a bit inside the a 16 bits word

import { Byte } from "../../core/byte"

//TODO: Extract this type to a more convenient file (ie: core-types.ts ?!)
export type StartBit = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 

export type UInt16 = number // unsigned integer of 16 bits //TODO: Improve the safety of this cast (ie: Validated<A> ?!)
export type UInt8 = number // unsigned integer of 8 bits //TODO: Improve the safety of this cast (ie: Validated<A> ?!)
export type UInt1 = 0 | 1 // unsigned integer of 1 bits //TODO: Improve the safety of this cast (ie: Validated<A> ?!)


export type ParamCore<T extends string, A, B> = {
    name: T
    waddr: Byte   // word address 
} & CmppType<A,B>

// NOTE: 'A' is the source in user level, 'B' is the target in the transport level
export type CmppType<A,B> = {
    serialize: (_:A) => B
    deserialize: (_:B) => A
}

export type Param_16bits<T extends string, A> = {
    type: '16 Bits'
} & ParamCore<T,A, UInt16>


export type Param_8bits<T extends string, A> = {
    type: '8 Bits'
    startBit: StartBit //takes 8 bits stating in 'startsBit' (included)
} & ParamCore<T,A,UInt8>


export type Param_1bit<T extends string,A> = { 
    type: '1 Bit'
    startBit: StartBit //takes 1 bits stating in 'startsBit' (included)
} & ParamCore<T,A,UInt1>

export type Param<T extends string, A> = 
    | Param_16bits<T,A>
    | Param_8bits<T,A>
    | Param_1bit<T,A>


// constructors

export const param_16bits = <T extends string,A>(etc: Omit<Param_16bits<T,A>,'type'>):Param_16bits<T,A> => {
    return {  type: '16 Bits', ...etc }
}

export const param_8bits = <T extends string,A>(etc: Omit<Param_8bits<T,A>,'type'>):Param_8bits<T,A> => {
    return {  type: '8 Bits', ...etc }
}

export const param_1bit = <T extends string,A>(etc: Omit<Param_1bit<T,A>,'type'>):Param_1bit<T,A> => {
    return {  type: '1 Bit', ...etc }
}