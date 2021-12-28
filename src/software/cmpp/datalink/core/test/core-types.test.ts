import { 
    ESC,
    STX,
    ETX,
    ACK,
    NACK,
    Direction,
    StartByte,
    StartByteToText,
} from '../core-types'

describe('basic tests', () => {

    it('Can assure ESC, STX, ETX, ACK, NACK exists and is correctly defined', async () => {
        //prepare
        const ESC__: ESC = 0x1B 
        const STX__: STX = 0x02 
        const ETX__: ETX = 0x03 
        const ACK__: ACK = 0x06
        const NACK__: NACK = 0x15 
        //act
        // see imports
        //check
        expect(ESC).toEqual(ESC__);
        expect(STX).toEqual(STX__);
        expect(ETX).toEqual(ETX__);
        expect(ACK).toEqual(ACK__);
        expect(NACK).toEqual(NACK__); 
    })

    it('Can assure Direction exists in texts and in numbers', async () => {
        //prepare
        const expected = {
            Solicitacao: 0,
            MascaraParaResetar: 0x40,
            MascaraParaSetar: 0x80,
            Envio: 0xC0,

        }
        //act

        //check
        expect(Direction).toEqual(expected);

    })

})

