import { int2word, word2int } from './int-to-word-conversion'

describe('Perform tests on cmpp datalink routines', () => {


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
    
})
