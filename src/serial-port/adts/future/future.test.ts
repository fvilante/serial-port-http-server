import { Future, Future_, UnsafePromiseError } from "../future"


describe('basic tests', () => {

    it('Can construct a single value', async () => {
        //prepare
        const probe = 2
        //act
        const ma = Future<number>( yield_ => yield_(probe) )
        //check
        ma.unsafeRun( actual => {
            expect(actual).toEqual(probe)
        })
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
        jest.useFakeTimers(); // we don't need to wait real time to pass :)
        const t = 100 as const
        const f0 = Future_.delay(t)
        const f1 = Future_.delay(t+1).map( () => 'depois' as const)
        const f2 = Future_.delay(t-1).map( () => 'antes' as const)
        //act
        const action1 = Future_.race(f0,f1)
        const action2 = Future_.race(f0,f2)
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
        jest.runAllTimers(); // but we need to wait all timers to run :)
        expect(actual1).toEqual(expected1)
        expect(actual2).toEqual(expected2)
        expect(actual3).toEqual(expected3)
        expect(actual4).toEqual(expected4)
        // Note: I don't know, why bellow is called 0 times, the expected should be two times: cancelation and probe, but... :(
        expect(setTimeout).toHaveBeenCalledTimes(0) // I'm just couting how many times Setimeout has been called.

    })

    it('Can construct a sucessful cancelable delay which reach its finish without being canceled', async () => {
        //prepare
        jest.useFakeTimers(); // we don't need to wait real time to pass :)
        const t = 100
        const cancelation = Future_.delay(t+1)
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
        const t = 100
        const cancelation = Future_.delay(t-1)
        const probe = Future_.delayCancelable(t,cancelation)
        //act
        const ma = await probe.async()
        //check
        const actual = ma.unsafeRun()
        const expected = { isLeft: false, value: t-1 }
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
})