import { Result_, Result } from "../serial-port/adts/result"

// IMPORTANT:
// FIX: This file is the initial work to refactory cmpp-datalink-protocol.ts
// to make it more descriptive and typesafe, and less imperative.

// NOTE: Some data demands both caracteristics: 
//  1. data construction and validation (ie: Result<number,string> instead of only number)
//  2. data convertion between a circle of related types (ie: Milimeter, Inches, Meters, Space)

// ADT-like to deal with cmpp data in word and its convertions
export type Utils<A> = {
    tap: (f: (_:A) => void) => A
}

type Base = {
    toWord16: () => Word16
    toUInt16: () => UInt16 
}


//Byte = unsigned integer of 8 bits
type UInt8 = {
    kind: 'UInt8'
    unsafeRun: () => { kind: UInt8['kind'], value: number }
}
const UInt8 = (value: number): Result<number, string> => {
    return (value >= 0) && (value <= 0xFF)
        ? Result_.Ok(value)
        : Result_.Error(`You're trying to create an byte out of range. Valid range are from 0 to 255 included, but received '${value}'`)
}

// unsigned integer of 16 bits
type UInt16 = {
    kind: 'Uint16'
    unsafeRun: () => { kind: UInt16['kind'], value: number }
} & Base 


type _16Bits = {
    kind: '_16Bits'
    unsafeRun: () => unknown
    getBitN: (bit: number) => Result<boolean,string>
}

// dadoH and dadoL format
type Word16 = {
    kind: 'Word16'
    unsafeRun: () => { kind: Word16['kind'], value: { dadoH: number, dadoL: number } }
    dataHigh: () => UInt8
    dataLow: () => UInt8
} & Base

// represents cmpp 16 bits of data
type UncastedData = {
    toUInt16: () => UInt16
    toWord16: () => Word16
    to16Bits: () => _16Bits
}



// Channel

export const MAX_NUMBER_OF_CMPP_CHANNELS = 64 // note: last channel index is defined as MAX_NUMBER_OF_CHANNELS minus one
export type Channel = Result<number,string>
export const Channel = (channelNumber: number): Channel => {
    return (channelNumber >=0) && (channelNumber <= MAX_NUMBER_OF_CMPP_CHANNELS-1)
        ? Result_.Ok(channelNumber)
        : Result_.Error(`You're trying to create an Channel out of range. Valid range are from 0 to ${MAX_NUMBER_OF_CMPP_CHANNELS-1} (inclusive), but received '${channelNumber}' as channel number.`)
}


// MemoryBucket
const MAX_ACESSIBLE_CMPP_WORD_ADDRESS = 255
type MemoryBucket = {
    wAddr: Result<number,string>
    uncastedData:  UncastedData
}



const Test1 = () => {

    const a = UInt8(10)
    const b = UInt8(255)
    const c = UInt8(256)

    const d = [a,b,c].map( r => r.unsafeMatch<string>({
        Error: err => err,
        Ok: val => String(val),
    }))

    console.table(d)

}

Test1();