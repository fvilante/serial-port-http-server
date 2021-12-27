import { flattenArrayDeep } from '../../core/utils'
import { calcChecksum_ } from './core/calc-checksum'
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
        const obj_ = flattenArrayDeep(obj) as number[]
        const startByteNum = StartByte[startByte]
        const checksum = calcChecksum_(obj_, startByteNum)
        
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

