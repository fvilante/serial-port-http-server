import { WebSocketClient } from './node-ws-client'
import { WebsocketServer } from './node-ws-server'
import WebSocket from 'ws'

type Consumer<A> = (_:A) => void
type PushModel<A> = (_: Consumer<A>) => void

export type Push<A> = {
    forEach: (f: (_:A) => void) => void
    readonly map: <B>(f: (_:A) => B) => Push<A> 
}
export declare const Push: <A>() => Push<A>

type FutureModel<A> = (resolve: (_:A) => void) => void
type Future<A> = {
    readonly map: <B>(f: (_:A) => B) => Future<A> 
}
declare const Future: <A>(_: FutureModel<A>) => Future<A>

// ==========

type Tx<A,B> = {
    mapReception: (_:A) => Tx<A,B>
}

type Server<A,B> = {
    forEachConnection: (f: (rx: Push<A>, tx: (_:A, timeout: number) => Push<A>, context: unknown) => void) => Server<A,B>
}

declare const Server: <A = string,B = string>(port: number) => Server<A,B>


type Connection<A,B> = {
    rx: Push<A> 
    tx: (_:B) => void, 
    context: unknown
}

type _Connection<A,B> = {
    forEach: (_: Connection<A,B>) => Future<void>
}


type Client<A,B> = {

}

declare const Client: <A = string,B = string>(address: string | undefined) => Client<A,B>

type UseComm<A, B = A, S extends Server<A,B> | Client<A,B> = Server<A,B> | Client<A,B>> = (rx: Push<A>, tx: (_:A) => void, socket: S) => void



const main = () => {

    type Msg = string

    const address = undefined
    const server = Server(8080)
    const client = Client(address)

    const x = server.forEachConnection( (rx, tx, ctx) => {
        Future( resolve => {
            rx.forEach( data => {

                console.log(`Received this data from client -> ${data}`)
                console.log(`Answering with an 'hello' from server ->`)
                tx('hello client, here is the server!')

                

            })
        })
    })

}

main();