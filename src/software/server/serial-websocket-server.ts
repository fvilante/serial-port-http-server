import WebSocket from 'ws'
import { v4 as uuidv4} from 'uuid'
import http from 'http'
import express from 'express'
import cors from 'cors'
import { CursorPositionClientEvent,  ClientMetadata, CursorPositionServerEvent, ClientEvent, ReadyStateServerEvent, ServerEvent } from './client/src/interface/core-types'
import { exhaustiveSwitch, random } from '../core/utils'
import { SingleAxis } from '../machine/single-axis'
import { makeTunnel } from '../cmpp/transport/tunnel'
import { Machine } from '../machine/machine'
import { Pulses } from '../cmpp/physical-dimensions/base'
import { Moviment } from '../cmpp/controlers/core'
import { PulsesPerTick, PulsesPerTickSquared, Pulses_ } from '../cmpp/physical-dimensions/physical-dimensions'

// lock

let isLocked = false


// machine
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


// music

const pitchShift = 1

type Frequency = number  // the numbe represents a frequency in hertz 
type Duration = number // in miliseconds
type Bend = number // acceleration in pulses per second squared

const C4: Frequency = 262 * pitchShift
const D4: Frequency = 294 * pitchShift
const E4: Frequency = 330 * pitchShift
const F4: Frequency = 349 * pitchShift
const G4: Frequency = 392 * pitchShift
const A4: Frequency = 440 * pitchShift
const B4: Frequency = 494 * pitchShift
const C5: Frequency = (C4*2) * pitchShift

    type Sound = { 
        frequency: Frequency
        duration: Duration
        bend?: Bend
    }

const soundToRelativeMoviment = (sound: Sound):Moviment => {
    const {frequency, duration, bend} = sound
    const stepPerPulse = 1
    const stepsPerSecond = frequency * stepPerPulse
    const totalSteps_ = (stepsPerSecond/1000)*duration
    const totalRelativeSteps = Math.round(totalSteps_)
    const acceleration = bend ?? 15000
    return {
        position: Pulses(totalRelativeSteps),
        speed: PulsesPerTick(Math.round(frequency)),
        acceleration: PulsesPerTickSquared(acceleration)
    }
}

const playRelativeMoviment = async (nextRelativeMoviment: Moviment): Promise<void> => {
    //TODO: Make the moviment more symetric in relation to axis length
    //TODO: Make this state more persistent
    let currentDirection: number = 1 // (+1) = forward, (-1) = reward
    const { position: nextRelativePosition } = nextRelativeMoviment
    const MAX_POSITION = Pulses(2300)
    const MIN_POSITION = Pulses(500)
    const currentAbsolutePosition_ = await axisX.getCurrentPosition()
    const nextAbsolutePosition = Pulses_.add(currentAbsolutePosition_, nextRelativePosition)
    const isNextAbsolutePositionOutOfRange = ():boolean => {
        const isOutUpperBound = nextAbsolutePosition.value >=  MAX_POSITION.value
        const isOutLowerBound = nextAbsolutePosition.value <=  MIN_POSITION.value
        return isOutLowerBound || isOutUpperBound
    }
    if (isNextAbsolutePositionOutOfRange()) {
        currentDirection = currentDirection === 1 ? -1 : 1
    }
    const nextRelativePosition_adjusted = Pulses_.scale(nextRelativePosition, currentDirection)
    const nextMoviment_adjusted = { ...nextRelativeMoviment, position: nextRelativePosition_adjusted}
    await axisX.gotoRelative(nextMoviment_adjusted)
    const isReferenced = (await axisX.getMovimentStatus()).isReferenced 
    if(!isReferenced) throw new Error('Equipamento desreferenciou')
    return
}

const playNote = async (frequency: number, duration: number) => {
    const relativeMoviment = soundToRelativeMoviment({frequency, duration})
    await playRelativeMoviment(relativeMoviment)
}





// server

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

const broadCastEvent = (event: ServerEvent):void => {
    const jsonEvent = JSON.stringify(event);
    clients.forEach( (metadata, client) => {
        client.send(jsonEvent)
    })
}


setInterval(() => {
    const readyState: ReadyStateServerEvent = {
        kind: 'ReadyStateServerEvent',
        isReady: isLocked ? false : true,
    }
    console.log('isReady=',readyState.isReady)
    broadCastEvent(readyState)
}, 500)

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
                if(isLocked) return
                isLocked = true
                machine
                    .goto({
                        X: makeRandomMoviment(),
                        Y: makeRandomMoviment(),
                        Z: makeRandomMoviment(),
                    })
                    .catch( err => console.log(err))
                    .finally( () => isLocked = false)    
                break;
            }

            case 'MachineStopClientEvent': {
                console.table(clientEvent)
                if(isLocked) return
                isLocked = true
                machine
                    .shutdown()
                    .catch( err => console.log(err))
                    .finally( () => isLocked = false) 
                break;
            }

            case 'MachineInitializeClientEvent': {
                console.table(clientEvent)
                if(isLocked) return
                isLocked = true
                machine
                    .initialize()
                    .catch( err => console.log(err))
                    .finally( () => isLocked = false) 
                break;
            }

            case 'PlayNoteClientEvent': {
                console.table(clientEvent)
                if(isLocked) return
                const { duration, frequency} = clientEvent
                isLocked = true
                playNote(frequency, duration)
                    .catch( err => console.log(err))
                    .finally( () => isLocked = false) 
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