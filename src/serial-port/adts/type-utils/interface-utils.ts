
//Note: TypeOfKey is any type that extends keyof any

export namespace InferInterface {
    
    export type GetKeys<T extends AnyInterfaceWithKey<TypeOfKey>, TypeOfKey extends keyof any> =  T extends AnyInterfaceWithKey<TypeOfKey> ? Extract<keyof T,TypeOfKey> : never 
    export type AnyInterfaceWithKey<TypeOfKey extends keyof any> = {[K in TypeOfKey]: unknown}
    
    export type StudyPairs<T extends AnyInterfaceWithKey<TypeOfKey>, TypeOfKey extends keyof any> = {
        [K in GetKeys<T,TypeOfKey>]: {key: K, value:T[K]}
    }
    
    export type MakePairs<T extends AnyInterfaceWithKey<TypeOfKey>, TypeOfKey extends keyof any> = StudyPairs<T, TypeOfKey>[GetKeys<T,TypeOfKey>]
    
    export type GetValueByKey<T extends AnyInterfaceWithKey<TypeOfKey>, TypeOfKey extends keyof any, K extends GetKeys<T,TypeOfKey>> = Extract<MakePairs<T,TypeOfKey>, {key: K}>['value']

}

export type MapValueByKey<U,K,B> = {
    [X in keyof U]: X extends K ? B : U[X] 
}





// informal test

type MyI = {
    foo: undefined
    bar: string
    ju: number[]
    0: 'heloo' // ATTENTION: if 'TypeOfKey' only includes string, any thing other then string will be ignored (ie: number or Symbol). See T666 below.
}

type T11 = InferInterface.GetKeys<MyI,string>
type T00 = InferInterface.GetKeys<MyI,string>
type T01 = InferInterface.StudyPairs<MyI,string>
type T02 = InferInterface.MakePairs<MyI,string>
type T03 = InferInterface.GetValueByKey<MyI,string,'ju'>
//type T666 = InferInterface.GetValueByKey<MyI,string,0>
type T04 = MapValueByKey<MyI,'bar',null>
