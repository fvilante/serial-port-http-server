import WebSocket from 'ws'
import { v4 as uuidv4} from 'uuid'
import http from 'http'
import express from 'express'
import cors from 'cors'
import { CursorPositionClientEvent,  ClientMetadata, CursorPositionServerEvent } from './client/src/interface/core-types'

const port = 7071 // TCP port

const app = express()

app.use(cors({
    origin: '*', //TODO: Reduce the scope of the origin
    credentials: true,  //NOTE: Necessary to work with websocket protocol
}))

const CLIENT_FOLDER_ = 'client'

app.use( express.static(CLIENT_FOLDER_)) // serve folder as static files

const server = http.createServer(app)
server.listen(port)
const wss = new WebSocket.Server({ server })

const clients = new Map<WebSocket,ClientMetadata>()


const onMousePositionMessage = (message: CursorPositionClientEvent, metadata: ClientMetadata):void => {
    console.log('recebido mensagem do client')
    console.table(message)
    const response: CursorPositionServerEvent = {
        kind: 'CursorPositionServerEvent',
        ...message,
        sender: metadata.id, 
        color: metadata.color,
    };
    const outbound = JSON.stringify(response);
    clients.forEach( (metadata, client) => {
        client.send(outbound)
    })
}


wss.on('connection', ws => {
    
    const id = uuidv4()
    const color = Math.floor(Math.random() * 360)
    const clientMetadata: ClientMetadata = { id, color }

    console.log('new Client connected!')
    console.table(clientMetadata)

    clients.set(ws, clientMetadata)

    ws.on('message', clientMessage => {
        
        const cursorPositionMessage: CursorPositionClientEvent = JSON.parse(clientMessage.toString())
        onMousePositionMessage(cursorPositionMessage, clientMetadata)
        

    })

    ws.on('close', () => {
        console.log('Cliente desconectado: ', clientMetadata.id)
        clients.delete(ws)
    })

})


console.log(`Websocket server is up on port ${port}`);