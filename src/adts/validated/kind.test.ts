import { InferKinds, Kinded, Kinded_ } from "./kind"

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

    it('Can construct from interface', async () => {
        // prepare
        type Displacement = {
            milimeter: number,
            meters: number,
            inches: number,
            steps: {size: number, stepsPerMotorRevolution: number}
        }
        const expected = ["milimeter", 10] as const
        // act
        type AmongKindsIncludes = InferKinds<Displacement>
        const Displacement = Kinded_.fromInterface<Displacement>()
        const action = Displacement(...expected)
        // test
        const actual = action.unsafeRun()
        expect(actual).toEqual(expected)
    })

    it('Can extend an interface', async () => {
        // prepare
        type International = {
            milimeter: number,
            meters: number,
            steps: {size: number, stepsPerMotorRevolution: number}
        }

        type England = {
            inches: number,
        }
        type Displacement = International & England

        const expected1 = ["milimeter", 10] as const
        const expected2 = ["inches", 20] as const
        // act
        type AmongKindsIncludes = InferKinds<Displacement>
        const Displacement = Kinded_.fromInterface<Displacement>()
        const action1 = Displacement('milimeter',10)
        const action2 = Displacement('inches',20)
        // test
        const actual1 = action1.unsafeRun()
        expect(actual1).toEqual(expected1)
        const actual2 = action2.unsafeRun()
        expect(actual2).toEqual(expected2)
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