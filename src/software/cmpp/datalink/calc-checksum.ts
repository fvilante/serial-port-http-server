import { ETX, StartByte, StartByteTxt } from "./core-types"

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
        // fix: assure return is in uint8 range
        return adjusted
}