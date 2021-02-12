
type Validated<A> = {
}

type Maybe<A> = {
}

type IO<A> = {
}

type Ref<A> = {
}

export type Future<A> = {
}

type NumberOutOfRange = {}

type NumericRange = {
    includeFromTo: (from: number, to: number) => NumericRange
    excludeFromTo: (from: number, to: number) => NumericRange
    addRangeInclusive: (include: number) => NumericRange
    addRangeExclusive: (exclude: number) => NumericRange
    isInRange: (_: number) => Writter<boolean>
}

type OptionCast = {
    default_value: Validated<number>            //index in terms of the array 'options_list' bellow
    options: { 
        name: string, 
        value: Validated<number>
    }  //number is the number choosed string option represents
}

type MemSpace = {
    adresses: NumericRange
}

type MemRegionCast = {
    startWord: Validated<number>
    startBit: Validated<number>
    bitLength: Validated<number>
    valueRange: Validated<NumericRange>
}

type CmppParamCast<A> = {
    help: Maybe<string>
    name: string
    memRegion: MemRegionCast
    typeCast: {
        from: (_: Validated<number>) => A
        to: (_:A) => Validated<number>
    } 
}


type CmppResponse = {

}

type CmppGlobal = {

}

type SerialTransact = {
    
}

type CmppParamDeps<A> = {
    global: Ref<CmppGlobal>
    cast: CmppParamCast<A>
    transact: Transact
}

type CmppParam<A> = (global: Ref<CmppGlobal>, param: CmppParamCast<A>, transact: Transact) => {
    Send: (value: A) => Future<[void, CmppResponse, Ref<CmppGlobal>]>
    Get:  () => Future<[A, CmppResponse, Ref<CmppGlobal>]>
}


