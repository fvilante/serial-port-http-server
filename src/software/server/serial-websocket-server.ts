import WebSocket from 'ws'
import { v4 as uuidv4} from 'uuid'
import http from 'http'
import express from 'express'
import cors from 'cors'
import { CursorPositionClientEvent,  ClientMetadata, CursorPositionServerEvent, ClientEvent } from './client/src/interface/core-types'
import { exhaustiveSwitch, random } from '../core/utils'
import { SingleAxis } from '../machine/single-axis'
import { makeTunnel } from '../cmpp/transport/tunnel'
import { Machine } from '../machine/machine'
import { Pulses } from '../cmpp/physical-dimensions/base'
import { Moviment } from '../cmpp/controlers/core'
import { PulsesPerTick, PulsesPerTickSquared } from '../cmpp/physical-dimensions/physical-dimensions'

//
const axisX = new SingleAxis(makeTunnel('com50', 9600, 1),`Eixo_X`)
const axisY = new SingleAxis(makeTunnel('com51', 9600, 1),`Eixo_Y`)
const axisZ = new SingleAxis(makeTunnel('com48', 9600, 1),`Eixo_Z`)

const machine = new Machine({X: axisX, Y: axisY, Z: axisZ})

const makeRandomMoviment = ():Moviment => {
    return {
        position: Pulses(random(500,2200)),
        speed:  PulsesPerTick(random(2000,5000)),
        acceleration: PulsesPerTickSquared(random(5000,15000)),
    }
}


//

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


const broadcastCursorPosition = (message: CursorPositionClientEvent, metadata: ClientMetadata):void => {
    console.log('recebido mensagem do client')
    console.table(message)
    const { x, y} = message
    const response: CursorPositionServerEvent = {
        kind: 'CursorPositionServerEvent',
        x,y,
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

    ws.on('message', clientEventRaw => {
        
        const clientEvent: ClientEvent = JSON.parse(clientEventRaw.toString())
        const { kind } = clientEvent
        switch (kind) {
            case 'CursorPositionClientEvent': {
                broadcastCursorPosition(clientEvent, clientMetadata)
                break;
            }

            case 'MachineGotoClientEvent': {
                console.table(clientEvent)
                const { x, y, z} = clientEvent
                machine.goto({
                    X: makeRandomMoviment(),
                    Y: makeRandomMoviment(),
                    Z: makeRandomMoviment(),
                })
                break;
            }

            case 'MachineStopClientEvent': {
                console.table(clientEvent)
                machine.shutdown();
                break;
            }

            case 'MachineInitializeClientEvent': {
                console.table(clientEvent)
                machine.initialize();
                break;
            }

            default: {
                exhaustiveSwitch(kind);
            }
        }
        
        

    })

    ws.on('close', () => {
        console.log('Cliente desconectado: ', clientMetadata.id)
        clients.delete(ws)
    })

})


console.log(`Websocket server is up on port ${port}`);