import { serve } from 'https://deno.land/std@0.68.0/http/server.ts'
import { 
    acceptWebSocket,
    isWebSocketCloseEvent,
    isWebSocketPingEvent,
    WebSocket,
} from 'https://deno.land/std@0.68.0/ws/mod.ts'

const handleWs = async (socket: WebSocket): Promise<void> => {
    console.log('socket connected!');

    try {
        for await (const ev of socket) {
            if (typeof ev === 'string') {
                // text message
                console.log("ws:Text", ev);
                await socket.send(ev); //loop back
            } else if (ev instanceof Uint8Array) {
                // binary message
                console.log("ws: binary", ev)
            } else if (isWebSocketPingEvent(ev)) {
                const [,body] = ev
                // ping
                console.log("ws:Ping", body);
            } else if (isWebSocketCloseEvent(ev)) {
                // close
                const { code, reason } = ev;
                console.log(`ws:Close [code: '${code}', reason: '${reason}']`);
            }
        }
    } catch (err) {
        console.error(`Failed to receive frame ${err}`);

        if (!socket.isClosed) {
            await socket
                .close(1000)
                .catch(console.error)
        }
    }
}

const main = async () => {
    // web socket echo server //
    const port = Deno.args[0] || "8080"
    console.log(`websocket server is running on port '${port}'`)
    for await (const req of serve(`:${port}`)) {
        const { conn, r: bufReader, w: bufWriter, headers } = req
        acceptWebSocket({conn, bufReader, bufWriter, headers})
            .then(handleWs)
            .catch( async e => {
                console.error(`failed to accept websocket: ${e}`);
                await req.respond({ status: 400 })
            })
    }

}

if (import.meta.main) {
    await main()
}



