import { Kinded, Kinded_ } from "./kind"

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

    it('Can map a value', async () => {
        // prepare
        const value = 20
        const Channel = (value: number) => Kinded<"Channel", number>(() => ['Channel', value])
        // act
        const ch = Channel(value)
        const action = ch
            .map( (kind, value) =>  [kind, `oi ${value}` as const] )
        // test
        const actual = action.unsafeRun()
        const expected = ["Channel", "oi 20"]
        expect(actual).toEqual(expected)
    })

    it('Can flatten a value', async () => {
        // prepare
        const value = 20
        type Byte_ = ReturnType<typeof Byte_>
        const Byte_ = (value: number) => Kinded(() => ['Byte_', value])
        const Channel = (value: Byte_) => Kinded(() => ['Channel', value])
        const probe = Channel(Byte_(value))
        // act
        const action = Kinded_.flatten(probe)
        // test
        const actual = action.unsafeRun()
        const expected = ["Channel/Byte_", value]
        expect(actual).toEqual(expected)
    })
})