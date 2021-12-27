import { getCmppParam } from "./get-param"
import { setCmppParam } from "./set-param"
import { ParamCaster } from "./memmap-caster"
import { Tunnel } from "../datalink/core/tunnel"

export type THE_API = {
    readonly [K in string]: ParamCaster<string,any>
}

// TODO: Probably this types facilities can be generalized and extracted
type GetKeysOfAPI<X extends THE_API> = keyof X
type GetValueFromAPI<X extends THE_API, K extends keyof X> = Parameters<X[K]['serialize']>[0]
//example:
//type A = GetValueFromAPI<typeof api, 'Posicao final'>

export const setCmppParam_Beaulty = 
    <X extends THE_API>(api: X) => 
    (tunnel: Tunnel) => 
    <K extends GetKeysOfAPI<X>>(key: K, value: GetValueFromAPI<X,K>): Promise<void> => {
        const param = api[key]
        return setCmppParam(tunnel, param, value)

}

export const getCmppParam_Beaulty = 
    <X extends THE_API>(api: X) => 
    (tunnel: Tunnel) => 
    <K extends GetKeysOfAPI<X>>(key: K ): Promise<GetValueFromAPI<X,K>> => {
        const param = api[key]
        return getCmppParam(tunnel, param)

}


// Helper function to set and get data from a cmpp tunnel in a casted and typesafe way
export const makeSettersAndGettersFromCmppAPI = <X extends THE_API>(api: X) => {
    return {
        set: (tunnel: Tunnel) => setCmppParam_Beaulty(api)(tunnel),
        get: (tunnel: Tunnel) => getCmppParam_Beaulty(api)(tunnel),
    }
}

