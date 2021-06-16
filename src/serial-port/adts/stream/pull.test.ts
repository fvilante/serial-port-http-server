import { Push_ } from "../push-stream"
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
        expect(actual).toEqual(expected)
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
        expect(actual).toEqual(expected)
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
        expect(actual).toEqual(expected)
        expect(actual4).toEqual(expected4)
        expect(actual5).toEqual(expected5)
        
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
        expect(actual).toEqual(expected)
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
        expect(actual).toEqual(expected)
    })

    it('Can perform a forEach in all values as fast as possible', async () => {
        //prepare
        let buf: number[] = []
        const probe = [1,2,3,4,5]
        const arr = Pull_.fromArray(probe)
        //act
        arr.forEach( value => buf.push(value) )
        //check
        expect(buf).toEqual(probe)
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
        expect(buf).toEqual(expected)
    })

})