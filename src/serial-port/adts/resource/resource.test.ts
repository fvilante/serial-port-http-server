import { Future, Future_ } from "../future"
import { Among } from "../maybe/among"
import { Result_ } from "../result"
import { KindedInterface } from "../validated/kind"
import { Resource, ResourceError, Resource_ } from "./resource"

describe('basic tests', () => {

    it('Can aquire, use and release the resource as well as produce all events (when no expecption happens)', async (done) => {
        // number of time methods are called
        let EffectHasBeenCalled = 0
        let aquireHasBeenCalled = 0
        let releaseHasBeenCalled = 0
        //prepare
        type MyResource<A> = { 
            func: (a:A) => Future<A>
            arg: A
        }
        const f: MyResource<number> = {
            arg: 10,
            func: n => {
                EffectHasBeenCalled++;
                return Future_.delay(15).map(() => n+1)
            }
        }
        const resource: Resource<typeof f> = Resource_.create({
            aquire: () => {
                return Future_
                    .fromValue(Result_.Ok<MyResource<number>, ResourceError['aquiringError']>(f))
                    .tap( () => aquireHasBeenCalled++ )
            },
            release: () => {
                return Future_
                    .fromValue(Result_.Ok<void, ResourceError['releaseError']>(undefined))
                    .tap( () => releaseHasBeenCalled++ )
            },
        })
        const useResource = <A>(resource: MyResource<A>) => {
            return Future<A>( yield_ => {
                const {func, arg} = resource
                const result = func(arg)
                result.unsafeRun(yield_)
            })
        }
        //act
        const action = resource.use(useResource)
        //test
        let eventBuffer:unknown[] = []
        action.unsafeRun( m => {
            const event = m.unsafeRun()
            eventBuffer.push(event)
            //console.log(event)
            if(event[0]==='END') {
                const expected = [ 
                    [ 'BEGIN', undefined ],
                    [ 'aquiring', undefined ],
                    [ 'aquired', f ],
                    [ 'running', undefined ],
                    [ 'result', 11 ],
                    [ 'releasing', undefined ],
                    [ 'released', undefined ],
                    [ 'END', undefined ] 
                ] as const
                expect(EffectHasBeenCalled).toBe(1)
                expect(aquireHasBeenCalled).toBe(1)
                expect(releaseHasBeenCalled).toBe(1)
                expect(eventBuffer).toStrictEqual(expected)
                //console.log(eventBuffer)
                done()
            }

        })
        
    })

    it('Can error on aquiring resource', async (done) => {
        const aquiringError: ResourceError['aquiringError'] = 'ResourceAquiringError'
        // number of time methods are called
        let EffectHasBeenCalled = 0
        let aquireHasBeenCalled = 0
        let releaseHasBeenCalled = 0
        //prepare
        type MyResource<A> = { 
            func: (a:A) => Future<A>
            arg: A
        }
        const f: MyResource<number> = {
            arg: 10,
            func: n => {
                EffectHasBeenCalled++;
                return Future_.delay(15).map(() => n+1)
            }
        }
        const resource: Resource<typeof f> = Resource_.create({
            aquire: () => {
                return Future_
                    .fromValue(Result_.Error<MyResource<number>, ResourceError['aquiringError']>(aquiringError))
                    //.tap( () => aquireHasBeenCalled++ )
            },
            release: () => {
                return Future_
                    .fromValue(Result_.Ok<void, ResourceError['releaseError']>(undefined))
                    .tap( () => releaseHasBeenCalled++ )
            },
        })
        const useResource = <A>(resource: MyResource<A>) => {
            return Future<A>( yield_ => {
                const {func, arg} = resource
                const result = func(arg)
                result.unsafeRun(yield_)
            })
        }
        //act
        const action = resource.use(useResource)
        //test
        let eventBuffer:unknown[] = []
        action.unsafeRun( m => {
            const event = m.unsafeRun()
            eventBuffer.push(event)
            const buf_ = eventBuffer as typeof event[]
            //console.log(event)
            if(event[0]==='END') {
                const expected = [ 
                    [ 'BEGIN', undefined ],
                    [ 'aquiring', undefined ],
                    [ 'error', ['aquiringError', aquiringError ]],
                    [ 'END', undefined ] 
                ] as const 

                // Fix: Here we flatten the AmongInterface because we don't want to receive type Among<U>, instead we want to unsafeRun Among payloads.
                //      In future I would construct a more generic solution in the Among ADT for this use case
                const buf__ = buf_.map( event => {
                    const [key,value] = event
                    if(typeof value==='object') {
                        if('kind' in (value as Among<ResourceError>)) {
                            if((value as Among<ResourceError>).kind==='Among') {
                                return [key, (value as Among<ResourceError>).unsafeRun()]
                            } else {
                                return [key, value]
                            }
                        } else {
                            return [key, value]
                        }
                    } else {
                        return [key, value]
                    }
                    
                    
                    
                })
                expect(EffectHasBeenCalled).toBe(0)
                expect(aquireHasBeenCalled).toBe(0)
                expect(releaseHasBeenCalled).toBe(0)
                expect(buf__).toStrictEqual(expected)
                //console.log(eventBuffer)
                done()
            }

        })
        
    })



})