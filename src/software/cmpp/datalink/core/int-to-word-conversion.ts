import { Byte } from "../../../core/byte"

// TODO: Maybe Word16 and Uint16 should be extracted to another file
export type Word16 = { 
    readonly dataLow: Byte, 
    readonly dataHigh: Byte 
}

// TODO: Maybe Word16 and Uint16 should be extracted to another file
export type Uint16 = number


//

export function word16ToUint16(word: Word16): Uint16 {
    const { dataLow, dataHigh } = word
    // fix: check if dadoH and dadoL is beetween 0 and 0xff
    return dataHigh * 256 + dataLow 
}

//TODO: invert input to DataLow first then DataHigh, and use interface in function argument
export function uInt16ToWord16(uint16: Uint16): [dadoH: number, dadoL: number] {
    // fix: check if uint16 is beetween 0 and 0xffff
    const n = uint16
    const dadoH = Math.floor( n/256 )
    const dadoL = n % 256
    return [dadoH, dadoL]
}
