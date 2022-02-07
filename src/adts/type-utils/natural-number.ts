

export type NaturalNumber<N extends number> = Counter_<N,[]>

type Counter_<N extends number, Buf extends unknown[]> = 
    Buf['length'] extends N ? Buf :
        Counter_<N, [...Buf, Buf['length']]>


type T00 = NaturalNumber<45>