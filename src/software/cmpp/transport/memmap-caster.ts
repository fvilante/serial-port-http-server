
//Represents the position of a bit inside the a 16 bits word

import { Byte } from "../../core/byte"

//TODO: Extract this type to a more convenient file (ie: core-types.ts ?!)
export type StartBit = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 

// CmppTypes targets
export type UInt16 = number // unsigned integer of 16 bits //TODO: Improve the safety of this cast (ie: Validated<A> ?!)
export type UInt8 = number // unsigned integer of 8 bits //TODO: Improve the safety of this cast (ie: Validated<A> ?!)
export type UInt1 = 0 | 1 // unsigned integer of 1 bits //TODO: Improve the safety of this cast (ie: Validated<A> ?!)


export type ParamCasterCore<T extends string, A, B> = {
    readonly name: T
    readonly waddr: Byte   // word address 
} & CmppType<A,B>

// NOTE: A=Source (user level) / B=Target (cmpp transport layer level)
export type CmppType<A,B> = {
    readonly serialize: (_:A) => B
    readonly deserialize: (_:B) => A
}

export type ParamCaster_16bits<T extends string, A> = {
    type: '16 Bits'
} & ParamCasterCore<T,A, UInt16>


export type ParamCaster_8bits<T extends string, A> = {
    readonly type: '8 Bits'
    readonly startBit: StartBit //takes 8 bits stating in 'startsBit' (included)
} & ParamCasterCore<T,A,UInt8>


export type ParamCaster_1bit<T extends string,A> = { 
    readonly type: '1 Bit'
    readonly startBit: StartBit //takes 1 bits stating in 'startsBit' (included)
} & ParamCasterCore<T,A,UInt1>

export type ParamCaster<T extends string, A> = 
    | ParamCaster_16bits<T,A>
    | ParamCaster_8bits<T,A>
    | ParamCaster_1bit<T,A>


// constructors

export const paramCaster_16bits = <T extends string,A>(etc: Omit<ParamCaster_16bits<T,A>,'type'>):ParamCaster_16bits<T,A> => {
    return {  type: '16 Bits', ...etc }
}

export const paramCaster_8bits = <T extends string,A>(etc: Omit<ParamCaster_8bits<T,A>,'type'>):ParamCaster_8bits<T,A> => {
    return {  type: '8 Bits', ...etc }
}

export const paramCaster_1bit = <T extends string,A>(etc: Omit<ParamCaster_1bit<T,A>,'type'>):ParamCaster_1bit<T,A> => {
    return {  type: '1 Bit', ...etc }
}