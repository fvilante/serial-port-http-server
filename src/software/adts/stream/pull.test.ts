import { Future_ } from "../future"
import { Push, Push_ } from "../push-stream"
import { Pull, Pull_ } from "./pull"


describe('basic tests', () => {

    it('Can pull single value from an Array', async () => {
        //prepare
        const arr = [2]
        //act
        const action = Pull_.fromArray(arr)
        //check
        const itor = action.unsafeRun()
        const actual = itor.next()
        const expected = { done: false, value: 2}
        expect(actual).toStrictEqual(expected)
    })

    it('Can pull no value from an Array', async () => {
        //prepare
        const arr: any[] = []
        //act
        const action = Pull_.fromArray(arr)
        //check
        const itor = action.unsafeRun()
        const actual = itor.next()
        const expected = { done: true, value: undefined}
        expect(actual).toStrictEqual(expected)
    })

    it('Can pull multiple values from an Array', async () => {
        //prepare
        const p1 = 2
        const p2 = 7
        const p3 = 10
        const arr = [p1,p2,p3]
        //act
        const action = Pull_.fromArray(arr)
        //check
        const itor = action.unsafeRun()
        const actual1 = itor.next()
        const actual2 = itor.next()
        const actual3 = itor.next()
        const actual4 = itor.next()
        const actual5 = itor.next()
        const expected1 = { done: false,  value: p1}
        const expected2 = { done: false, value: p2}
        const expected3 = { done: false, value: p3}
        const expected4 = { done: true, value: undefined}
        const expected5 = { done: true, value: undefined}
        const actual = [actual1, actual2, actual3]
        const expected = [expected1, expected2, expected3]
        expect(actual).toStrictEqual(expected)
        expect(actual4).toStrictEqual(expected4)
        expect(actual5).toStrictEqual(expected5)
        
    })


    it('Can pull multiple values using an recurrent function', async (done) => {
        //prepare
        const p1 = 2
        const p2 = 7
        const p3 = 10
        const probe_ = [p1,p2,p3]
        //act
        const probe = Pull_.fromArray(probe_)
        //check
        const itor = probe.unsafeRun()

        const p = Push<number>( yield_ => {
            
            const loop = () => {
                const i = itor.next()
                if(i.done===false) {
                    Future_.delay(10).unsafeRun( () => {
                        yield_(i.value)
                        loop()
                    })
                }
            }

            loop()

        })

        const action = p.collect(probe_.length)
        action.unsafeRun( actual_ => {
            const [actual,size] = actual_
            console.log('output',actual)
            expect(actual).toStrictEqual(probe_)
            done()
        }) 
    })

    it('Can correctly deal with the exhaustion of pulling an array', async () => {
        //prepare
        let buf = []
        const p1 = 2
        const p2 = 7
        const p3 = 10
        const arr = [p1 /*,p2,p3*/]
        //act
        const action = Pull_.fromArray(arr)
        //check
        const itor = action.unsafeRun()
        const actual1 = itor.next()
        const actual2 = itor.next()
        const actual3 = itor.next()
        const expected1 = { done: false,  value: p1}
        const expected2 = { done: true, value: undefined}
        const expected3 = { done: true, value: undefined}
        const actual = [actual1, actual2, actual3]
        const expected = [expected1, expected2, expected3]
        expect(actual).toStrictEqual(expected)
    })

    it('Can map multiple values and exhaust correctly', async () => {
        //prepare
        let buf = []
        const p1 = 2
        const p2 = 7
        const p3 = 10
        const arr = [p1,p2,p3]
        const stream = Pull_.fromArray(arr)
        const f = (x: number) => x + 2
        //act
        const action = stream.map(f)
        //check
        const itor = action.unsafeRun()
        const actual1 = itor.next()
        const actual2 = itor.next()
        const actual3 = itor.next()
        const actual4 = itor.next()
        const actual5 = itor.next()
        const expected1 = { done: false,  value: f(p1)}
        const expected2 = { done: false, value: f(p2)}
        const expected3 = { done: false, value: f(p3)}
        const expected4 = { done: true, value: undefined}
        const expected5 = { done: true, value: undefined}
        const actual = [actual1, actual2, actual3, actual4, actual5]
        const expected = [expected1, expected2, expected3, expected4, expected5]
        expect(actual).toStrictEqual(expected)
    })

    it('Can perform a forEach in all values as fast as possible', async () => {
        //prepare
        let buf: number[] = []
        const probe = [1,2,3,4,5]
        const arr = Pull_.fromArray(probe)
        //act
        arr.forEach( value => buf.push(value) )
        //check
        expect(buf).toStrictEqual(probe)
    })

    it('Can pull with a push working as a "venture" tube', async () => {
        //prepare
        let buf: [a:number|void, b:number][] = []
        const as = [1,2,3]
        const bs = [10,20,30,40,50,60]
        const expected = [[1,10],[2,20],[3,30],[undefined,40],[undefined,50],[undefined,60]]
        const as_ = Pull_.fromArray(as)
        const bs_ = Push_.fromArray(bs)
        //act
        const action = as_.pushWith(bs_)
        //check
        action.unsafeRun( data => {
            const i = data[0]
            const value = i.value
            buf.push([data[0].value,data[1]])
        })
        expect(buf).toStrictEqual(expected)
    })

})