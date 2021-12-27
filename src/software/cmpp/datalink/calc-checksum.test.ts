import { calcChecksum, calcChecksum_ } from "./calc-checksum"
import { StartByteNum, STX } from "./core-types"

describe('basic tests', () => {

    it('Can calc checksum using deprecated function', async () => {
        //TODO: remove this test and the deprecated function
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

    it('Can calc checksum of simple data', async () => {
        //prepare
        const obj = [1,2,3,4]
        const startByte: StartByteNum = 2
        const expected = 241
        //act
        const actual = calcChecksum_(obj, startByte)
        //check
        expect(actual).toEqual(expected)
    })

    it('Can calc checksum which is equal to ESC', async () => {
        //prepare
        const obj = [1,2,3,4,(241-27)]
        const startByte: StartByteNum = 2
        const expected = 27
        //act
        const actual = calcChecksum_(obj, startByte)
        //check
        expect(actual).toEqual(expected)
    })

    it('Can calc checksum which is equal to ESC in all startBytes', async () => {
        //prepare
        const obj = [1,2,3,4,(241-27)]
        const master: StartByteNum = 2
        const slave: StartByteNum = 6
        const slaveError: StartByteNum = 21
        const master_ = obj
        const slave_ = [...obj, 256-(6-2)]
        const slaveError_ = [...obj, 256-(21-2)]
        const expected = 27
        //act
        const actual1 = calcChecksum_(master_, master)
        const actual2 = calcChecksum_(slave_, slave)
        const actual3 = calcChecksum_(slaveError_, slaveError)
        //check
        expect(actual1).toEqual(expected)
        expect(actual2).toEqual(expected)
        expect(actual3).toEqual(expected)
    })


})
