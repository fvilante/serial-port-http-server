import { Future } from "../future";
import { Among, Among_ } from "../maybe/among";
import { Push } from "../push-stream";
import { Result, Result_ } from "../result";


type ResourceAquiringError = `ResourceAquiringError`
type ResourceReleaseError = `ResourceReleaseError`

type ResourceWorld<R> = {
    aquire: () => Future<Result<R,ResourceAquiringError>>
    release: () => Future<Result<void,ResourceReleaseError>>
} 

export type ResourceError = {
    aquiringError: ResourceAquiringError
    releaseError: ResourceReleaseError
}

type UseEvents<R,A> = {
    BEGIN: undefined
    aquiring: undefined
    aquired: R
    running: undefined
    result: A
    releasing: undefined
    released: undefined
    error: Among<ResourceError>
    END: undefined
}

export type Resource<R> = {
    kind: 'Resource'
    unsafeRun: () => ResourceWorld<R>
    use: <A>(f: (resource:R) => Future<A>) => Push<Among<UseEvents<R,A>>> // Note: It is not expected that the function 'f' throw an error
}

export const Resource = <R>(world: () => ResourceWorld<R>): Resource<R> => {

    type T = Resource<R>

    const unsafeRun: T['unsafeRun'] = world

    const use: T['use'] = <A>(f: (resource: R) => Future<A>) => {
        const event = Among_.fromInterface<UseEvents<R,A>>()
        const error_ = Among_.fromInterface<ResourceError>()
        const {aquire: create, release} = unsafeRun()
        return Push<Among<UseEvents<R, A>>>( yield_ => {
            //recipe
            yield_(event('BEGIN', undefined))
            yield_(event('aquiring', undefined))
            create().forResult({
                Error: err => {
                    yield_(event('error',error_('aquiringError',err)))
                    yield_(event('END',undefined))
                },
                Ok: resource => {
                    yield_(event('aquired', resource))
                    yield_(event('running', undefined))
                    const effect = f(resource)
                    //note: effect is expected to not throw any error.
                    effect.unsafeRun( valueA => {
                        yield_(event('result',valueA)) 
                        yield_(event('releasing', undefined))
                        release().forResult({
                            Error: err => {
                                yield_(event('error',error_('releaseError',err)))
                                yield_(event('END',undefined))
                            },
                            Ok: () => {
                                yield_(event('released', undefined))
                                yield_(event('END',undefined))
                            },
                        })
                    })
                }
            })
        })
    }

    return {
        kind: 'Resource',
        unsafeRun,
        use,
    }

}

// static part

export type Resource_ = {
    create: <A>(ff: ResourceWorld<A>) => Resource<A>
}

type T = Resource_

const create: T['create'] = spec => Resource(() => spec)

export const Resource_: Resource_ = {
    create
}
