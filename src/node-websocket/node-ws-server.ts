import WebSocket from 'ws'

export type WebsocketServerParameter = {
    readonly port: number, 
    readonly onLoaded?: (wss: WebSocket.Server) => void // after loaded before anything else
    readonly onConnection: (ws: WebSocket, wss: WebSocket.Server) => void,
    readonly onClose?: () => void,
    readonly onError?: (_:Error) => void,
    readonly timeout?: number // milisecs to program a close
}

export const WebsocketServer = (p: WebsocketServerParameter):void => {
    const { 
        port,
        onLoaded: onServerLoaded,
        onConnection,
        onClose,
        onError,
        timeout,
     } = p
    const wss = new WebSocket.Server({ port: port })
    if (onServerLoaded) onServerLoaded(wss)
    wss.on('close', () => { if(onClose) onClose()} );
    wss.on('error', (err) => { if(onError) onError(err)} );
    wss.on('connection', ws => onConnection(ws, wss))
    if(timeout) setTimeout( () => {
        wss.clients.forEach( client => {
            if(!client.CLOSING) client.close() // note: i'm not sure if this is the right way to close
        })
        wss.close()
    }, timeout)
}

// example of use

const main = () => {
    console.log('iniciado main')

    WebsocketServer({
        port: 8080,
        onConnection: (ws,wss) => {
            console.log(`server detected a client connection. Current number of connection on server is ${wss.clients.size}`);
            ws.close()
            wss.close()
        },
        onClose: () => console.log(`ws server has closed`),
        onError: () => console.log(`ws server has errored`),
        timeout: 5000,
    })

    console.log(`termino do main`)
    
}

//main();
