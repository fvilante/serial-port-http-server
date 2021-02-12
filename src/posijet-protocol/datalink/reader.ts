/**
 * Enviando Bloco
1B 02 C1 51 D5 14 1B 03 00 
Recebendo Bloco
1B 06 C1 51 00 00 1B 03 E5 
	- - - Bloco Recebido OK - - -
Enviando Bloco
1B 02 C1 52 53 4B 1B 03 4A 
Recebendo Bloco
1B 06 C1 52 00 00 1B 03 E4 
	- - - Bloco Recebido OK - - -
 */

import { FunctionLike } from "typescript"

// prelude
const isArrayEqual = <A>(as: readonly A[], bs: readonly A[]) => as.every( (a,index) => bs[index] === a) 

// 

type MessageModel<K extends string,A> = { kind: K, data: A[]}

type Message<K extends string, A> = {
    unsafeRun: () => MessageModel<K,A>
    forEach: (f: (_:MessageModel<K,A>) => void) => void
}
declare const Message: <K extends string,A>(kind:K, data:readonly A[]) => Message<K,A> 


//
type Consumer<A> = (data:A) => void
type Source<A> = (consumer: (data:A) => void) => void
type PushModel<A> = Source<A>
type Push<A> = {
    //unsafeRun: () => PushModel<A>
    //map: <B>(f: (_:A) => B) => Push<B>
    forEach: (f: (_:A) => void) => void
}
declare const Push: <A>(model: PushModel<A>) => Push<A>
const Push__ = <A>(m: PushModel<A>):Push<A> => {
    return {
        forEach: f => m(f),
    }
}

//
type StreamModel<K extends string,A> = Push<Message<K,A>>
type StreamModelCtor<K extends string,A> = PushModel<Message<K,A>>
type Stream<K extends string,A> = {
    forEachElement: (f: (element:A, token: K) => void) => void
    findSequenceAndfMapIt: <K1 extends string, B>(seq: readonly A[], f: (_: Message<K,A>) => Stream<K1,B>) => Stream<K | K1, A | B>
    findSequenceAndRename: <K1 extends string>(toMatch: readonly A[], newToken: K1) => Stream<K | K1,A>
    findSequenceAfterOtherSequence: <K1 extends string>(reference: readonly A[], toMatchAfter: readonly A[], newToken: K1) => Stream<K | K1,A>
}
declare const Stream: <K extends string,A>(m: StreamModel<K,A>) => Stream<K,A>
declare const Stream__: <K extends string,A>(m: StreamModelCtor<K,A>) => Stream<K,A>
const Stream___ = <K extends string,A>(m: StreamModel<K,A>):Stream<K,A> => {
    const id = (): Stream<K,A> => Stream___(m)
    return {
        forEachElement: f => {
            m.forEach( message => message.forEach( ({kind:token,data}) => data.map( element => f(element, token))))
        },
        findSequenceAndRename: (toMatch, newToken) => Stream__( consumer => {
            type NewToken = typeof newToken
            let buf: A[] = [] 
            id().forEachElement( (element, token) => {
                buf = [...buf, element]
                if (buf.length===toMatch.length) {
                    if(isArrayEqual(buf,toMatch)) {
                        consumer(Message(newToken, toMatch))
                        buf = []
                    } else {
                        const [head, ...tail] = buf
                        buf = tail
                        consumer(Message(token, [head]))
                    }
                }
            })
        }),
        findSequenceAfterOtherSequence: (ref, toMatch, newToken) => {

        }
    }
}

// Stream Transformer

type S0 = 'unknown'
type K = ['unknown','esc', 'noise', 'escDup']

type Level1<A> = (_:Stream<K[0],A>) => Stream<K[0] | K[1],A>
type Level2<A> = (_:Stream<K[0] | K[1],A>) => Stream<K[0] | K[1] | K[2],A>
type Level3<A> = (_:Stream<K[0] | K[1],A>) => Stream<K[0] | K[1] | K[2] | K[3],A>

            

 
const IdentifyEsc = <A>(esc: readonly A[]): Level1<A> => 
    source => source.findSequenceAndRename(esc,'esc')

const IdentifyEscDup = <A>(esc: readonly A[], escDup: readonly A[]): Level1<A> => 
    source => source.findSequenceAfterOtherSequence(esc, escDup, 'escdup')


// ==================
// só pra ver onde isto termina, quero verificar onde seria o nivel hierarquico mais alto do label no meu caso particular do protocolo (ou seja onde isto iria parar?)
type Label = string 
type Token<A extends Label = Label,B = unknown> = {
    kind: A
    data: B
}

// concrete type
// hierarquical structure
type Unk<A> = Token<'Unk',A[]> 
type Esc<A> = Token<'Esc', A[]>

type EscId<A> = Token<'EscId', A[]>
type Cmd<A> = Token<'Cmd',A[]>
type Param<A> = Token<'Param',A[]>

type Stx<A> = Token<'Stx', Cmd<A>>
type Etx<A> = Token<'Etx', Cmd<A>>
type Ack<A> = Token<'Ack', Cmd<A>>
type Nack<A> = Token<'Nack', Cmd<A>>

type DataDup<A> = Token<'DataDup', [Esc<A>, EscId<A>]>
type CmdNopar<A> = Token<'CmdNoPar', [Esc<A>, Cmd<A>]>
type CmdParam<A> = Token<'CmdParam', [Esc<A>, Cmd<A>, Param<A>]>

type StartMasterBlock<A> = Token<'StartMasterBlock', [Esc<A>, Stx<A>]>
type StartSlaveBlockWithoutError<A> = Token<'StartSlaveBlockWithoutError', [Esc<A>, Ack<A>]>
type StartSlaveBlockWithError<A> = Token<'StartSlaveBlockWithError', [Esc<A>, Nack<A>]>
type EndBlockWithCheckSum<A> = Token<'EndBlockWithCheckSum', [Esc<A>, Etx<A>, Param<A>]>

type Data<A> = Token<'Data',  Unk<A> | DataDup<A>>
type ObjV1<A> = Token<'ObjV1', [dirChan: Data<A>, cmd: Data<A>, byteLow: Data<A>, byteHigh: Data<A>]>
type ObjV3<A> = Token<'ObjV3', Data<A>[]>

type MasterFrame<A,Obj> = Token<'MasterFrame', [StartMasterBlock<A>, Obj, EndBlockWithCheckSum<A>]>
type SlaveFrame<A,Obj> = Token<'SlaveFrame', [StartSlaveBlockWithoutError<A> | StartSlaveBlockWithoutError<A>, Obj, EndBlockWithCheckSum<A>]>

type Frame<A,Obj> = MasterFrame<A,Obj> | SlaveFrame<A,Obj>

// flow structure

type Flow<A extends Token = Token,B extends Token=Token> = [in_: A, out: B]
type AddFlow<F extends Flow, B extends Token> = Flow<F[number], F[number] | B>
type Flow10<A> = Flow<Unk<A>, Esc<A>> 
type Flow11<A> = AddFlow<Flow10<A>, EscId<A>> 
type Flow12<A> = AddFlow<Flow11<A>, Cmd<A>> 
type Flow13<A> = AddFlow<Flow12<A>, Param<A>> 
type Flow20<A> = Flow13<A>[1]
type MapToken<T extends Token, K extends string, N extends Token> = T extends 
    Token<K,unknown> ? never : 
    T | N

type Flow21<A> = MapToken<Flow20<A>, 'Cmd', Stx<A> | Etx<A> | Ack<A> | Nack<A>>


type GetUnionizedLabelToken<T extends Token> =
    T extends Token<infer L> ? L  : never

type UnUnionizeToken<T extends Token> = Token<GetUnionizedLabelToken<T>,T['data']> extends Token<infer L, infer A> ? Token<L,A> : T


type X<A>  = UnUnionizeToken<Esc<A> | EscId<A> | Cmd<A> | Param<A>>

// ===================
// Exploring the idea of Pure Events and union of Pure Events for flow strutucture


type FirstOfAll<A> = (source: Push<A>) => {
    Esc: Push<Esc<A>>
    Unk: Push<Unk<A>>
}

type IdentifyFromEsc<A> = (x: Unionnize<FirstOfAll<A>>9) => {
    EscId: Push<EscId<A>>
    Cmd: Push<Cmd<A>>
    Param: Push<Param<A>>
}

type NameCmd<A> = (x: Push<Cmd<A>>) => {
    Stx: Push<Stx<A>>
    Etx: Push<Etx<A>>
    Ack: Push<Ack<A>>
    Nack: Push<Nack<A>>
}

type Unionnize<T extends (_:any) => {[K in string]:Push<Token<string,unknown>>}> = ReturnType<T>[keyof ReturnType<T>]  extends Push<Token<infer L, infer A>> ? (_:ReturnType<T>) => Push<Token<L,A>> : never

type Commands<A> = Unionnize<NameCmd<A>>

type MarkupIdentification<A> = (x: Commands<A>) => {
    StartMasterBlock: Push<StartMasterBlock<A>>
    StartSlaveBlockWithoutError: Push<StartSlaveBlockWithoutError<A>>
    StartSlaveBlockWithError: Push<StartSlaveBlockWithError<A>>
    EndBlockWithCheckSum: Push<EndBlockWithCheckSum<A>>
}

type FramerIdent<A> = (x: ReturnType<MarkupIdentification<A>>) => {
    MasterFrame: Push<MasterFrame<A,ObjV3<A>>>
    SlaveFrame: Push<SlaveFrame<A,ObjV3<A>>>
    Frame: Push<Frame<A,ObjV3<A>>>
}




/*
const IdentifyEscDup = <A>(escDup: readonly A[]):Transformer<A,['noise', 'esc'], ['noise', 'esc', 'escDup']> =>
    source => consumer => {
        let buf: A[] = [] 
        source( message => {
            if(message.kind==='esc') {
                message.data.forEach( data => {
                    buf = [...buf, data]
                    if(buf.length===escDup.length) 

                })
            } else {
                consumer(message)
            }
        })
    }


//





const main = () => {

    const source: Source<number> = consumer => [1,2,3,4,5,6,7,8,9,10].map( x => consumer(x))

    const stream = ConsumeSourceUntilEsc(source, [7,8])

    stream( data => console.log(data))

}

main();


*/
