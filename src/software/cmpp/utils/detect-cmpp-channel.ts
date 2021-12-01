import { executeInSequence } from "../../core/promise-utils";
import { makeRange } from "../../core/utils";
import { PortOpened, portOpener, PortSpec } from "../../serial";
import { Channel } from "../datalink/core-types";
import { detectCmpp } from "./detect-cmpp";

export type EventHandler = {
    BEGIN: () => void
    onDetected: (channel: Channel) => void
    onNotDetected: (channel: Channel) => void
    END: () => void
}

//NOTE: you must call this function when there is no more then one cmpp per each channel connected
export const detectCmppChannel = (portOpened: PortOpened, handler: EventHandler): void => {

    const timeout = 100 // milisecs TODO: Should this time be calculated in terms of baudrate and be lesser ?
    const channels: readonly Channel[] = [...makeRange(1,64,1)] //NOTE: I'm ignoring channel 0 because channel 0 is dangerous to scan: all cmpp will respond to channel 0. \\TODO: Maybe in future I can use to scan channel 0 as a last alternative to find some cmpp 

    handler?.BEGIN()

    const program = channels.map( channel => {
        return () => detectCmpp(portOpened, channel, timeout)
            .then( isPresent => {
                if(isPresent) {
                    handler.onDetected(channel)
                } else {
                    handler.onNotDetected(channel)
                }
            })   
    })

    executeInSequence(program)
        .then( () => handler?.END() )

}

const main = async () => {

    const spec: PortSpec = {
        path: 'com50',
        baudRate: 9600
    }

    console.log('Varrendo canais...')

    portOpener(spec)
        .then( async portOpened => {
            
            detectCmppChannel(portOpened, {
                BEGIN: () => {
                    console.log('Iniciando varredura')
                },
                onDetected: channel => {
                    console.log(`detectado cmpp no canal: ${channel}`)
                },
                onNotDetected: channel => {

                },
                END: () => {
                    portOpened.close()
                }
            })
 
        })

    

}

main()