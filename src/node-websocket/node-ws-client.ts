import WebSocket from 'ws'

// =====================================
// concrete thing 

export type WebsocketClientParameter = {
    readonly address? :string // default = 'ws:127.0.0.1:8080',
    readonly onLoaded?: (ws: WebSocket) => void // onLoaded and before anything else
    readonly onOpen?: (ws: WebSocket) => void, 
    readonly onMessage?: (data: string, ws: WebSocket) => void,
    readonly onClose?: () => void,
    readonly onError?: (e: Error) => void
    readonly timeout?: number // milisecs to close the client
}

export const WebSocketClient = (p: WebsocketClientParameter):void => {
    const {
        address, 
        onLoaded,
        onOpen, 
        onMessage, 
        onClose, 
        onError, 
        timeout, 
    } = p
    


    // handling setup
    const ws =  new WebSocket(address ? address : 'ws:127.0.0.1:8080')
    if(onLoaded) onLoaded(ws);
    ws.on('close', () => { ClearTimeout(); if (onClose) onClose();} );
    ws.on('error', err => {  ClearTimeout(); ws.close(); if (onError) onError(err);} )
    ws.on('open', () => { if (onOpen) onOpen(ws); });
    ws.on('message', data => { if(onMessage) onMessage(data.toString(), ws); } );


    // timeout logic service
    let timer: number | undefined = undefined
    const ClearTimeout = () => { if(timer) { clearTimeout(timer) ; timer = undefined} } 
    const StartTimeout = () => {
        if(timeout!==undefined && timer===undefined) { 
            /*timer = */setTimeout( () => {
                if(ws.OPEN || ws.CONNECTING) ws.close() // note: i'm not sure if ws.CONNECTING can accept a close() signal
            }, timeout)
        }
    }
    StartTimeout();

}

// =====================================
// adapters 


// =====================================
// use 

const main = () => {
    const address = 'ws:127.0.0.1:8080'
    WebSocketClient({
        address,
        onOpen: sock => sock.send('Hi server! how are you!'),
        onMessage: (msg, sock) => {
            console.log(`server has send this response ${msg}`),
            sock.close();
        },
        onClose: () => console.log(`client web socket has closed.`),
        onError: err => console.log(`wsclient has error ${err.message}`),
        timeout: 5000
    })
}

//main();






