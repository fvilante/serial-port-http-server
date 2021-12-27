

//TODO: invert input to DataLow first then DataHigh, and use interface in function argument
export function word16ToUint16(dadoH: number, dadoL: number): number {
    // fix: check if dadoH and dadoL is beetween 0 and 0xff
    return dadoH * 256 + dadoL 
}

//TODO: invert input to DataLow first then DataHigh, and use interface in function argument
export function uInt16ToWord16(uint16: number): [dadoH: number, dadoL: number] {
    // fix: check if uint16 is beetween 0 and 0xffff
    const n = uint16
    const dadoH = Math.floor( n/256 )
    const dadoL = n % 256
    return [dadoH, dadoL]
}
