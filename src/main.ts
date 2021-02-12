//const SerialPort = require('serialport')
import { SerialDriverConstructor } from './serial-local-driver'
//const WebSocket_ = require('ws');
import WebSocket_ from 'ws'




/**
 * Main
 */

const main = () => {

    const ipPort = { port: 8080 } as const
    const serialDriver = SerialDriverConstructor()
    const ws = WebSocketSerialServerConstructor(serialDriver)

    ws.startServer(ipPort)

}

main();


