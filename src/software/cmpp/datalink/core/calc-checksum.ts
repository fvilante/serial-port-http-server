import { Byte } from "../../../core/byte"
import { ETX, StartByteNum } from "../core-types"
import { Payload, PayloadCore } from "../payload"

// NOTE:
//
//      This checksum calculation is agnostic of the data length. It can calculate checksum
//      for any arbitrary length of data, and not only just cmpp payloads.
//      It depends only on a "[StartbyteNum, obj, ETX]" protocol
//

export const calcChecksumGeneric = (
    obj: readonly Byte[], //NOTE: should not contain the ESC_Duplicated byte 
    startByte: StartByteNum
    ): number  => {
        const objsum = obj.reduce( (acc, cur) => acc + cur)
        const extra = startByte + ETX
        const totalsum = objsum + extra
        const contained = totalsum % 256 
        const complimented = 256 - contained
        const adjusted = (complimented === 256) ? 0 : complimented
        // TODO: assure return is in uint8 range
        return adjusted
}

export const calcChecksum = (data: PayloadCore): number  => {
       return calcChecksumGeneric(data.payload, data.startByte)
}