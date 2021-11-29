
//TODO: rename to word2Uint16
export function word2int(dadoH: number, dadoL: number): number {
    // fix: check if dadoH and dadoL is beetween 0 and 0xff
    return dadoH * 256 + dadoL 
}

//TODO: rename to Uint16ToWord
export function int2word(uint16: number): [dadoH: number, dadoL: number] {
    // fix: check if uint16 is beetween 0 and 0xffff
    const n = uint16
    const dadoH = Math.floor( n/256 )
    const dadoL = n % 256
    return [dadoH, dadoL]
}
