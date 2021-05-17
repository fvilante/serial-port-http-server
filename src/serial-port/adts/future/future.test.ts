import { Future, Future_ } from "../future"


describe('basic tests', () => {

    it('Can construct a single value', async () => {
        //prepare
        const probe = 2
        //act
        const ma = Future<number>( yield_ => yield_(probe) )
        //check
        ma.unsafeRun( actual => {
            expect(actual).toEqual(probe)
        })
    })

    it('Can construct a lazy promise from a future', async () => {
        //prepare
        const probe = 2
        //act
        const ma = Future<number>( yield_ => yield_(probe) )
        //check
        const p = ma.runToAsync()
        //'call back' format
        p().then(actual => {
            expect(actual).toEqual(probe)
        })
        //'async/await' format
        const actual = await p()
        expect(actual).toEqual(probe)
    })

    it('Can construct a eager promise from a future', async () => {
        //prepare
        const probe = 2
        //act
        const ma = Future<number>( yield_ => yield_(probe) )
        //check
        const p = ma.async()
        //'call back' format
        p.then(actual => {
            expect(actual).toEqual(probe)
        })
        //'async/await' format
        const actual = await p
        expect(actual).toEqual(probe)
    })


})