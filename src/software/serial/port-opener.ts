// NOTE: This module is just a wrapper over the real concrete nodejs serial port module.
//       see also: https://serialport.io/docs/guide-usage

import { PortOpened, portOpener_CB, PortSpec } from "./port-opener-cb"

//TODO: Deprecate this function, use PortOpener_CB which is the callback API version of this function
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



