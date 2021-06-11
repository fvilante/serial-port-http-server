import { Kinded_ } from "../validated/kind"
import { Among_, } from "./among"


describe('basic tests', () => {

    it('Can construct from kind using a kind interface, async', () => {
        //prepare
        let c = 12 as const
        const expected = `This is an string event with effect '${c}'` as const
        type MyEvents = {
            Event1: number
            Event2: number[]
            Event3: `This is an string event with effect '${typeof c}'`
        }
        const mkEvent = Kinded_.fromInterface<MyEvents>()
        const event1 = mkEvent('Event1',10)
        const event2 = mkEvent('Event2',[10,10])
        const event3 = mkEvent('Event3',"This is an string event with effect '12'")
        
        //act
        const action = Among_.fromKind<MyEvents>(event3)
        //check
        const ev = action.unsafeRun()
        if(ev[0]==='Event3') {
            const actual = ev[1]
            expect(actual).toEqual(expected)
        } else {
            expect(false).toBe(true)
        }

    })

    it('Can matchAll', async () => {
        //prepare
        let c = 12 as const
        const expected = `This is an string event with effect '${c}'` as const
        type MyEvents = {
            Event1: number
            Event2: number[]
            Event3: `This is an string event with effect '${typeof c}'`
        }
        const mkEvent = Kinded_.fromInterface<MyEvents>()
        const event1 = mkEvent('Event1',10)
        const event2 = mkEvent('Event2',[10,10])
        const event3 = mkEvent('Event3',"This is an string event with effect '12'")
        const probe = Among_.fromKind<MyEvents>(event3)
        //act
        const action = probe.matchAll({
            Event1: val => String(),
            Event2: val => String(),
            Event3: val => String(val),
        })
        //check
        expect(action).toEqual(expected)
        
    })

})

