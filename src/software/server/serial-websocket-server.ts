import {WebSocket} from 'ws'
import { v4 as uuidv4} from 'uuid'

const port = 7071 // TCP port

// websocket server
const wss = new WebSocket.Server({ port })

type UUID = string

type HSV = number

type Metadata = {
    id: UUID;
    color: HSV;
}


type CursorPosition = {
    x: number
    y: number
}

type Response = {
    sender: UUID
    color: HSV
} & CursorPosition

const clients = new Map<WebSocket,Metadata>()

wss.on('connection', ws => {
    
    const id = uuidv4()
    const color = Math.floor(Math.random() * 360)
    const metadata: Metadata = { id, color }

    console.log('new Client connected!')
    console.table(metadata)

    clients.set(ws, metadata)

    ws.on('message', clientMessage => {
        
        
        const message: CursorPosition = JSON.parse(clientMessage.toString())
        console.log('recebido mensagem do servidor')
        console.table(message)

        const response: Response = {
            ...message,
            sender: metadata.id, 
            color: metadata.color,
        };

        const outbound = JSON.stringify(response);

        [...clients.keys()].forEach( client => {
            client.send(outbound)
        })

    })

    ws.on('close', () => {
        console.log('Cliente desconectado: ', metadata.id)
        clients.delete(ws)
    })

})


console.log(`Websocket server is up on port ${port}`);