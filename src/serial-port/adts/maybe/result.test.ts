import { Result, ResultMatcher, Result_, UnsafeSyncCallError } from "../result"
import { Either } from "./either"

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

    it('Can construct from unsafeSyncCall', async () => {
        //prepare
        const probe = 3
        const expected1 = 'UnsafeSyncCallError' //comparing only 'kind' of error
        const expected2 = {
            hasError: false,
            value: probe
        }
        const f = () => {
            throw new Error('Juca')
            return probe
        }
        const g = () => {
            return probe
        }
        //act
        const action1 = Result_.fromUnsafeSyncCall(f)
        const action2 = Result_.fromUnsafeSyncCall(g)
        //check
        const actual1 = (action1.unsafeRun().value as UnsafeSyncCallError)['kind']
        const actual2 = action2.unsafeRun()
        expect(actual1).toEqual(expected1)
        expect(actual2).toEqual(expected2)
    })

    it('Can map the error', async () => {
        //prepare
        const probe = 3
        const expected = {
            hasError: true,
            value: [probe, probe],
        }
        const ma = Result_.Error(probe)
        const f = (a:number) => [a,a] as const
        //act
        const action = ma.mapError(f)
        //check
        const actual = action.unsafeRun()
        expect(actual).toEqual(expected)
    })

    it('Can map the ok value', async () => {
        //prepare
        const probe = 3
        const expected = {
            hasError: false,
            value: [probe, probe],
        }
        const ma = Result_.Ok(probe)
        const f = (a:number) => [a,a] as const
        //act
        const action = ma.map(f)
        //check
        const actual = action.unsafeRun()
        expect(actual).toEqual(expected)
    })

    it('Can transform', async () => {
        //prepare
        const probe = 2 as const
        const ma = Result_.Ok(probe)
        //act
        const action = ma.transform( r => `Oi ${r.unsafeRun().value}` as const)
        //check
        const expected = `Oi ${probe}`
        expect(action).toBe(expected)
    })

    it('Can tap', async () => {
         //prepare
         let buf: number[] = []
         const probe = 2 as const
         const ma = Result_.Ok(probe)
         const f = (n:number):void => { buf.push(n); }
         //act
         const action = ma.tap( f)
         //check
         const expected1 = { hasError: false, value: probe } as const
         const actual1 = action.unsafeRun()
         const expected2 = [probe]
         expect(actual1).toStrictEqual(expected1)
         expect(buf[0]).toStrictEqual(expected2[0])
    })

    it('Can tap error', async () => {
        //prepare
        let buf: number[] = []
        const probe = 2 as const
        const ma = Result_.Error(probe)
        const f = (n:number):void => { buf.push(n); }
        //act
        const action = ma.tapError(f)
        //check
        const expected1 = { hasError: true, value: probe } as const
        const actual1 = action.unsafeRun()
        const expected2 = [probe]
        expect(actual1).toStrictEqual(expected1)
        expect(buf[0]).toStrictEqual(expected2[0])
    })

    it('Can use combinator "and-then" ', async () => {
        const ErrMessage = (a:number, b: number) => `Cannot divide by 0, cannot divide '${a}' by '${b}'. This is impossible!` as const
        //prepare
        const div = (a:number, b:number):Result<number,string> => {
            if(b===0) return Result_.Error(ErrMessage(a,b))
            return Result_.Ok(a/b)
        }
        const eqOk = div(2,1) // ok
        const eqErr = div(1,0) // err
        //act
        const action1 = Result_.andThen(eqOk, eqOk) // result -> ok
        const action2 = Result_.andThen(eqOk, eqErr) // result -> err
        const action3 = Result_.andThen(eqErr, eqOk) // result -> err

        //check
        const expected1 = { hasError: false, value: [2,2] } as const
        const expected2 = { hasError: true, value: ErrMessage(1,0) } as const
        const expected3 = { hasError: true, value: ErrMessage(1,0) } as const
        const actual1 = action1.unsafeRun()
        const actual2 = action2.unsafeRun()
        const actual3 = action3.unsafeRun()
        expect(actual1).toStrictEqual(expected1)
        expect(actual2).toStrictEqual(expected2)
        expect(actual3).toStrictEqual(expected3)
    })

    it('Can use combinator "or-Else" ', async () => {
        const ErrMessage = (a:number, b: number) => `Cannot divide by 0, cannot divide '${a}' by '${b}'. This is impossible!` as const
        //prepare
        const div = (a:number, b:number):Result<number,string> => {
            if(b===0) return Result_.Error(ErrMessage(a,b))
            return Result_.Ok(a/b)
        }
        const eqOk = div(2,1) // ok
        const eqErr = div(1,0) // err
        //act
        const action1 = Result_.orElse(eqOk, eqOk) // result -> ok
        const action2 = Result_.orElse(eqOk, eqErr) // result -> ok
        const action3 = Result_.orElse(eqErr, eqOk) // result -> ok
        const action4 = Result_.orElse(eqErr, eqErr) // result -> err

        //check
        const expected1 = { isLeft: true, value: 2 } as const
        const expected2 = { isLeft: true, value: 2 } as const
        const expected3 = { isLeft: false, value: 2 } as const
        const expected4 = { hasError: true, value: [ ErrMessage(1,0),ErrMessage(1,0) ]  } as const
        const actual1 = (action1.unsafeRun().value as Either<number, number>).unsafeRun()
        const actual2 = (action2.unsafeRun().value as Either<number, number>).unsafeRun()
        const actual3 = (action3.unsafeRun().value as Either<number, number>).unsafeRun()
        const actual4 = action4.unsafeRun()
        expect(actual1).toStrictEqual(expected1)
        expect(actual2).toStrictEqual(expected2)
        expect(actual3).toStrictEqual(expected3)
        expect(actual4).toStrictEqual(expected4)
    })

})
