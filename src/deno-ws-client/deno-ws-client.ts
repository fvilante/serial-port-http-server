import { 
    connectWebSocket,
    isWebSocketCloseEvent,
    isWebSocketPingEvent,
    isWebSocketPongEvent,
    WebSocketEvent,
    WebSocket, 
    WebSocketCloseEvent, 
    WebSocketPingEvent, 
    WebSocketPongEvent
} from 'https://deno.land/std@0.68.0/ws/mod.ts'

import { encode } from 'https://deno.land/std@0.68.0/encoding/utf8.ts'
import { BufReader } from 'https://deno.land/std@0.68.0/io/bufio.ts'
import { TextProtoReader } from 'https://deno.land/std@0.68.0/textproto/mod.ts'
import { blue, green, red, yellow } from 'https://deno.land/std@0.68.0/fmt/colors.ts'

//type WebSocket = ReturnType<typeof connectWebSocket> extends Promise<infer W> ? W : never

/**
 * Abstract
 */


export type WSClientReceptionHandler = {
    // occurs when a handshake is fisnihed and a connection is stabilished
    readonly onConnect?: (endPoint: WSClientConfig['endPoint'], sock: WebSocket) => void
    // occurs if I receive some data from the server
    readonly OnData: (msg:string, sock: WebSocket) => void
    // occurs if I receve a Ping from the server
    readonly PingEvent?: (ev: WebSocketPingEvent, sock: WebSocket) => void
    // occurs when I receive a pong from server after I send a Pìng to the server
    readonly PongEvent?: (ev: WebSocketPongEvent, sock: WebSocket) => void
    // only occurs when server send a close signal, not occurs when I decide to send the close signal to server
    readonly CloseEvent?: (endPoint:WSClientConfig['endPoint'], ev: WebSocketCloseEvent) => void 
}

export type WSClientConfig = {
    readonly endPoint: string | 'ws:127.0.0.1:8080'
    onError?: (err: unknown) => void        // connection error
    receptionHandlers: WSClientReceptionHandler
}

export type WSClient = {
    readonly kind: 'WSClient'
    readonly connectToServer: () => Promise<void>
}

export type WSClientConstructor = (_: WSClientConfig) => WSClient


/**
 * Concrete
 */

export const WSClientConstructor = (config:WSClientConfig): WSClient => {

    const { endPoint, onError, receptionHandlers: handlers} = config
    
    //const endpoint = Deno.args[0] || 'ws:127.0.0.1:8080';

    type H = WSClient

    const connectToServer: H['connectToServer'] = async () => {

        try {
            const sock = (await connectWebSocket(endPoint))
            if(handlers.onConnect) handlers.onConnect(endPoint, sock)
            //console.log(green(`ws connected!`));

            const messages = async (): Promise<void> => {
               
                for await (const event of sock) {
                    if (typeof event === 'string') {
                        handlers.OnData(event, sock)
                        //console.log(yellow(`< ${event}`));
                    } else if (isWebSocketPingEvent(event)) {
                        if(handlers.PingEvent) handlers.PingEvent(event, sock)
                        //console.log(blue(`< ping`));
                    } else if (isWebSocketPongEvent(event)) {
                        if(handlers.PongEvent) handlers.PongEvent(event, sock)
                        //console.log(blue(`< pong`));
                    } else if (isWebSocketCloseEvent(event)) {
                        if(handlers.CloseEvent) handlers.CloseEvent(endPoint, event)
                        //console.log(red(`closed: [code='${event.code}', reason='${event.reason}']`))
                    }
                }
            }
            /*
            const cli = async (): Promise<void> => {
                const tpr = new TextProtoReader( new BufReader(Deno.stdin));
                while(true) { 
                    await Deno.stdout.write(encode("> "));
                    const line = await tpr.readLine();
                    if (line === null) {
                        break;
                    }
                    if (line === 'close') {
                        break;
                    } 
                    else if (line === 'ping') {
                        console.log(`line is ${line}`)
                        await sock.ping();
                    } else {
                        await sock.send(line);
                    }
    
                }
            }*/

            const handleError = (err:unknown) => { console.error(err);  if(onError) onError(err); }

            await Promise.race([messages(), /*cli()*/]).catch(handleError);

            if (!sock.isClosed) {
                await sock.close(1000).catch(handleError);
            }
    

        } catch (err:unknown) {
            if(onError) onError(err)
            console.error(red(`Could not connect to WebSocket: ${err}`))
        } 

    }
    
    return {
        kind: 'WSClient',
        connectToServer,
    }
}


/*

const main = async () => {
    const endpoint = Deno.args[0] || 'ws:127.0.0.1:8080';
    //simple websocket cli//
    try {
        const sock = await connectWebSocket(endpoint)
        console.log(green(`ws connected! (type 'close' to quit)`));

        const messages = async (): Promise<void> => {
            for await (const msg of sock) {
                if (typeof msg === 'string') {
                    console.log(yellow(`< ${msg}`));
                } else if (isWebSocketPingEvent(msg)) {
                    console.log(blue(`< ping`));
                } else if (isWebSocketPongEvent(msg)) {
                    console.log(blue(`< pong`));
                } else if (isWebSocketCloseEvent(msg)) {
                    console.log(red(`closed: [code='${msg.code}', reason='${msg.reason}']`))
                }
            }
        }

        const cli = async (): Promise<void> => {
            const tpr = new TextProtoReader( new BufReader(Deno.stdin));
            while(true) { 
                await Deno.stdout.write(encode("> "));
                const line = await tpr.readLine();
                if (line === null) {
                    break;
                }
                if (line === 'close') {
                    break;
                } 
                else if (line === 'ping') {
                    console.log(`line is ${line}`)
                    await sock.ping();
                } else {
                    await sock.send(line);
                }

            }
        }

        await Promise.race([messages(), cli()]).catch(console.error);

        if (!sock.isClosed) {
            await sock.close(1000).catch(console.error);
        }

    } catch (err) {
        console.error(red(`Could not connect to WebSocket: ${err}`))
    }
}

if (import.meta.main) {
    await main();
}
*/