import { Maybe, MaybeWorld, Maybe_, NothingObject } from '../maybe'

describe('Basic Tests', () => {

    type Probe = number

    it('Can create a just value', async () => {
        const probe:Probe = 2
        const expected: MaybeWorld<Probe> = {hasValue: true, value: probe }
        const actual = Maybe_.fromJust(probe).unsafeRun()
        expect(actual).toEqual(expected)
    })


    it('Can create a nothing value', async () => {
        const probe:Probe = 2
        const expected: MaybeWorld<Probe> = {hasValue: false, value: NothingObject }
        const actual = Maybe_.fromNothing<Probe>().unsafeRun()
        expect(actual).toEqual(expected)

    })

    it('Can map', async () => {
        const probe:Probe = 2
        const f = (x:Probe):Probe => 2*x
        const expected: Probe = f(probe)
        const actual = Maybe_.fromJust(probe).map(f).unsafeRun().value
        expect(actual).toEqual(expected)
    })

    it('Can run unsafe and finish with a side effect and finish', async () => {
        let actual1 = undefined
        const probe:Probe = 2
        const f = (x:Probe):Probe => 2*x
        const expected: Probe = f(probe)
        Maybe_.fromJust(probe).forEach( value => { actual1 = f(value)});
        expect(actual1).toEqual(expected)
    })

    it('Can transform', async () => {
        type X = [Probe, 'foo']
        const probe:Probe = 2
        const f = (value:Maybe<Probe>):X => [value.unsafeRun().value as Probe, 'foo']
        const expected: X = [probe, 'foo']
        const actual = Maybe_.fromJust(probe).transform(f)
        // note: I can transform to both Lazy or Eager (the type of 'X' is which decides)
        //       in this test I choose to be eager.
        expect(actual).toEqual(expected)
    })

    it('Can program a side effect lazy', async () => {
        type SideEffect = 'happens' | 'not_happens'
        let sideEffect : SideEffect= 'not_happens'
        const expected = sideEffect
        const probe:Probe = 2
        const f = (x:Probe):void => { sideEffect = 'happens'; console.log('sideeffect = ', sideEffect) }
        const actual = sideEffect
        const ma = Maybe_.fromJust(probe).tap(f)
        expect(sideEffect).toEqual( 'not_happens')
        ma.unsafeRun().value as Probe;
        expect(sideEffect).toEqual( 'happens')
    })

    // static part

    it('Can flatten', async () => {
        // prepare
        const probe:Probe = 2
        const f = (x:Probe):Probe => 2*x
        const ma = Maybe_.fromJust(probe)
        const mma = Maybe_.fromJust(ma)
        // act
        const action = Maybe_.flatten(mma)
        //test
        const actual = action.unsafeRun().value
        expect(actual).toEqual(probe)
    })

    it('Can fmap', async () => {
        // prepare
        const probe: Probe = 2
        const diff: Probe = 10
        const expected = probe + diff
        const f = (x:Probe): Maybe<Probe> => Maybe_.fromJust(x+diff)
        // act
        const action = Maybe_.fromJust(probe).fmap(f)
        //test
        const actual = action.unsafeRun().value
        expect(actual).toEqual(expected)
    })

})