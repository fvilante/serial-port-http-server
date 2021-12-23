type UUID = string

type HSV = number

export type Metadata = {
    id: UUID;
    color: HSV;
}


export type CursorPosition = {
    x: number
    y: number
}

export type Response = {
    sender: UUID
    color: HSV
} & CursorPosition


//

export type StartEvent = { kind: 'StartEvent', payload: void }
export type StopEvent = { kind: 'StopEvent', payload: void}
export type ForceReferenceEvent = { kind: 'ForceReferenceEvent', payload: void }

const foo = ():string => 'foo'