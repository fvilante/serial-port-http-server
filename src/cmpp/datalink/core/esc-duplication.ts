import { Byte } from "../../../core/byte"
import { ESC } from "./core-types"

//TODO: Maybe use iterable instead of array
export const duplicateEscIfNecessary = (payload: readonly number[]): readonly number[] => {
    let acc: readonly Byte[] = [] //payload_with_esc_duplicated
    payload.forEach( byte => {
        if (byte===ESC) {
            acc = [...acc, ESC, ESC]
        } else {
            acc = [...acc, byte]
        }
    }) 
    return acc 
}