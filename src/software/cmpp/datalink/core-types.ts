
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
export type DirectionKeys = keyof Direction
export type Direction = typeof Direction
export const Direction = {
    Solicitacao: 0 as const,
    MascaraParaResetar: 0x40 as const,
    MascaraParaSetar: 0x80 as const,
    Envio: 0xC0 as const,
} 

// Define what is considered valid start byte
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

export type Payload = readonly [dirChan: number, waddr: number, dataLow: number, dataHigh: number]
