import { FrameCore } from "../datalink";
import { DirectionKeys } from "../datalink/core-types";
import { word2int } from "../datalink/int-to-word-conversion";
import { sendCmpp } from "../datalink/send-receive-cmpp-datalink";
import { Tunnel } from "../datalink/tunnel";
import { ParamCaster, ParamCaster_16bits, ParamCaster_1bit, ParamCaster_8bits } from "./memmap-caster";


//TODO: Implement ADT API
const set16BitsParam = <T extends string,A>(tunnel: Tunnel, param: ParamCaster_16bits<T,A>, value:A):Promise<void> => {
    return new Promise<void>( (resolve,reject) => {
        const { portSpec, channel} = tunnel
        const { type, name, waddr, serialize, deserialize} = param
        const { path, baudRate} = portSpec
        const uint16 = serialize(value) 
        const frame: FrameCore = {
            startByte: 'STX',
            channel,
            direction: 'Envio',
            waddr,
            uint16,
        }
        sendCmpp(path, baudRate)(frame)
            .then( frameInterpreted => {
                resolve(); //TODO: This frame contains important cmpp-status which would be cached instead of trashed
            })
            .catch( err => {
                throw new Error(err) 
            })
    })
}

//TODO: Should be refactored to reduce code repetition in relation to others functions (ie: set16bits, set8bits, etc)
const set1BitsParam = <T extends string,A>(tunnel: Tunnel, param: ParamCaster_1bit<T,A>, value:A):Promise<void> => {
    return new Promise<void>( (resolve,reject) => {
        let direction: DirectionKeys | undefined = undefined
        const { portSpec, channel} = tunnel
        const { type, name, waddr, startBit, serialize, deserialize} = param
        const { path, baudRate} = portSpec
        //
        const bit = serialize(value) 
        switch(bit) {
            case 1: { direction='MascaraParaSetar';break; }
            case 0: { direction='MascaraParaResetar'; break;}
            default:
                //TODO: Statically exhaust the switch case
                throw new Error('Unexpected case in switch case')
        }
        const bitmask = 1 << startBit
        const frame: FrameCore = {
            startByte: 'STX',
            channel,
            direction,
            waddr,
            uint16: bitmask,
        }
        sendCmpp(path, baudRate)(frame)
            .then( frameInterpreted => {
                resolve(); //TODO: This frame contains important cmpp-status which would be cached instead of trashed
            })
            .catch( err => {
                throw new Error(err) 
            })
    })
}


const set8BitsParam = <T extends string,A>(tunnel: Tunnel, param: ParamCaster_8bits<T,A>, value:A): Promise<void> => {
    return new Promise<void>( (resolve,reject) => {
        //
        const { portSpec, channel} = tunnel
        const { type, name, waddr, startBit, serialize, deserialize} = param
        const { path, baudRate } = portSpec
        //
        if((startBit !== 8) && (startBit !== 0) ) {
            throw new Error('TO BE DONE! bitLenght and startBit is only implemented for [1,0] and [1,8] respectivelly.') 
        } else {
            // NOTE: There is no ortogonal function to send 8 bits. So we will request a word from cmpp, change it locally and retransmit data
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
                    const currentDataLow = dataLow[0]
                    const currentDataHigh = dataHigh[0]
                    const theUint8 = serialize(value)
                    const newDataLow = startBit===0 ? theUint8 : currentDataLow
                    const newDataHigh = startBit===8 ? theUint8 : currentDataHigh
                    const newUint16 = word2int(newDataHigh, newDataLow)
                    
                    const finalFrame: FrameCore = {
                        ...requestFrame,
                        direction: 'Envio',
                        uint16: newUint16,
                    }

                    sendCmpp(path, baudRate)(finalFrame)
                        .then( response => {
                            //TODO: This frame contains important cmpp-status which would be cached instead of trashed
                            resolve()  
                        })
                        .catch( err => {
                            reject(new Error(err))
                        })
                })
                .catch( err => {
                    reject(new Error(err))
                })


        }
     
    }
)}

//TODO: Change return type to return anything more useful
export const setCmppParam = <T extends string,A>(tunnel: Tunnel, param: ParamCaster<T,A>, value:A):Promise<void> => {

    //TODO: Discovery why the hell I need to divede waddr by two !!
    const param_adjusted = {...param, waddr: param.waddr/2}

    switch (param_adjusted.type) {
        case '16 Bits': return set16BitsParam(tunnel, param_adjusted,value)
        case '8 Bits': return set8BitsParam(tunnel, param_adjusted,value)
        case '1 Bit': return set1BitsParam(tunnel, param_adjusted,value)
        default: {
            //TODO: Make this switch case statically exaustive
            throw new Error('This error should never happens: Non exaustive switch case clause. Cmpp communication/memmap context')
        }
    }

} 
