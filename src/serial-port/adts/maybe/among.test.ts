import { Kinded_ } from "../validated/kind"
import { Among, Among_, } from "./among"

const absurd = () => expect(true).toBe(false)

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
            absurd()
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

    it('Can deal with an Kinded Interface that contains an Among as one of its payloads', () => {
        //prepare
        let c = 12 as const
        const expected = `This is an string event with effect '${c}'` as const
        type MyEvents = {
            Event1: number
            Event2: number[]
            Event3: `This is an string event with effect '${typeof c}'`
        }
        type MyOtherEvents = {
            Other1: string
            Other2: string[]
            Other3: Among<MyEvents>
        }
        const mkEvent1 = Kinded_.fromInterface<MyEvents>()
        const mkEvent2 = Kinded_.fromInterface<MyOtherEvents>()
        const event1 = mkEvent1('Event1',10)
        const event2 = mkEvent1('Event2',[10,10])
        const event3 = mkEvent1('Event3',"This is an string event with effect '12'")
        const amongMyEvents = Among_.fromKind<MyEvents>(event3)
        //act
        const action = mkEvent2('Other3', amongMyEvents)
        //check
        const ev = action.unsafeRun()
        if(ev[0]==='Other3') {
            const r = ev[1]
            const actual = r.unsafeRun()
            expect(actual).toEqual(['Event3',expected])
        } else {
            absurd()
        }

    })

})

