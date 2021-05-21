import { ResultMatcher, Result_ } from "../result"

describe('basic tests', () => {

    it('Can construct a single ok value', async () => {
        //prepare
        const probe = 2
        const expected = {
            hasError: false,
            value: probe,
        }
        //act
        const ma = Result_.Ok(probe)
        //check
        const actual = ma.unsafeRun()
        expect(actual).toEqual(expected)
    })

    it('Can construct a single error value', async () => {
        //prepare
        const probe = 3
        const expected = {
            hasError: true,
            value: probe,
        }
        //act
        const ma = Result_.Error(probe)
        //check
        const actual = ma.unsafeRun()
        expect(actual).toEqual(expected)
    })

    it('Can match a value', async () => {
        // FIX: not implemented
    })

})
