import { Maybe, MaybeWorld, Maybe_, NothingObject } from '../maybe'
import { Either, Either_ } from './either'

describe('Basic Tests', () => {

    type A = number // left
    type B = string // right

    it('Can create a left value', async () => {
        //prepare
        const a:A = 2
        const b:B = 'hi'
        const expected = { isLeft: true, value: a}
        //act
        const action = Either_.fromLeft<A,B>(a)
        //test
        const actual = action.unsafeRun()
        expect(actual).toEqual(expected)
    })

    it('Can create a right value', async () => {
        //prepare
        const a:A = 2
        const b:B = 'hi'
        const expected = { isLeft: false, value: b}
        //act
        const action = Either_.fromRight<A,B>(b)
        //test
        const actual = action.unsafeRun()
        expect(actual).toEqual(expected)
    })

    it('Can mapLeft', async () => {
        //prepare
        const a:A = 2
        const b:B = 'hi'
        type C = [A,'foo']
        const c:C = [a, 'foo']
        const f = (a_:A): C => [a_, 'foo']
        const expected = { isLeft: true, value: f(a)}
        //act
        const action = Either_.fromLeft<A,B>(a)
            .mapLeft(f)
        //test
        const actual = action.unsafeRun()
        expect(actual).toEqual(expected)
    })

    it('Can mapRight', async () => {
        //prepare
        const a:A = 2
        const b:B = 'hi'
        type D = [B,'foo']
        const d:D = [b, 'foo']
        const g = (b_:B): D => [b_, 'foo']
        //act
        const action = Either_.fromRight<A,B>(b)
            .mapRight(g)
        //test
        const actual = action.unsafeRun()
        expect(actual.value).toEqual(d)
    })

    it('Can bimap', async () => {
       // not implemented
       expect(true).toEqual(true)
    })

    it('Can transform', async () => {
        //prepare
        type X = Maybe<B>
        const a:A = 2
        const b:B = 'hi'
        // maps left to Nothing and right to just A 
        const f = (m: Either<A,B>): Maybe<B> => Maybe( () => {
            const v = m.unsafeRun()
            const r: Maybe<B> = 
                v.isLeft 
                    ? Maybe_.fromNothing()
                    : Maybe_.fromJust(v.value)
            return r.unsafeRun()
        })
        const probe = Either_.fromRight<A,B>(b)
        //act
        const action = probe.transform(f)
        //test
        const actual = action.unsafeRun().value
        const expected = b
        expect(actual).toEqual(expected)
    })

    it('Can flatten right', async () => {
        //prepare
        const a:A = 2
        const b:B = 'hi'
        const ma = Either_.fromRight<A,B>(b)
        const mma = Either_.fromRight<A, typeof ma>(ma)
        //act
        const action = Either_.flattenRight(mma)
        //test
        const actual = action.unsafeRun().value
        const expected = b
        expect(actual).toEqual(expected)
    })

    it('Can flatten left', async () => {
        //prepare
        const a:A = 2
        const b:B = 'hi'
        const ma = Either_.fromRight<A,B>(b)
        const mma = Either_.fromLeft<typeof ma, B>(ma)
        //act
        const action = Either_.flattenLeft(mma)
        //test
        const actual = action.unsafeRun().value
        const expected = b
        expect(actual).toEqual(expected)
    })

   
})