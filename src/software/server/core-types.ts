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