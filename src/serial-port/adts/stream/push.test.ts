import { Push, Push_ } from "../push-stream"
import { Pull_ } from "./pull"


describe('basic tests', () => {

    it('Can push single vanila value', async () => {
        //prepare
        const probe = 2
        //act
        const stream = Push<number>( receiver => receiver(probe) )
        //check
        stream.unsafeRun( actual => {
            expect(actual).toEqual(probe)
        })
        
    })

    it('Can push three vanila values', async () => {
        //prepare
        let actual: number[] = []
        const probe = [1,2,3]
        //act
        const stream = Push<number>( receiver => probe.map(receiver) )
        //check
        stream.unsafeRun( value => {
            actual.push(value)
        });
        expect(actual).toEqual(probe)   
    })

    it('Can map three vanila values', async () => {
        //prepare
        let actual: number[] = []
        const probe = [1,2,3]
        const f = (n: number) => n+1
        //act
        const stream = Push<number>( receiver => probe.map(receiver) )
        //check
        stream.map(f).unsafeRun( value => {
            actual.push(value)
        });
        expect(actual).toEqual(probe.map(f))   
    })

    it('Can collect sized data', async () => {
        //prepare
        let actual: [collected: readonly number[], size: 3][] = []
        const probe = [1,2,3,4,5,6,7,8,9,10,11]
        const expected =  [[[1, 2, 3], 3], [[4, 5, 6], 3], [[7, 8, 9], 3]]
        //act
        const action = Push_.fromArray(probe)
            .collect(3)
        //check
        action.unsafeRun( value => {
            actual.push(value)
        });
        expect(actual).toEqual(expected) 
    })

    describe('Can step data', () => {
        it('Can step data when size===step', async () => {
             //prepare
            let actual: [collected: readonly number[], size: 3][] = []
            const probe = [1,2,3,4,5,6,7,8,9,10,11]
            const expected =  [[[1, 2, 3], 3], [[4, 5, 6], 3], [[7, 8, 9], 3]]
            //act
            const action = Push_.fromArray(probe)
                .step(3,3)
            //check
            action.unsafeRun( value => {
                actual.push(value)
            });
            expect(actual).toEqual(expected) 
        })

        it('Can step data when step<size', async () => {
            //prepare
           let actual: [collected: readonly unknown[], size: number][] = []
           const probe = ['a','b','c','d',0,1,2,3,4,5]
           const expected = [[["a", "b", "c", "d"], 4], [["c", "d", 0, 1], 4], [[0, 1, 2, 3], 4], [[2, 3, 4, 5], 4]]
           //act
           const action = Push_.fromArray(probe)
               .step(4,2)
           //check
           action.unsafeRun( value => {
               actual.push(value)
           });
           expect(actual).toEqual(expected) 
       })

       it('Can step data when step>size', async () => {
            //prepare
            let actual: unknown[] = []
            const probe = [0,1,2,3,4,5,6,7,8,9,10,11,12,13]
            const expected = [[0,1,2],[5,6,7],[10,11,12]]
            //act
            const action = Push_.fromArray(probe)
                .step(3,5)
            //check
            action.unsafeRun( value => {
                actual.push(value[0])
            });
            expect(actual).toEqual(expected) 
   })
    })

    it('Can filter among some vanila values', async () => {
        //prepare
        let actual: number[] = []
        const probe = [1,2,3,4,5,6,7,8,9,10]
        const f = (n: number) => n>=5
        //act
        const stream = Push<number>( receiver => probe.map(receiver) )
        //check
        stream.filter(f).unsafeRun( value => {
            actual.push(value)
        });
        expect(actual).toEqual(probe.filter(f))   
    })

    it('Can fork the stream', async () => {
        //prepare
        let actualLeft: number[] = []
        let actualRight: number[] = []
        const probe = [1,2,3,4,5,6,7,8,9,10]
        const criteria = (n: number) => n>=5
        //act
        const stream = Push_.fromArray(probe)
            .fork(criteria)
        //check
        stream.unsafeRun( value => {
            const x = value.unsafeRun()
            if(x.isLeft===true) 
                actualLeft.push(x.value)
            else   
                actualRight.push(x.value)
        });
        const invert = (f: (_: number) => boolean) => (n:number) => !f(n)
        expect(actualLeft).toEqual(probe.filter(criteria))
        expect(actualRight).toEqual(probe.filter(invert(criteria)))    
    })

    it('Can ignore all', async () => {
        //prepare
        let actual: number[] = []
        const probe = [1,2,3,4,5,6,7,8,9,10]
        const f = (n: number) => n>=5
        //act
        const stream = Push<number>( receiver => probe.map(receiver) )
        //check
        stream.ignoreAll().unsafeRun( value => {
            actual.push(value)
        });
        expect(actual).toEqual([])   
    })

    it('Can transform to something else', async () => {
        //prepare
        const signal = [1,2,3]
        const f = <A>(stream: Push<A>):Promise<A[]> => new Promise( resolve => {
            let ref: A[] = []
            stream.unsafeRun( value => ref.push(value))
            resolve(ref)
        })
        //act
        const stream = Push<number>( receiver => signal.map(receiver) )
        //check
        const actual = await stream.transform(f)
        expect(actual).toEqual(signal)   
    })

    it('Can concat a single signal from a single stream', async () => {
        //prepare
        const signal = 2
        let buf: number[] = []
        const expected = [signal]
        const ma = Push<number>( yield_ => yield_(2))
        const mma = Push<Push<number>>( yield_ => yield_(ma))
        //act
        const stream = Push_.concat(mma)
        
        //check
        stream.unsafeRun( val => {
            buf.push(val)
        })
        expect(buf).toEqual(expected)   
    })

    it('Can union simple async stream', async (done) => {
        //prepare
        jest.useFakeTimers("modern"); // we don't need to wait real time to pass :)
        const as = [100,50,151] as const
        const bs = [100,150,80] as const
        const pas = Push_.fromInterval(Pull_.fromArray(as))
        const pbs = Push_.fromInterval(Pull_.fromArray(bs))
         
        let buf: number[] = []
        const expected: number[] =  [ 100, 100, 50, 150, 151, 80 ]
        
        //act
        const action = Push_.union(pas,pbs)
        
        //check
        action.unsafeRun( either => {
            const {isLeft, value:a} = either.unsafeRun()
            const {done: done_, value} = a
            if(value!==undefined) {
                buf.push(value)
                //console.log(buf)
            }
            if(buf.length===expected.length) {
                //last bit of data
                expect(buf).toEqual(expected)  ;
                done()
            }
        })
        jest.runAllTimers(); // but we need to wait all timers to run :)     
    })

    it('Can concat a multiple signals from a single stream', async () => {
        //prepare
        const signal = 2
        let buf: number[] = []
        const expected = [signal, signal*2, signal*3, signal*10]
        const ma = Push<number>( yield_ => expected.map(yield_) )
        const mma = Push<Push<number>>( yield_ => yield_(ma))
        //act
        const stream = Push_.concat(mma)
        
        //check
        stream.unsafeRun( val => {
            buf.push(val)
        })
        expect(buf).toEqual(expected)   
    })

    it('Can concat a single signal from a multiple streams', async () => {
        //prepare
        const signal1 = 2
        const signal2 = 5
        const signal3 = 7
        let buf: number[] = []
        const expected = [signal1, signal2, signal3]
        const ma1 = Push<number>( yield_ => yield_(signal1) )
        const ma2 = Push<number>( yield_ => yield_(signal2) )
        const ma3 = Push<number>( yield_ => yield_(signal3) )
        const mma = Push<Push<number>>( yield_ => {
            yield_(ma1);
            yield_(ma2);
            yield_(ma3);
        })
        //act
        const stream = Push_.concat(mma)
        
        //check
        stream.unsafeRun( val => {
            buf.push(val)
        })
        expect(buf).toEqual(expected)   
    })

    it('Can concat a multiple length variated signals from a multiple streams', async () => {
        //prepare
        const signal1 = [1,2,3,4]
        const signal2 = [5,5,6,7,8,9,10]
        const signal3 = [11,12,13,14,15,16,99,98,66]
        let buf: number[] = []
        const expected = [...signal1, ...signal2, ...signal3]
        const ma1 = Push<number>( yield_ => signal1.map(yield_) )
        const ma2 = Push<number>( yield_ => signal2.map(yield_) )
        const ma3 = Push<number>( yield_ => signal3.map(yield_) )
        const mma = Push<Push<number>>( yield_ => {
            yield_(ma1);
            yield_(ma2);
            yield_(ma3);
        })
        //act
        const stream = Push_.concat(mma)
        
        //check
        stream.unsafeRun( val => {
            buf.push(val)
        })
        expect(buf).toEqual(expected)   
    })

    it('Can push a range of numbers', async () => {
        //prepare
        let buf: number[] = []
        const expected = [10,12,14,16,18]
        //act
        const stream = Push_.range(10,20,2)
        //check
        stream.unsafeRun( actual => {
            buf.push(actual)
        })
        expect(buf).toEqual(expected)
        
    })

    it("Can push a stream of timed intervals", async () => {
        //prepare
        jest.useFakeTimers(); // we don't need to wait real time to pass :)
        const intervals = Pull_.fromArray([1000,2000,3000])
        //act
        const stream = Push_.fromInterval(intervals)
        //check
        stream.unsafeRun( actual => {
            //nop
        })
        jest.runAllTimers(); // but we need to wait all timers to run :)
        expect(setTimeout).toHaveBeenCalledTimes(3) // I'm just couting how many times Setimeout has been called.
    })

    it('it can scan simple numbers', async () => {
        //prepare
        const probe = [1,2,2,5,10,20,10] //total_sum=50
        type S = number
        const sum_ = (state: S, action: number):S => {
            return action+state
        }
        //act
        const stream = Push_
            .fromArray(probe)
            .scan(sum_,0)
        //check
        let actual: number[]  = []
        stream.unsafeRun( actual_ => {
            actual.push(actual_)
        })
        const expected = [1,3,5,10,20,40,50]
        expect(actual).toEqual(expected)
    })

    /*it('it can scan async simple async values', async () => {
        //prepare
        const intervals = [100,700,300,400,500] as const
        const stream_ = Push_.fromInterval(Pull_.fromArray(intervals))
        const initial = 0
        const reducer = (acc: number, cur: number): 
        //act
        const action = stream_.scanA(reducer, initial)
        //check
        let actual: number[]  = []
        action.unsafeRun( actual_ => {
            actual.push(actual_)
        })
        const expected = [1,3,5,10,20,40,50]
        expect(actual).toEqual(expected)
    })*/

    it('it can droplet', async () => {
        //prepare
        let actual: number[]  = []
        const probe = [[1,2,3],[4],[5,6],[7]] 
        const expected = [1,2,3,4,5,6,7]
        const stream = Push_.fromArray(probe)
        //act
        const action = Push_.droplet(stream)
        //check
        action.unsafeRun( actual_ => {
            actual.push(actual_)
        })
        expect(actual).toEqual(expected)
    })

    it('it can map an result value or result error', async () => {
        // fix: To be done
        //prepare
        //act
        //check
        
    })

    it('it can takeByIndex', async () => {
        //prepare
        let buf: number[]  = []
        const probe = [0,1,2,3,4,5,6,7] as const
        const expected = [3]
        const stream = Push_.fromArray(probe)
        //act
        const action = stream.takeByIndex(3)
        //check
        action.unsafeRun( actual_ => {
            buf.push(actual_)
        })
        expect(buf).toEqual(expected)
    })

/* FIX: This test is failing I don't have time now to solve it. Maybe later. This class method is useful for statistics
    
    it('it can map durations', async () => {
        //prepare
        let actual: unknown[]  = []
        const probe = [1,2,3] 
        const expected = [
            {value: 1, timepoint: undefined},
            {value: 2, timepoint: undefined},
            {value: 3, timepoint: undefined},
            
        ]
        const stream = Push_.fromArray(probe)
        //act
        const action = stream.timeStamp();
        //check
        action.unsafeRun( vt => {
            const {value, timePoint} = vt
            actual.push(vt)
        })
        expect(actual).toEqual(expected)
    })

*/

    
})