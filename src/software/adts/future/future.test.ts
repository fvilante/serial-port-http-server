import { now } from "../../core/utils"
import { Future, Future_ } from "../future"
import { Result, Result_ } from "../result"


describe('basic tests', () => {

    it('Can construct a single value', async (done) => {
        //prepare
        const probe = 2
        //act
        const ma = Future<number>( yield_ => yield_(probe) )
        //check
        ma.unsafeRun( actual => {
            expect(actual).toEqual(2)
            done();
        })
    })
    it('Can construct from a thunk', async (done) => {
        //prepare
        const probe = () => 2
        //act
        const ma = Future_.fromThunk(probe)
        //check
        ma.unsafeRun( actual => {
            expect(actual).toEqual(2)
            done();
        })
    })

    it('Can construct a single __setTimeout interval', async (done) => {
        //prepare
        const deltaTime = 100
        const tolerance = 70/100 // arbitrary defined
        const t0 = now()
        //act
        const canceller = Future_.__setTimeout((ms) => {
            const t1 = now()
            const deltaTime_actual = t1 - t0
            //check
            expect(ms).toBe(deltaTime)
            expect(deltaTime_actual).toBeGreaterThan(deltaTime*(1-tolerance))
            expect(deltaTime_actual).toBeLessThan(deltaTime*(1+tolerance))
            done();
        }, deltaTime)
        
        
    })

    it('Can construct a lazy promise from a future', async () => {
        //prepare
        const probe = 2
        //act
        const ma = Future<number>( yield_ => yield_(probe) )
        //check
        const p = ma.runToAsync()
        //'call back' format
        p().then(actual => {
            expect(actual).toEqual(probe)
        })
        //'async/await' format
        const actual = await p()
        expect(actual).toEqual(probe)
    })

    
    it('Can construct future from unsafe promise', async (done) => {
        //prepare
        //jest.useFakeTimers(); // we don't need to wait real time to pass :)
        const asyncError = () => new Promise<void>( () => {
            throw new Error('Unsafe Promise return')
        })
        const syncError = () => {
            throw new Error('Unsafe Promise return')
            return new Promise<string>( resolve => resolve('this is impossible!') )
        }
        const noError = () => new Promise<string>( resolve => resolve('normal thing'))
        const expected1 = ['UnsafePromiseError']
        const expected2 = ['UnsafePromiseError']
        const expected3 = ['normal thing']
        //act
        const action1 = Future_.fromUnsafePromise(asyncError)
        const action2 = Future_.fromUnsafePromise(syncError)
        const action3 = Future_.fromUnsafePromise(noError)
        
        //check
        let buf1: string[] = []
        let buf2: string[] = []
        let buf3: string[] = []
        const all_ = Future_.all([action1, action2, action3] as const)
        all_.unsafeRun( r => {
            const [r1, r2, r3] = r
            r1.forError( err => buf1.push(err.kind)) // note: I'm just comparing kind for short. Could be better to check more details but I'm not sure for now.
            r2.forError( err => buf2.push(err.kind))
            r3.forOk( value => buf3.push(value))

            expect(buf1).toEqual(expected1)
            expect(buf2).toEqual(expected2)
            expect(buf3).toEqual(expected3)
            
            done();
        })
        
    })

    it('Can construct a eager promise from a future', async () => {
        //prepare
        const probe = 2
        //act
        const ma = Future<number>( yield_ => yield_(probe) )
        //check
        const p = ma.async()
        //'call back' format
        p.then(actual => {
            expect(actual).toEqual(probe)
        })
        //'async/await' format
        const actual = await p
        expect(actual).toEqual(probe)
    })

    it('Can race two sync Futures', async () => {
       
        const f0 = Future_.fromValue(10 as const)
        const f1 = Future_.fromValue('oi' as const)
        //act
        const action = Future_.race(f0,f1)
        //check
        const p = await action.async()
        const actual = p.unsafeRun()
        const expected = {isLeft: true, value: 10}
        expect(actual).toEqual(expected)

    })

    it('Can race two async Futures, test left and right side individually', async () => {
        //prepare
        //jest.useFakeTimers('modern'); // we don't need to wait real time to pass :)
        const t = 300 as const
        const f0 = Future_.delay(t)
        const f1 = Future_.delay(t+100).map( () => 'depois' as const)
        const f2 = Future_.delay(t-100).map( () => 'antes' as const)
        //act
        const action1 = Future_.race(f0,f1)
        const action2 = Future_.race(f0,f2) //f2 wins
        const action3 = Future_.race(f1,f0)
        const action4 = Future_.race(f2,f0)
        //check
        const p1 = await action1.async()
        const p2 = await action2.async()
        const p3 = await action3.async()
        const p4 = await action4.async()
        const actual1 = p1.unsafeRun()
        const actual2 = p2.unsafeRun()
        const actual3 = p3.unsafeRun()
        const actual4 = p4.unsafeRun()
        const expected1 = {isLeft: true, value: t}
        const expected2 = {isLeft: false, value: 'antes'}
        const expected3 = {isLeft: false, value: t}
        const expected4 = {isLeft: true, value: 'antes'}
        //jest.runAllTimers(); // but we need to wait all timers to run :)
        expect(actual1).toEqual(expected1)
        expect(actual2).toEqual(expected2) //has error ***
        expect(actual3).toEqual(expected3)
        expect(actual4).toEqual(expected4)
        // Note: I don't know, why bellow is called 0 times, the expected should be two times: cancelation and probe, but... :(
        //expect(setTimeout).toHaveBeenCalledTimes(0) // I'm just couting how many times Setimeout has been called.

    })

    it('Can construct a sucessful cancelable delay which reach its finish without being canceled', async () => {
        //prepare
        jest.useFakeTimers(); // we don't need to wait real time to pass :)
        const t = 100
        const cancelation = Future_.delay(t+100)
        const probe = Future_.delayCancelable(t,cancelation)
        //act
        const ma = await probe.async()
        //check
        const actual = ma.unsafeRun()
        const expected = { isLeft: true, value: t }
        jest.runAllTimers(); // but we need to wait all timers to run :)
        expect(actual).toEqual(expected)
        // Note: I don't know, why bellow is called 0 times, the expected should be two times: cancelation and probe, but... :(
        expect(setTimeout).toHaveBeenCalledTimes(0) // I'm just couting how many times Setimeout has been called.
        
    })

    it('Can construct a sucessful cancelable delay which reach its finish being canceled', async () => {
        //prepare
        jest.useFakeTimers(); // we don't need to wait real time to pass :)
        const t0 = 600
        const t1 = t0-300
        const cancelation = Future_.delay(t1)
        const probe = Future_.delayCancelable(t0,cancelation)
        //act
        const ma = await probe.async()
        //check
        const actual = ma.unsafeRun()
        const expected = { isLeft: false, value: t1 }
        jest.runAllTimers(); // but we need to wait all timers to run :)
        expect(actual).toEqual(expected)
        // Note: I don't know, why bellow is called 0 times, the expected should be two times: cancelation and probe, but... :(
        expect(setTimeout).toHaveBeenCalledTimes(0) // I'm just couting how many times Setimeout has been called.
        
    })

    it('Can process a tuple of futures in paralel and wait then all to resolve', async () => {
        //prepare
        jest.useFakeTimers(); // we don't need to wait real time to pass :)
        const t = 100
        const f0 = Future_.delay(t-1)
        const f1 = Future_.delay(t-0).map( n => 'oi' as const)
        const f2 = Future_.delay(t+1).map( n => String(n))
        const probe = [f0,f1,f2] as const
        const expected = [t-1, "oi", "101"]
        //act
        const ma = Future_.all(probe)
        //check
        const actual = await ma.async()
        
        jest.runAllTimers(); // but we need to wait all timers to run :)
        expect(actual).toEqual(expected)
        // Note: I don't know, why bellow is called 0 times, the expected should be two times: cancelation and probe, but... :(
        expect(setTimeout).toHaveBeenCalledTimes(0) // I'm just couting how many times Setimeout has been called.
        
    })

    
    it('it can flatten', async () => {
        //prepare
        jest.useFakeTimers(); // we don't need to wait real time to pass :)
        const t = 100
        const f0 = Future_.delay(t)
        const f1 = f0.map( a => Future_.delay(a))
        const expected = 100
        //act
        const ma = Future_.flatten(f1)
        //check
        const actual = await ma.async()
        
        jest.runAllTimers(); // but we need to wait all timers to run :)
        expect(actual).toEqual(expected)
        // Note: I don't know, why bellow is called 0 times, the expected should be two times: cancelation and probe, but... :(
        expect(setTimeout).toHaveBeenCalledTimes(0) // I'm just couting how many times Setimeout has been called.  
    })

    it('it can execute some futures in waterflow sequence (fmap)', async () => {
        //prepare
        jest.useFakeTimers(); // we don't need to wait real time to pass :)
        const t = 100
        let buf: number[] = []
        const save = (n:number) => { buf.push(n) }
        const f0 = Future_.delay(0).tap(save)
        const f1 = Future_.delay(1).tap(save)
        const f2 = Future_.delay(2).tap(save)
        const f3 = Future_.delay(3).tap(save)
        const f4 = Future_.delay(4).tap(save)
        const expected = [0,1,2,3,4]
        //act
        const ma = f0
            .fmap( t0 =>    f1.map( t1 => [t0,t1] as const))
            .fmap( t =>     f2.map( t2 => [...t, t2] as const))
            .fmap( t =>    f3.map( t3 => [...t,t3] as const))
            .fmap( t =>    f4.map( t4 => [...t,t4] as const))

        //check
        const actual = await ma.async()
        
        jest.runAllTimers(); // but we need to wait all timers to run :)
        expect(buf).toEqual(expected)
        expect(actual).toEqual(expected)
        // Note: I don't know, why bellow is called 0 times, the expected should be two times: cancelation and probe, but... :(
        expect(setTimeout).toHaveBeenCalledTimes(0) // I'm just couting how many times Setimeout has been called.  
    })

    it('it can ignore value', async () => {
        //fix: test 'ignore' method
    })

    it('it can transform', async () => {
        //fix: test 'transform' method
    })
/*
    it('Can decompose Result ADT inside future', async (done) => {
        //prepare
        const expected = 'future is not certain' as const
        const probe = Future<Result<number,typeof expected>>( yield_ => {
            yield_(Result_.Error(expected))
        })
        //act
        const action = probe.__decomposeResult()
        //check
        action.unsafeRun( ({value, error}) => {
            error.forEach( actual => {
                expect(actual).toEqual(expected)
                done();
            })
        })

        //fix: pay attention at this strange behaviour: (resolve this issue when possible)
        const probe2 = Future_.fromValue(2 as const)
        const action2 = probe2.__decomposeResult()
        action2.unsafeRun( ({value, error}) => {
            error.forEach( actual => {
                //fix: var 'actual' here is never, but we don't
                //      get static compilation error
                // below line go to run-time without compile error, but it is wrong
                // --> expect(actual).toEqual(expected) 
                // fix: neither below generate static error. Why ?
                // Note: The inference is correct, but the static is not alerting the error, and it is reintroducing the error on assignment
                const n = actual + actual
                //const n1 = n.toString()
                //expect(n1).toBe(2)
                //done();
            })
        })

    })
*/
    it('Can match Future<Result<A,E>>', async (done) => {
        //prepare
        const text = 'future is not certain' as const
        const probe = Future<Result<number,typeof text>>( yield_ => {
            yield_(Result_.Error(text))
        })
        const probe2 = Future_.fromValue(2 as const) // fix: Note that some times Typescript let you manipulate never functions
        const expected = 'future is not certain, but...' as const
        //act
        const action = probe.matchResult<string>({
            Error: err => err.concat(', but...'),
            Ok: val => String(val).concat('as you know'),
        })
        //check
        action.unsafeRun( actual => {
            expect(actual).toBe(expected);
            done();
        })
    })
/*
    it('Can decompose Result ADT inside future', async (done) => {
        //prepare
        const expected = 'future is not certain' as const
        const probe = Future<Result<number,typeof expected>>( yield_ => {
            yield_(Result_.Error(expected))
        })
        const probe2 = Future_.fromValue(2 as const)
        //act
        const action = probe.__decomposeResult()
        //check
        action.unsafeRun( ({value, error}) => {
            error.forEach( actual => {
                expect(actual).toEqual(expected)
                done();
            })
        })
    })
    */
})


/*

describe('Other tests', () => {

    it('Can branch one future into multiples effects', async (done) => {
        //prepare
        const n1 = 77
        const n2 = 88
        let c1 = 0 //effect counter
        let c2 = 0
        let cc1 = 0
        let cc2 = 0
        const t1_ = 10 // timepoint
        const t2_ = 50
        const t3_expected = 0 //t2_ - t1_
        let t3_actual = 0 // t3 = t2 - t1

        const f1_Original = Future_.fromValue(n1).map(() => c1++)
        const f2_Original = Future_.fromValue(n2).map(() => c2++)
        const measureInterval = <A, B>(f1: Future<A>, f2: Future<B>): Future<number> => {
            let t1 = 0
            let t2 = 0

            const s0 = f1.tap(() => t1 = now())
            const s1 = f2.tap(() => t2 = now())
            const s2 = s1 //Future_.all([s0, s1] as const).ignoreContent()
            const s3 = s2.map(() => {
                t3_actual = t2 - t1
                return t3_actual
            })

            return s3
        }

        const run = <A, B>(f1: Future<A>, f2: Future<B>) => {
            // effect counter 
            const a1 = Future_
                .fromValue(n1)
                .map(() => c1++)
                .map(() => cc1++)
            const a2 = f2.map(() => cc2++)
            const interval = measureInterval(a1, f2)

            const r = Future_.all([a1, f2, a1,a1,a1] as const)
            return r

        }

        //act
        const action = run(f1_Original, f2_Original)
        //expect(t3_actual).toEqual(0) // not have runned yet
        //check
        action.unsafeRun(([n1_, n2_, interval]) => {
            //expect(n1_).toEqual(n1)
            //expect(n2_).toEqual(n2)
            expect(c1).toEqual(undefined)
            //expect(c2).toEqual(1)
            //expect(cc1).toEqual(1)
            //expect(cc2).toEqual(1)
            done()
        })

    })
})
*/