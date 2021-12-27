
// ======== COMMON DEFINITIONS =============

// Define protocol's control chars
export type ESC = 0x1B
export type STX = 0x02
export type ETX = 0x03
export type ACK = 0x06
export type NACK = 0x15

export const ESC: ESC = 0x1B 
export const STX: STX = 0x02 
export const ETX: ETX = 0x03 
export const ACK: ACK = 0x06
export const NACK: NACK = 0x15 


// Define protocol direction chars
export type DirectionNum = Direction[keyof Direction]
export type DirectionKeys = keyof Direction
export type Direction = typeof Direction
export const Direction = {
    Solicitacao: 0 as const,
    MascaraParaResetar: 0x40 as const,
    MascaraParaSetar: 0x80 as const,
    Envio: 0xC0 as const,
} 
export const DirectionNumToText = (_: DirectionNum):DirectionKeys => {
    switch (_) {
        case 0: return 'Solicitacao'
        case 0x40: return 'MascaraParaResetar'
        case 0x80: return 'MascaraParaSetar'
        case 0xC0: return 'Envio'
    }
}

// Define what is considered valid start byte
//TODO: Rename this operation to 'startByteText2Num' or similar, maybe we should import a function instead of a type
export type StartByte = typeof StartByte
export const StartByte = {
    STX: STX,
    ACK: ACK,
    NACK: NACK,
}   

export type StartByteTxt = keyof StartByte
export type StartByteNum = typeof StartByte[keyof StartByte]

export const StartByteToText = (_: StartByteNum):StartByteTxt => {
    //fix: should be less concrete
    //      what seems we want is an object-invertion-operation of 'StartByte' (maybe this is possible)
    const StartByte = {
        [STX]: 'STX',
        [ACK]: 'ACK',
        [NACK]: 'NACK',
    } as const
    return StartByte[_] 
}

//TODO: Apply this type instead of number in other places of this code which refers to cmpp_channel type.
export type Channel = number  // cmpp channel byte

