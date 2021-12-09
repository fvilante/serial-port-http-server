
//TODO: to be done, experiment copy maybe test. Validated ADT was done basically over the 

import { Invalid, Valid, ValidatedWorld } from "./validated"

//      current code of Maybe ADT
describe('Basic Tests', () => {

    it('can construct a valid value', async () => {
        //prepare
        const probe = 10
        const valid = Valid(probe)
        const expected: ValidatedWorld<number> = {
            isValid: true,
            value: probe
        }
        //act
        const actual = valid.unsafeRun()
        //check
        expect(actual).toEqual(expected)
    })

    it('can construct a invalid value', async () => {
        //prepare
        const probe = [`this number is not valid` as const] as  const
        const valid = Invalid<number>(probe) //NOTE: like Either_.left you have to annotate the 'ok' value manually, in this case '<number>'
        const expected: ValidatedWorld<number> = {
            isValid: false,
            invalidationMessages: probe
        }
        //act
        const actual = valid.unsafeRun()
        //check
        expect(actual).toEqual(expected)
    })

    it('can give a valid value or throw', async () => {
        //prepare
        const probe = [`this number is not valid`]
        const valid = Invalid<number>(probe) //NOTE: like Either_.left you have to annotate the 'ok' value manually, in this case '<number>'
        //act
        try {
            valid.valueOrThrow() // MUST throw
            expect(false).toEqual(true)
        } catch (err) {
            //check
            expect(err).toEqual(new Error(String(probe)))
        }
    })

})