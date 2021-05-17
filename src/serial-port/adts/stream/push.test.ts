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
        jest.useFakeTimers();
        const intervals = Pull_.fromArray([1000,2000,3000])
        //act
        const stream = Push_.fromInterval(intervals)
        //check
        
        stream.unsafeRun( actual => {
            console.log(`********** Dentro= ${actual.value}**********`)

        })
        //jest.runOnlyPendingTimers();
        jest.runAllTimers();
        expect(setTimeout).toHaveBeenCalledTimes(3)
        
    })
    
})