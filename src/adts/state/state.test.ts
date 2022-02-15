import { State } from './state'

describe('basic tests', () => {

    it('Can simply unsaferun ', async () => {
        //prepare
        const s = 10
        const a = 5
        const expected = s+a
        const sum = (s:number, a:number) => s+a
        const state = State( sum)
        //act
        const actual = state.unsafeRun(s,a)
        //check
        expect(actual).toEqual(expected)
    })

    it('Can', async () => {
        //prepare
        const s = 10
        const a = 5
        const expected = s+a
        const sum = (s:number, a:number) => s+a
        const state = State( sum)
        //act
        const actual = state.unsafeRun(s,a)
        //check
        expect(actual).toEqual(expected)
    })



})
