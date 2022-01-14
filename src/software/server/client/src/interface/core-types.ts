type UUID = string

type HSV = number

export type ClientMetadata = {
    id: UUID;
    color: HSV;
}


export type CursorPositionClientEvent = {
    kind: 'CursorPositionClientEvent'
    x: number
    y: number
}

export type MachineGotoClientEvent = {
    kind: 'MachineGotoClientEvent'
    x: number,
    y: number,
    z: number,
}

export type MachineStopClientEvent = {
    kind: 'MachineStopClientEvent'
}

export type MachineInitializeClientEvent = {
    kind: 'MachineInitializeClientEvent'
}

export type PlayNoteClientEvent = {
    kind: 'PlayNoteClientEvent'
    duration: number
    frequency: number
}


export type ClientEvent = 
    | CursorPositionClientEvent 
    | MachineGotoClientEvent 
    | MachineInitializeClientEvent 
    | MachineStopClientEvent
    | PlayNoteClientEvent

export type CursorPositionServerEvent = {
    kind: 'CursorPositionServerEvent'
    sender: UUID
    color: HSV
    x: number
    y: number
} 

export type ReadyStateServerEvent = {
    kind: 'ReadyStateServerEvent'
    isReady: boolean
}

export type ServerEvent = 
    | CursorPositionServerEvent
    | ReadyStateServerEvent

//

export type StartEvent = { kind: 'StartEvent', payload: void }
export type StopEvent = { kind: 'StopEvent', payload: void}
export type ForceReferenceEvent = { kind: 'ForceReferenceEvent', payload: void }

const foo = ():string => 'foo'