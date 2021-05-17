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

    it('Can pull multiple values from an Array', async () => {
        //prepare
        let buf = []
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
        const expected1 = { done: false,  value: p1}
        const expected2 = { done: false, value: p2}
        const expected3 = { done: false, value: p3}
        const actual = [actual1, actual2, actual3]
        const expected = [expected1, expected2, expected3]
        expect(actual).toEqual(expected)
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

})