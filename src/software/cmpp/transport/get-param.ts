import { bit_test } from "../../core/bit-wise-utils";
import { FrameCore } from "../datalink";
import { DirectionKeys } from "../datalink/core-types";
import { word2int } from "../datalink/int-to-word-conversion";
import { sendCmpp } from "../datalink/send-receive-cmpp-datalink";
import { Tunnel } from "../utils/detect-cmpp";
import { ParamCaster, ParamCaster_16bits, ParamCaster_1bit, ParamCaster_8bits } from "./memmap-caster";




//TODO: Implement ADT API
const get16BitsParam = <T extends string,A>(tunnel: Tunnel, param: ParamCaster_16bits<T,A>):Promise<A> => {
    return new Promise( (resolve,reject) => {
        const { portSpec, channel} = tunnel
        const { type, name, waddr, serialize, deserialize} = param
        const { path, baudRate} = portSpec
        const frame: FrameCore = {
            startByte: 'STX',
            channel,
            direction: 'Solicitacao',
            waddr,
            uint16: 0x00, // indiferent
        }
        sendCmpp(path, baudRate)(frame)
            .then( response => {
                const { dataLow, dataHigh } = response
                const dataH = dataHigh[0]
                const dataL = dataLow[0]
                const uint16 = word2int(dataH, dataL)
                const result = deserialize(uint16)
                resolve(result); 
            })
            .catch( err => {
                throw new Error(err) 
            })
    })
}

//TODO: Should be refactored to reduce code repetition in relation to others functions (ie: set16bits, set8bits, etc)
const get1BitsParam = <T extends string,A>(tunnel: Tunnel, param: ParamCaster_1bit<T,A>): Promise<A> => {
    return new Promise( (resolve,reject) => {
        let direction: DirectionKeys | undefined = undefined
        const { portSpec, channel} = tunnel
        const { type, name, waddr, startBit, serialize, deserialize} = param
        const { path, baudRate} = portSpec
        //
        const frame: FrameCore = {
            startByte: 'STX',
            channel,
            direction: 'Solicitacao',
            waddr,
            uint16: 0x00, // indiferent
        }
        sendCmpp(path, baudRate)(frame)
            .then( response => {
                const { dataLow, dataHigh } = response
                const dataH = dataHigh[0]
                const dataL = dataLow[0]
                const uint16 = word2int(dataH, dataL)
                const bit_ = bit_test(uint16, startBit)
                const bit__ = bit_ === true ? 1 : 0
                const result = deserialize(bit__)
                resolve(result)
            })
            .catch( err => {
                reject(new Error(err)) 
            })
    })
}


const get8BitsParam = <T extends string,A>(tunnel: Tunnel, param: ParamCaster_8bits<T,A>): Promise<A> => {
    return new Promise( (resolve,reject) => {
        //
        const { portSpec, channel} = tunnel
        const { type, name, waddr, startBit, serialize, deserialize} = param
        const { path, baudRate } = portSpec
        //
        if((startBit !== 8) && (startBit !== 0) ) {
            throw new Error('TO BE DONE! bitLenght and startBit is only implemented for [1,0] and [1,8] respectivelly.') 
        } else {
            
            const requestFrame: FrameCore = {
                direction: 'Solicitacao',
                startByte: 'STX',
                channel,
                waddr,
                uint16: 0x00 // indiferent
            }

            sendCmpp(path,baudRate)(requestFrame)
                .then( response => {
                    const { dataLow, dataHigh } = response
                    const dataL = dataLow[0]
                    const dataH = dataHigh[0]
                    const uint8 = startBit === 0 ? dataL : dataH 
                    const result = deserialize(uint8)
                    resolve(result)
                })
                .catch( err => {
                    reject(new Error(err))
                })


        }
     
    }
)}


export const getCmppParam = <T extends string,A>(tunnel: Tunnel, param: ParamCaster<T,A>): Promise<A> => {

    //TODO: Discovery why I need to divede waddr by two !!
    const param_adjusted = {...param, waddr: param.waddr/2} 

    switch (param_adjusted.type) {
        case '16 Bits': return get16BitsParam(tunnel, param_adjusted)
        case '8 Bits': return get8BitsParam(tunnel, param_adjusted)
        case '1 Bit': return get1BitsParam(tunnel, param_adjusted)
        default: {
            //TODO: Make this switch case statically exaustive
            throw new Error('This error should never happens: Non exaustive switch case clause. Cmpp communication/memmap context')
        }
    }

} 