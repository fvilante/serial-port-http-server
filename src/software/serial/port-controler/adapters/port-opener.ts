// NOTE: This module is just a wrapper over the real concrete nodejs serial port module.
//       see also: https://serialport.io/docs/guide-usage

import { PortOpened, portOpener_CB, PortSpec } from "../main/port-opener-cb"

// LEGACY CODE - Very little of the code structure depdends on this function.
//TODO: Deprecate this function, use PortOpener_CB which is the callback API version of this function
//TODO: New problem detect: The promise must be invoked at the onEnd event, because it is assured every resources are cleaned up 
export const portOpener = (spec: PortSpec):Promise<PortOpened> => {
  return new Promise( (resolve, reject) => {
    portOpener_CB(spec, {
      onSuccess: portOpened => {
        resolve(portOpened)
      },
      onError: error => {
        reject(error) //NOTE: The type of this error is well defined
      }
    })
  })
}



