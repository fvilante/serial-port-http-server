// Emulates a serialport loopback where PortA is connected (cross-over) to PortB and vice-versa 

import { delay } from "../../../core/delay"
import { PortSpec } from "../../core/port-spec"
import { PortOpened } from "../main/port-opened"


//TODO: Change below names to more mneumonic names
export const LoopBackPortA_Path = 'LoopBackTest_PortA' //TODO: rename by a more meneumonic name
export const LoopBackPortB_Path = 'LoopBackTest_PortB'

const WRITE_DELAY = 2 // miliseconds

export const LoopBackPortA_Info = {
    "locationId": "LOOP_BACK_PORT_A",
    "manufacturer": "Flavio Vilante" as const,
    "path": "COM4",                           
    "pnpId": `${LoopBackPortA_Path}`,
    "productId": undefined,
    "serialNumber": undefined,
    "vendorId": undefined,
}

export const LoopBackPortB_Info = {
    "locationId": "LOOP_BACK_PORT_A",
    "manufacturer": "Flavio Vilante" as const,
    "path": `${LoopBackPortB_Path}`,                          
    "pnpId": "",
    "productId": undefined,
    "serialNumber": undefined,
    "vendorId": undefined,
}

export const LoopBackPortsInfo = [LoopBackPortA_Info, LoopBackPortB_Info ]

//

type Consumer = (data: readonly number[]) => void

let portAConsumer:  Consumer | undefined = undefined 
let portBConsumer:  Consumer | undefined = undefined 

export const getPortAOpened = (portSpec: PortSpec):PortOpened => ({
    kind: 'PortOpened',
    portSpec,
    write: async data => {
         await delay(WRITE_DELAY).then( () => {
            if(portBConsumer) portBConsumer(data)
        })
    },
    onData: consumerA => {
        portAConsumer = consumerA
    },
    close: async () => {
        portAConsumer = undefined
    },
    removeAllDataListeners: () => {
        portAConsumer = undefined
    },
    onError: f => {
        // TODO: to be implemented
        throw new Error('Not implemented')
    },
    removeAllErrorListeners: () => {
        // TODO: to be implemented
        throw new Error('Not implemented')
    },
    __unsafeGetConcreteDriver: () => {
        throw new Error('Not implementable')
    }
})


export const getPortBOpened = (portSpec: PortSpec):PortOpened => ({
    kind: 'PortOpened',
    portSpec,
    write: async data => {  
        await delay(WRITE_DELAY).then( () => {
            if(portAConsumer) portAConsumer(data)
        })
    },
    onData: consumerB => {
        portBConsumer = consumerB
    },
    close: async () => {
        portBConsumer = undefined
    },
    removeAllDataListeners: () => {
        portBConsumer = undefined
    },
    onError: f => {
        // TODO: to be implemented
        throw new Error('Not implemented')
    },
    removeAllErrorListeners: () => {
        // TODO: to be implemented
        throw new Error('Not implemented')
    },
    __unsafeGetConcreteDriver: () => {
        throw new Error('Not implementable')
    }
})

//TODO: export only this function and remove exportation of portAOpened and portBOpened variables
export const getLoopBackEmulatedSerialPort = (a: PortSpec, b: PortSpec) => {
    return [ getPortAOpened(a), getPortBOpened(b)] as const
}
