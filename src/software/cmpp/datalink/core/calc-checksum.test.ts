import { calcChecksumGeneric } from "./calc-checksum"
import { StartByteNum, STX } from "../core-types"
import { makeRange } from "../../../core/utils"


describe('basic tests', () => {

    it('Can calc checksum of simple data', async () => {
        //prepare
        const payload = [1,2,3,4]
        const startByte: StartByteNum = 2
        const expected = 241
        //act
        const actual = calcChecksumGeneric(payload, startByte)
        //check
        expect(actual).toEqual(expected)
    })

    it('Can calc checksum which is equal to ESC', async () => {
        //prepare
        const obj = [1,2,3,4,(241-27)]
        const startByte: StartByteNum = 2
        const expected = 27
        //act
        const actual = calcChecksumGeneric(obj, startByte)
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
        const actual1 = calcChecksumGeneric(master_, master)
        const actual2 = calcChecksumGeneric(slave_, slave)
        const actual3 = calcChecksumGeneric(slaveError_, slaveError)
        //check
        expect(actual1).toEqual(expected)
        expect(actual2).toEqual(expected)
        expect(actual3).toEqual(expected)
    })

    it('Can calc checksum of a very long arbitrary data', async () => {
        //prepare
        const obj = [...makeRange(0,1000,1)]
        const startByte: StartByteNum = 2
        const expected = 207
        //act
        const actual = calcChecksumGeneric(obj, startByte)
        //check
        expect(actual).toEqual(expected)
    })


})
