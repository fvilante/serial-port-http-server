// Emulates a serialport loopback where PortA is connected (cross-over) to PortB and vice-versa 

import { PortOpened } from "./port-opener"

export const LoopBackPortA_Path = 'LoopBackTest_PortA' //TODO: rename by a more meneumonic name
export const LoopBackPortB_Path = 'LoopBackTest_PortB'


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

export const portAOpened:PortOpened = {
    kind: 'PortOpened',
    write: async data => {
        if(portBConsumer) portBConsumer(data)
    },
    onData: consumerA => {
        portAConsumer = consumerA
    },
    close: async () => {
        portAConsumer = undefined
    },
}


export const portBOpened:PortOpened = {
    kind: 'PortOpened',
    write: async data => {
        if(portAConsumer) portAConsumer(data)
    },
    onData: consumerB => {
        portBConsumer = consumerB
    },
    close: async () => {
        portBConsumer = undefined
    },
}
