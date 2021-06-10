
export type AnyInterface = {[K in keyof any]: unknown}

export type StudyPairs<T extends AnyInterface> = {
    [K in keyof T]: {key: K, value:T[K]}
}

export type MakePairs<T extends AnyInterface> = StudyPairs<T>[keyof T]

export type GetKeys<T extends AnyInterface> =  keyof T
export type GetValueByKey<T extends AnyInterface, K extends GetKeys<T>> = Extract<MakePairs<T>, {key: K}>['value']



// informal test

type MyI = {
    foo: undefined
    bar: string
    ju: number[]
}

type T00 = GetKeys<MyI>
type T01 = StudyPairs<MyI>
type T02 = MakePairs<MyI>
type T03 = GetValueByKey<MyI,'bar'>

