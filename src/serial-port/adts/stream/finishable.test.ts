import { Finishable, Finishable_ } from "./finishable"
import { InferIterated, Iterated } from "./pull"

describe('basic tests', () => {

    it('Can construct simple finishable with only one next value', async () => {
        //prepare
        const probe = 2 as const
        const expected: Iterated<number> = {
            done: false,
            value: probe,
        }
        const fi = Finishable_.next(probe)
        //act
        const action = fi.unsafeRun()
        //check
        expect(action).toEqual(expected)
    })

    it('Can construct from Iterated', async () => {
        //prepare
        const probe = 2 as const
        const expected_: Iterated<number> = {
            done: false,
            value: probe,
        } 
        type X = InferIterated<typeof expected_>
        const fi = Finishable_._fromIterated<number, void>( expected_)
        // ATTENTION: 'fromIterated' need to specify type param 'A' and 'R' to get a good construction, because Typescript inference is not good here. (Aparently is the same case for Either_.left or Either_.right constructors)
        const FI_TAKE_CARE = Finishable_._fromIterated( expected_)
        //act
        const action = fi.unsafeRun()
        //check
        expect(action).toEqual(expected_)
    })

    it('Can construct simple finishable with only one done result', async () => {
        //prepare
        const probe = 2 as const
        const expected: Iterated<void,number> = {
            done: true,
            value: probe,
        }
        const fi = Finishable_.done(probe)
        //act
        const action = fi.unsafeRun()
        //check
        expect(action).toEqual(expected)
    })

    it('Can match', async () => {
        //prepare
        let buf: unknown[][] = []
        const probe = 2 as const
        const expected = [['Done', probe]]
        const action = Finishable_.done(probe)
        //act
        action.match({
            Done: val => {buf.push(['Done',val]);},
            Next: val => {buf.push(['Next',val]);}
        })
        //check
        expect(buf).toEqual(expected)
    })
})