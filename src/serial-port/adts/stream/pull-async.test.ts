import { Push_ } from "../push-stream"
import { Pull_ } from "./pull"
import { PullAsync_ } from "./pull-async"



describe('basic tests', () => {

    it('Can pull sync a single vanila value', async () => {
        //prepare
        let buf: number[] = []
        const probe = [1,2,3,4]
        const a = PullAsync_.fromArray(probe)
        //act
        const action = await a.forEach( n => buf.push(n)).async()
        //check
        expect(buf).toEqual(probe)
    })

    it('Can read next as a "Future Maybe a"', async () => {
        //prepare
        let buf: number[] = []
        const probe = [5,6,7]
        const itor = PullAsync_.fromArray(probe)
        const it = itor.unsafeRunM() 
        //act
        const m0 = await it.next().async()
        const m1 = await it.next().async()
        const m2 = await it.next().async()
        const m3 = await it.next().async()
        const m4 = await it.next().async()
        //check
        const mas = [m0,m1,m2, m3, m4]
        const expected = [5,6,7,undefined,undefined]
        const actual = mas.map(ma => ma.match({
            Just: a => a,
            Nothing: () => undefined,
        }))
        expect(actual).toEqual(expected)
    })

    it('Can push data with a custom pusher', async () => {
        //prepare
        jest.useFakeTimers(); // we don't need to wait real time to pass :)
        const t = 50
        let buf: [pulled: (5 | 6 | 7 | undefined), pushed: number | undefined][] = []
        const probe = [5,6,7] as const
        const itor = PullAsync_.fromArray(probe)
        const delays = [t,t+1,t+2,t+3,t+4,t+5] as const
        const pusher = Push_.fromInterval(Pull_.fromArray(delays)).map( v => v.value)
        //act
        const action = itor.pushWith(pusher)
        //check
        action.unsafeRun( ([it,b]) => buf.push([it.value, b] ))
        const expected = [[5,t],[6,t+1], [7,t+2],[undefined,t+3],[undefined,t+4],[undefined,t+5]]
        jest.runAllTimers(); // but we need to wait all timers to run :)
        expect(setTimeout).toHaveBeenCalledTimes(6) // I'm just couting how many times Setimeout has been called.
        expect(buf).toEqual(expected)
    })
})