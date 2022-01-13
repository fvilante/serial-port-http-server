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


export type ClientEvent = CursorPositionClientEvent | MachineGotoClientEvent

export type CursorPositionServerEvent = {
    kind: 'CursorPositionServerEvent'
    sender: UUID
    color: HSV
    x: number
    y: number
} 

export type ServerEvent = CursorPositionServerEvent

//

export type StartEvent = { kind: 'StartEvent', payload: void }
export type StopEvent = { kind: 'StopEvent', payload: void}
export type ForceReferenceEvent = { kind: 'ForceReferenceEvent', payload: void }

const foo = ():string => 'foo'