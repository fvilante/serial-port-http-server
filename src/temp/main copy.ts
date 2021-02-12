//const SerialPort = require('serialport')
import SerialPort from 'serialport'
//const WebSocket_ = require('ws');
import WebSocket_ from 'ws'


// =============== [ ADT ] ====================================================================

type Pull<A, T = unknown> = {

}

type Push<A, T = unknown> = {

}

type Just<A> = {

}


type Future<A = unknown> = {
    unsafeRun: () => (consumer: (_:A) => void) => void

}
declare const Future: <A>(f: Future<A>['unsafeRun']) => Future<A> 


// =============== [ RESULT ] ====================================================================

type AnyError = string | void

type Result<A,E extends AnyError> = {
  matchFail: <R>(f: (err: AnyFail) => R) => R
  matchValue: <R>(f: (val: A) => R) => R
  failRecovery: (f: (currentFail: E) => Result<A,void>) => Result<A,void>
  failRecoveryAtempt: <E1 extends AnyError = E>(f: (currentFail: E) => Result<A,E1>) => Result<A,E1>
}

declare const Result: <A,E extends AnyError>() => Result<A,E>


// =============== [ REF ] ====================================================================


type Ref<A> = {
  get: () => A
  set: (_:A) => void
  update: (f: (current: A) => A) => void
  setAndGet: (_:A) => A
  getAndSet: (_:A) => A
}

type Validated<A> = {
  
}

type List<A> = {

}

type TimeStamp = { timeStamp: () => Date }

// =============== [ TREE ] ====================================================================
type Node<A> = {
  kind: 'Node'
  parent: A
  children: (Node<A>)[] | undefined
}

type TreeTransverseAlgorithm = unknown

type Tree<A> = {
  unsafeRun: () => Node<A>
  addParent: (node: A) => Tree<A>
  appendAfterLastChild: (node: A) => Tree<A>
  appendBeforeFirstChild: (node: A) => Tree<A>
  trasverse: <B>(a: TreeTransverseAlgorithm, f: (_:A) => B)=> Tree<A>
}

// =============== [ FAIL ] ====================================================================

type Fail<T extends string> = {
  unsafeRun: () => { type: T, detail: string }
}

type AnyFail = Fail<string>
declare const Fail: <T extends string>(type: T, detail: string) => Fail<T>

// =============== [ Constructor ] ====================================================================

type Constructible<X extends readonly any[] = readonly unknown[]> = { 
  defaultConstruction: () => X 
}

type GetArgumentFromConstructible<T extends Constructible> = ReturnType<T['defaultConstruction']>

type Construct<A extends Constructible = Constructible> = (...args: GetArgumentFromConstructible<A>) => A

type Test55_<X extends [kind: unknown, err: AnyError] | [kind: unknown ] = [kind: unknown, err: AnyError] | [kind: unknown]> = 
  & Constructible<X>
  & {
    fooSomething: 
      X['length'] extends 2 
        ? Result<X[0],X[1]> 
        : X['length'] extends 1
          ? Just<X[0]>
          : Pull<X[1]>
    map0: 
  } 

type Test55_T = Construct<Test55_<['A', 'B']>>
declare const Test55_ : Construct<Test55_<[kind: 'nego', err:'veio'] | [err: 'junior']>>

const xxxx = Test55_('junior').fooSomething

// =============== [ ADT ] ====================================================================

type TypeConstructor<K extends string = string, A extends readonly unknown[] = readonly unknown[], M = unknown> = {
  kind: K
  constructor: (...args:A) => M,
}

type InferTypeConstructor<T extends TypeConstructor> = T extends TypeConstructor<infer K, infer A, infer M> ? [K,A,M] : never
type Args<T extends TypeConstructor> = InferTypeConstructor<T>[1]
type Type_<T extends TypeConstructor> = InferTypeConstructor<T>[2]
type TypeName_<T extends TypeConstructor> = InferTypeConstructor<T>[0]

type JustC<A> = (value:A) => TypeConstructor<'Maybe', [A], Just<A>>

type Functor0<T extends TypeConstructor<string,[unknown], unknown>> = {
    map0: <B>(f: (...args: Args<T>) => B) => Functor0<TypeConstructor<TypeName_<T>, [B], Type_<T>>>
} 

type xx = Functor0<JustC<A>>


declare const Maybe: <A>(value:A) => Maybe<A> 

const juca = Maybe(20).map( x => 'oi' as const)


// =============== [ X ] ====================================================================


/**
 * WebSocket Server - 
 *   Abstract
 */



/**
 * WebSocket Server - 
 *   Concrete
 */

type OpenError = 'Cannot open serial port'
type CloseError = 'Cannot close serial port'
type WriteError = 'Cannot write to serial port'


type WSConfig = {
  port: 8080
}


// =============== [ SERIALIZATION ] ====================================================================

type UnserializationFail = 'Cannot unserialize data'
type SerializationFail = 'Cannot serialize data'

type Serializer<P = unknown> = {
  serialize: <P>(_:P) => Result<string,UnserializationFail>
}

type Unserializer<P = unknown> = {
  unserialize: (_:string) => Result<P,UnserializationFail>
}

type Serializable<P = unknown> =  Serializer<P> & Unserializer<P> 

type Kind<K extends string = string> = { kind: { name: K } & Serializable<K> }
type Payload_<P = unknown> = { payload: Ref<P> & Serializable<P> }


// =============== [ MESSAGES ] ====================================================================


type TransactionRoot = {
  open: { executionModel: 'async', argument: { uid: string }, return: Future<void> }
  write: { executionModel: 'async', argument: { uid: string, data: number[] }, return: Future<void> }
  onData: { executionModel: 'async', argument: { uid: string }, return: Push<Bytes> }
  close: { executionModel: 'sync', argument: { uid: string }, return: Future<void> }
}



type SerializableType_<T extends string = string, A = unknown, S = string> = 
  & { type: T }
  & { value: Just<A> }
  & Serializer_<A,S>
  & Constructible<[T,A,Serializer_<A,S>]>

type SerializableType_0<T extends string = string, A = unknown, S = string> = {
  type: T
  value: A
} & Serializable_<A,S>

declare const SerializableType_: <T extends string = string, A = unknown, S = string>(a: SerializableType_0<T,A,S>) => SerializableType_<T,A,S>

const x = SerializableType_<'string','kiko',string> ({ type: 'string', value: 'kiko', unserialize: x => 'kiko', serialize: x => 'x'})



type Serializer_<A,S = string> = {
  serialize: (_:A) => Pull<S>
}

type Unserializer_<A, S = string> = {
  unserialize: (_: Push<S, { unsubscribe: () => void }>) => A
}

type Serializable_<A, S = string> = 
  & Serializer_<A,S>
  & Unserializer_<A,S>

type LambdaArgument<A = unknown, S = string> = 
  & Serializable<A>
  & Just<A>

type LambdaReturn<R = unknown> =
  & Future<R> | Push<R>
  & Serializable<R>

type ExecutionModel<T extends 'async' = 'async'> = { executionModel: T} 
type AsyncLambda<A = unknown, R = unknown> = { executionModel: ExecutionModel<'async'>, argument: LambdaArgument<A>, return: LambdaReturn<R> }

type LambdaRepo<T> = {
  [K in keyof T]: AsyncLambda
}

type xxxxx = AsyncLambda<TransactionRoot>
  

type MessageService__<K extends string, P extends Payload_> =
  & Serializer<Message_<K,P>>
  & Unserializer<Message_<K,P>>
  & MessageConstructor_<K, P>

type MessageService__Arg<K extends string, P extends Payload_> = {
  kind: K
  constructor: MessageService__<K,P>['constructor']
  serializer: MessageService__<K,P>['serialize']
  unserializer: MessageService__<K,P>['unserialize']
}

declare const MessageService__: <K extends string, P extends Payload_>(_: MessageService__Arg<K,P>) => MessageService__<K,P>

type PayloadRaw<P = unknown> = {
  [K in keyof P]: P[K]
}

type MessagesRootType = { [Kind in string]: PayloadRaw }

type MessagesService<T = MessagesRootType> = {
  [K in Extract<keyof T, string>]: MessageService_<K, Payload_<T[K]>>
}

declare const MessagesService: <T = MessagesRootType>() => MessagesService<T>

type xx = MessagesService<TransactionRoot>


type Message_<K extends string = string, P = unknown> =
  & Kind<K>
  & TimeStamp
  & Payload_<P>

declare const Message_: <K extends string = string, P = unknown>(key: K, payload: P) => Message_<K,P>

type MessageConstructor_<K extends string = string, P = unknown> = {
  constructor: (kind: K, payload: P) => Message_<K,P>
}

declare const MessageConstructor_: <K extends string = string, P = unknown>(key: string, payload: P) => MessageConstructor_<K,P>

type AllMessages_<T extends readonly Message_[] = readonly Message_[]> = {
  [Index in keyof T]: T[Index]
}

type GetKindOfAllMessages_<T extends AllMessages_> = {
  [K in keyof T]: T[K] extends Message_<infer K, unknown> ? K : never
}

type GetPayloadOfAllMessages_<T extends AllMessages_> = {
  [K in keyof T]: T[K] extends Message_<string, infer P> ? P : never
}

type GetConstructorsOfAllMessages<T extends AllMessages_> = {
  [K in keyof T]: T[K] extends Message_<infer K, infer P> ? MessageConstructor_<K,P> : never
}

type GetAnyMessageOfAllMessages<T extends AllMessages_> = T[number]
type GetAnyKindOfAllMessages<T extends AllMessages_> = T[number]['kind']['name']
type GetAnyPayloadOfAllMessages<T extends AllMessages_> = T[number]['payload']



const MessageService_ = <T extends AllMessages_>(): MessageService_<T> => {

  type W = MessageService_<T>

  const serialize: W['serialize'] = msg => {
    const kindSerialized = msg.kind.serialize()
    const payloadSerialized = msg.payload.serialize()
    const messageRaw = { kind: kindSerialized, payload: payloadSerialized }
    const messageSerialized = JSON.stringify(messageRaw)
    return messageSerialized  
  }

  const constructor: W['constructor'] = (kind, payload) => {
    const msg = Messagec(kind, payload)
    return msg
  }

  return {
    serialize,
    unserialize: data => x,
    constructor,
  }
}



// real
declare const Kind: <K extends string>(_:K) => Kind<K>
declare const Payload: <P>(_:P) => Payload_<P>
declare const AllMessages: <T extends (AnyMessage_)[]>(_:T) => AllMessages_<T>


// impl


type Bytes = {
  read: () => Push<number>
  concat: (_: Bytes) => Bytes
}

type OpenMessage = Message_<'open', { uid: string }>
type CloseMessage = Message_<'close', { uid: string }>
type WriteMessage = Message_<'write', { uid: string, data: Bytes }>
type OnDataMessage = Message_<'onData', { uid: string }>

type AllMessages = [OpenMessage, CloseMessage, WriteMessage, OnDataMessage]

type AllKinds = GetKindOfAllMessages_<AllMessages>

type AnyMessage = GetSetOfAllMessages_<AllMessages>

// real
declare const Bytes: (_: readonly number[]) => Bytes
declare const OpenMessage: (payload: { uid: string}) => OpenMessage
declare const CloseMessage: (payload: { uid: string}) => CloseMessage
declare const WriteMessage: (payload: { uid: string, data: readonly number[]}) => WriteMessage
declare const OnDataMessage: (payload: { uid: string}) => OnDataMessage  


const SerializeMessage: <K extends string,P>(m: Message_<K,P>) => string = msg => {




}

const MessageService = (): MessageService<AnyMessage['kind'], AnyMessage['payload']> => {

  const MessageUnserializationError: MessageUnserializationError = 'Cannot cast Message'
  return {
    serialize: msg => JSON.stringify(msg),
    unserialize: data => {
      // check if properties of a message exists
      const msg0 = JSON.parse(data)
      const hasProp = (data: unknown, prop: string): boolean =>  ((data as any).prop !== undefined) ? true : false 
      const kind: keyof Kind<any> = 'kind'
      const isMessage: boolean = hasProp(data, kind)
      if (!isMessage) return MessageUnserializationError // obj does not have kind property
      const msg1 = msg0 as Message<any, any>
      const kindIsString = (typeof msg1.kind === 'string')
      if (!kindIsString) return MessageUnserializationError // kind is not string
      const msg2 = msg1 as Message<string, any>
      const validKinds: AllMessagesKind = ['open', 'close', 'write', 'onData']
      const isValidKind: boolean = validKinds.some( vk => msg2.kind === vk)
      if (!)
      // check if the properties is what we expect in termos of valid formats



    },
  }
}



type WSMsgHandler = {
  open: (m: OpenMessage) => Promise< OpenError | void>
  close: (m: CloseMessage) => Promise< CloseError | void>
  write: (m: WriteMessage) => Promise< WriteError | void>
  onData: (m: OnDataMessage) => Push<readonly number[]>
}

const WebSocket = (init: WSConfig, handler: WSMsgHandler) => {



  const { port } = init

  const unSerialize = (text: string) => JSON.parse(text)
  const castMessage = (data: unknown):AnyMessage | ErrorNotIsMessage => {

   

    if (hasProp(data, 'kind')
  }
  const serialize = <A>(object: A) => JSON.stringify(object) 


  const wss = new WebSocket_.Server({ port });
 
  wss.on('connection', ws => {

    ws.on('message', message => {
      const a = unSerialize(message as string)
      console.log(`WS receveid: ${message}`);
    });
  
    ws.send('something haha');
  });


}
 


/**
 * Serial Driver - 
 *   Abstract
 */

 type BaudRate = 115200|57600|38400|19200|9600|4800|2400|1800|1200|600|300|200|150|134|110|75|50

export type PortInfo = {
    readonly uid: string; // port path (exemple in linux: '/dev/tty-usbserial1', or in windows: 'COM6')
    readonly manufacturer?: string;
    readonly serialNumber?: string;
    readonly pnpId?: string;
    readonly locationId?: string;
    readonly productId?: string;
    readonly vendorId?: string;
}

export type PortOpened = {
  readonly write: (data: readonly number[]) => Promise<void>
  readonly onData: (f: (data: readonly number[]) => void) => void
  readonly close: () => Promise<void>
}

export type SerialDriver = {
  readonly listPorts: () => Promise<readonly PortInfo[]>
  readonly open: (uid: PortInfo['uid'], baudRate: BaudRate) => Promise<PortOpened>
}

export type SerialDriverConstructor = () => SerialDriver


/**
 * Serial Driver - Concrete
 */

const SerialDriverConstructor: SerialDriverConstructor = () =>  {
  
  const listPorts: SerialDriver['listPorts'] =  () =>  {
    const list = SerialPort.list();
    const portsInfo: Promise<readonly PortInfo[]> = list.then( y => y.map( x => ({ uid: x.path, ...x })));
    return portsInfo;
  }

  const open: SerialDriver['open'] = (uid, baudRate) => {

    const introduceLocalInterface = (portOpened: SerialPort): PortOpened => {

      const write: PortOpened['write'] = data => new Promise( (resolve, reject) => {
        portOpened.write([...data], err => reject(err));
        resolve();
      })
  
      const onData: PortOpened['onData'] = f => {
        portOpened.on('data', data => f(data) );
      }
  
      const close: PortOpened['close'] = () => new Promise( (resolve, reject) => {
        resolve(portOpened.close( err => reject(err)));
      })
  
      return {
        write,
        onData,
        close,
      }
    }

    const portOpened = new Promise<SerialPort>( (resolve, reject) => { 
        const port = new SerialPort(uid, { baudRate } )
        port.on('open', () => resolve(port))
        port.on('error', err => reject(err))
      })
        .then( introduceLocalInterface );

    return portOpened;
  }

  return {
    listPorts,
    open,
  }

}


/**
 * Main
 */

const main = () => {

    const serialDriver = SerialDriverConstructor()
    const ws = WebSocketServerConstructor(serialDriver)

}

main();


