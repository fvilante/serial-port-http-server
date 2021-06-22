import { Reader_ } from '../reader/reader'
import {ZIO, ZIO_} from './zio'

describe('basic tests', () => {

    it('Can construct from Reader ADT', async (done) => {
        //prepare
        const probe = 2 as const
        type A = `a number ${number}`
        const f = (n:number) => n+1
        const expected: A = `a number ${f(probe)}` as const
        const reader = Reader_.fromSync( (n:number) => `a number ${f(n)}` as const)
        //act
        const action = ZIO_.fromReader(reader)
        //check
        const x = action.unsafeRun(2)
        x.unsafeRun( r => {
            r.match({
                Error: err => {throw new Error('Impossible')},
                Ok: val => {
                    expect(val).toStrictEqual(expected)
                    done();
                }
            })
        })
        
    })

    it('Can construct from Sync function', async (done) => {
        //prepare
        const probe = 2 as const
        type A = `a number ${number}`
        const f = (n:number) => n+1
        const expected: A = `a number ${f(probe)}` as const
        const syncFunction = (n:number) => `a number ${f(n)}` as const
        //act
        const action = ZIO_.fromSync(syncFunction)
        //check
        const x = action.unsafeRun(2)
        x.unsafeRun( r => {
            r.match({
                Error: err => {throw new Error('Impossible')},
                Ok: val => {
                    expect(val).toStrictEqual(expected)
                    done();
                }
            })
        })
        
    })

    it('Can provide an enviroment', async (done) => {
        //prepare
        const probe = 2 as const
        type A = `a number ${number}`
        const f = (n:number) => n+1
        const expected: A = `a number ${f(probe)}` as const
        const syncFunction = (n:number) => `a number ${f(n)}` as const
        const test = ZIO_.fromSync(syncFunction)
        //act
        const action = test.provide(2)
        //check
        const x = action.unsafeRun()
        x.unsafeRun( r => {
            r.match({
                Error: err => {throw new Error('Impossible')},
                Ok: val => {
                    expect(val).toStrictEqual(expected)
                    done();
                }
            })
        })
        
    })

    it('Can compose two ZIOs with "andThen" method and also it can contramap', async (done) => {
        //prepare
        const probe = 2
        const f = (n: number): number => n+1
        const g = (n: number): number => n+4
        const zf = ZIO_.fromSync(f)
        const zg = ZIO_.fromSync(g).contramap<readonly [prevEnv: number, curEnv: number, prevValue:number]>( ([prevEnv, curEnv, prevValue]) => prevValue)
        const expected = [f(probe),g(f(probe))]
        //act
        const action = zf.andThenG(zg) 
        //check
        const x = action.unsafeRun([probe,0])
        x.unsafeRun( r => {
            r.match({
                Error: err => {throw new Error('Impossible')},
                Ok: val => {
                    expect(val).toStrictEqual(expected)
                    done();
                }
            })
        })
        
    })
})