import { Byte } from "../../core/byte"
import { ETX, StartByte, StartByteNum, StartByteToText, StartByteTxt } from "./core-types"


// TODO: Deprecate this function API in favor of calcChecksum_ which receives StartByte as number instead of as text and is more generic
export const calcChecksum = (
    obj: readonly [dirChan: number, waddr: number, dataH: number, dataL: number], 
    startByte: StartByteTxt
    ): number  => {
        const startByte_ = StartByte[startByte]
        const etx = ETX
        const objsum = obj.reduce( (acc, cur) => acc + cur)
        const extra = startByte_ + etx
        const totalsum = objsum + extra
        const contained = totalsum % 256 
        const complimented = 256 - contained
        const adjusted = (complimented === 256) ? 0 : complimented
        // TODO: assure return is in uint8 range
        return adjusted
}

export const calcChecksum_ = (
    obj: readonly Byte[], 
    startByte: StartByteNum
    ): number  => {
        type RequiredCast = Parameters<typeof calcChecksum>[0]
        const startByte_ = StartByteToText(startByte)
        return calcChecksum(obj as RequiredCast, startByte_)
}