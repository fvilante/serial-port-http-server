import { Push } from '../../serial-port/adts/push-stream'

const file = 'CMPP00LG-ASMCAST'
const path = './' 

// csv interface

type CmppParam = {
    name: string // (ie: 'Posicao inicial', 'Start automatico no retorno, etc)
    description: string 
    accessMode: 'read-only' | 'write-only' | 'read-and-write' | 'protected'
    cast: 'NaturalNumber' | 'AbsolutePosition' | 'Displacement' | 'Velocity' | 'Acceleration' | 'Duration'
    startBit: number
    bitLength: number
}

type CSV_Parse = (fileName: string) => Push<CmppParam>



