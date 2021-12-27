import { flattenArrayDeep } from '../../core/utils'
import { calcChecksum } from './core/calc-checksum'
import { 
    ESC,
    STX,
    ETX,
    ACK,
    NACK,
    Direction,
    StartByte,
    StartByteToText,
    StartByteTxt,
    DirectionKeys,
} from './core-types'
import { compileCoreFrame, FrameCore, FrameInterpreted } from './frame-core'
import { int2word } from './int-to-word-conversion'
import { Payload, PayloadCore } from './core/payload'



describe('basic tests', () => {

    it('Can compile a frame with arbitrary data', async () => {
        //config
        const waddr = 0xA0
        const channel = 63
        const uint16 = 1 // arbitrary
        const startByte: StartByteTxt = 'STX'
        const direction: DirectionKeys = 'Envio'
        //prepare
        const [dataHigh, dataLow] = int2word(uint16)
        const directionNum = Direction[direction]
        const obj = [[directionNum+channel],[waddr],[dataLow],[dataHigh]] as const
        const payload = flattenArrayDeep(obj) as Payload
        const startByteNum = StartByte[startByte]
        const payloadCore: PayloadCore = { payload, startByte: startByteNum}
        const checksum = calcChecksum(payloadCore)
        
        const probe: FrameCore = {
            startByte,
            direction,
            channel,
            waddr,
            uint16,
        }
        const expected = [
            [ESC],[STX],...obj,[ESC],[ETX],[checksum]
        ] 
        
        //act
        const actual = compileCoreFrame(probe)
        //check
        expect(actual).toEqual(expected);
    })

})

