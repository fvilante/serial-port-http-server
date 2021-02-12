import { WebSocketClient } from './node-ws-client'
import { WebsocketServer } from './node-ws-server'
import WebSocket from 'ws'



test('Can connect the client on the server and vice-versa', async () => {

    jest.setTimeout(30000)

    let serverDetectedConnection = false
    let clientDetectedConnection = false

    const wss = () => new Promise<WebSocket.Server>( (resolve, reject) => {
        WebsocketServer({
            port: 8080,
            onLoaded: wss => { setTimeout(() => resolve(wss),1000) },
            onConnection: (ws, wss) => {
                serverDetectedConnection = true;
            },
            onError: (err) => reject(err),
        })
    })
 
    const ws = () => new Promise<WebSocket>( (resolve,reject) => {
        WebSocketClient({
            address: undefined,
            onOpen: ws => {
                clientDetectedConnection = true;
                setTimeout( () => resolve(ws), 1000);
            },
            onError: (err) => reject(err), 
        })
    })
    

    try {
        await wss().then( wss => ws().then( ws => {
            ws.close()
            wss.close()
        }))
    } catch (err) {
        console.log(err)
    }

    expect(serverDetectedConnection).toEqual(true)
    expect(clientDetectedConnection).toEqual(true)


})


test('client can send string message to server', async () => {

    jest.setTimeout(30000)

    const message = 'hello world'

    let serverDetectedMessage = false
    let clientSendMessage = false
    let messageReceivedIsCorrect = false

    const wss = () => new Promise<WebSocket.Server>( (resolve, reject) => {
        WebsocketServer({
            port: 8080,
            onLoaded: wss => { 
                resolve(wss);
            },
            onConnection: (ws, wss) => {
                ws.on('message', data => {
                    serverDetectedMessage = true;
                    if(data === message) { 
                        messageReceivedIsCorrect = true;
                    }
                })
            },
            onError: (err) => reject(err),
        })
    })
    const ws = () => new Promise<WebSocket>( (resolve, reject) => {
        WebSocketClient({
            address: undefined,
            onOpen: ws => {
                ws.send(message)
                clientSendMessage = true;
                setTimeout( () => resolve(ws), 100); // wait message transit
             },
             onError: (err) => reject(err),
        })
    })

    try {
        await wss().then( wss => ws().then( ws => {
            ws.close()
            wss.close()
        }))
    } catch (err) {
        console.log(err)
    }
    
    
    expect(serverDetectedMessage).toEqual(true)
    expect(clientSendMessage).toEqual(true)
    expect(messageReceivedIsCorrect).toEqual(true)

})

test('server can send string message to client', async () => {

    const message = 'hello world'

    let serverHasSentMessageToClient = false
    let clientHasReceivedMessageFromServer = false
    let messageReceivedIsCorrect = false

    const wss = () => new Promise<WebSocket.Server>( (resolve, reject) => {
        WebsocketServer({
            port: 8080,
            onLoaded: wss => { 
                resolve(wss);
            },
            onConnection: (ws, wss) => {
                ws.send(message);
                serverHasSentMessageToClient = true;
            },
            onError: (err) => reject(err),
        })
    })
    const ws = () => new Promise<WebSocket>( (resolve, reject) => {
        WebSocketClient({
            address: undefined,
            onMessage: (data, ws) => {
                clientHasReceivedMessageFromServer = true
                if(data===message) {
                    messageReceivedIsCorrect = true;
                }
                resolve(ws)
            },
            onError: (err) => reject(err),
        })
    })

    try {
        await wss().then( wss => ws().then( ws => {
            ws.close()
            wss.close()
        }))
    } catch (err) {
        console.log(err)
    }
    
    expect(serverHasSentMessageToClient).toEqual(true)
    expect(clientHasReceivedMessageFromServer).toEqual(true)
    expect(messageReceivedIsCorrect).toEqual(true)

})

test('can communicate in both directions', async () => {

    const probe = { 
        foo: 'hello world',
        bar: 'juca',
    }
    const message = JSON.stringify(probe)

    let serverHasSentMessageToClient = false
    let clientHasReceivedMessageFromServer = false
    let messageReceivedIsCorrect = false
    let serverReceivedMessageFromClient = false
    let serverReceivedMessageFromClientAndMessageItIsCorrect = false

    const wss = () => new Promise<WebSocket.Server>( (resolve, reject) => {
        WebsocketServer({
            port: 8080,
            onLoaded: wss => { 
                resolve(wss);
            },
            onConnection: (ws, wss) => {
                ws.send(message);
                serverHasSentMessageToClient = true;
                ws.on('message', data => {
                    serverReceivedMessageFromClient = true
                    if(data===message){
                        serverReceivedMessageFromClientAndMessageItIsCorrect = true
                    }
                })
            },
            onError: (err) => reject(err),
        })
    })
    const ws = () => new Promise<WebSocket>( (resolve, reject) => {
        WebSocketClient({
            address: undefined,
            onMessage: (data, ws) => {
                clientHasReceivedMessageFromServer = true
                if(message===data) {
                    messageReceivedIsCorrect = true;
                }
                ws.send(message)
                setTimeout(() => resolve(ws), 500)
            },
            onError: (err) => reject(err),
        })
    })

    try {
        await wss().then( wss => ws().then( ws => {
            ws.close()
            wss.close()
        }))
    } catch (err) {
        console.log(err)
    }
    
    expect(serverHasSentMessageToClient).toEqual(true)
    expect(clientHasReceivedMessageFromServer).toEqual(true)
    expect(messageReceivedIsCorrect).toEqual(true)
    expect(serverReceivedMessageFromClient).toEqual(true)
    expect(serverReceivedMessageFromClientAndMessageItIsCorrect).toEqual(true)

})
