type UUID = string

type HSV = number

export type ClientMetadata = {
    id: UUID;
    color: HSV;
}


export type CursorPositionClientEvent = {
    x: number
    y: number
}

export type CursorPositionServerEvent = {
    kind: 'CursorPositionServerEvent'
    sender: UUID
    color: HSV
} & CursorPositionClientEvent

export type ServerEvent = CursorPositionServerEvent

//

export type StartEvent = { kind: 'StartEvent', payload: void }
export type StopEvent = { kind: 'StopEvent', payload: void}
export type ForceReferenceEvent = { kind: 'ForceReferenceEvent', payload: void }

const foo = ():string => 'foo'