import { 
    ESC,
    STX,
    ETX,
    ACK,
    NACK,
    Direction,
    StartByte,
    StartByteToText,
    word2int,
    int2word,
    calcChecksum,
    FrameCore,
    compileCoreFrame,
    FrameSerialized,
    InterpretIncomming,
    FrameInterpreted,
} from "./cmpp-datalink-protocol"


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

    it('Can assure what is considered start byte is start byte', async () => {
        //prepare
        const expected = {
            STX: STX,
            ACK: ACK,
            NACK: NACK,
        }
        const expected2 = Object.keys(expected)
        //act
        const ToText = [STX,ACK,NACK].map( n => StartByteToText(n as any))
        //check
        expect(StartByte).toEqual(expected);
        expect(ToText).toEqual(expected2);

    })

    it('Can convert word16 to int16', async () => {
        //prepare
        const probe: readonly [dadoH: number, dadoL: number][] = [
            [0,0],
            [0,1],
            [0,21],
            [0,255],
            [1,0],
            [1,1],
            [0xFF,0xFF]
        ]
        const expected = [
            0,
            1,
            21,
            255,
            256,
            257,
            0xFFFF,
        ]
        //act
        const actual = probe.map(w => word2int(...w))
        //check
        expect(actual).toEqual(expected);


    })

    it('Can convert int16 to word16', async () => {
        //prepare
        const probe = [
            0,
            1,
            21,
            255,
            256,
            257,
            0xFFFF,
            
        ]
        const expected: readonly [dadoH: number, dadoL: number][]  = [
            [0,0],
            [0,1],
            [0,21],
            [0,255],
            [1,0],
            [1,1],
            [0xFF,0xFF]
        ]
        //act
        const actual = probe.map(w => int2word(w))
        //check
        expect(actual).toEqual(expected);
    })

    it('Can calc checksum', async () => {
        //prepare
        type Content = readonly [dirChan: number, waddr: number, dataH: number, dataL: number]
        const startByte = STX
        const probe: Content = [1,0xA0,0,10]
        const expected = 80
        //act
        const actual = calcChecksum(probe, 'STX')
        //check
        expect(actual).toEqual(expected);
    })

    it('Can compile a frame', async () => {
        //prepare
        const probe: FrameCore = {
            startByte: 'STX',
            direction: 'Envio',
            channel: 63,
            waddr: 0xA0,
            uint16: 1,
        }
        const expected = [
            [ESC],[STX],[0xC0+63],[0xA0],[1],[0],[27],[ETX],[91]
        ] 
        
        //act
        const actual = compileCoreFrame(probe)
        //check
        expect(actual).toEqual(expected);
    })

    it('Can interpret an stream of numbers', async () => {
        //prepare
        let buf: FrameInterpreted | unknown = undefined
        const config = [ESC, [STX,ACK,NACK], ETX] as const
        const probe = [
            [ESC],[STX],[0xC0+63],[0xA0],[1],[0],[27],[ETX],[91]
        ] 
        const expected: FrameInterpreted = {
            firstEsc: [ESC],
            startByte: [STX],
            dirChan: [0xC0+63],
            waddr: [0xA0],
            dataLow: [1],
            dataHigh: [0],
            lastEsc: [27],
            etx: [ETX],
            checkSum: [91],
            expectedChecksum: 91, 
        }
        
        const interpreter = InterpretIncomming(...config)(
            //onFinished
            (frame, rawInput) => {
                buf = frame
            },
            //onError
            (msg, partialFrame, rawInput) => {

            },
            //onInternalStateChange?
            (currentState, partialFrame, waitingEscDup, rawInput) => {

            }

        )
        //act
        const resets = probe.map(ns => ns.map(interpreter))

        //check
        expect(buf).toEqual(expected);
    })


})
