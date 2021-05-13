import { Kinded } from "./kind"

describe('Basic test', () => {
    
    it('Can construct a kinded value', async () => {
        // prepare
        const value = 20
        const Channel = (value: number) => Kinded(() => ['Channel', value])
        // act
        const action = Channel(value)
        // test
        const actual = action.unsafeRun()
        const expected = ["Channel", value]
        expect(actual).toEqual(expected)
    })
})