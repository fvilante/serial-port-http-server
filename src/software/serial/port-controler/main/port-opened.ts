import SerialPort from "serialport";
import { PortOpenError } from "./errors-types";
import { alreadyOpened, removeAllListenersFromPort } from "./port-opener-cb";
import { PortSpec } from "../../core/port-spec";


export type PortOpened = {
    readonly kind: 'PortOpened'
    readonly portSpec: PortSpec
    readonly write: (data: readonly number[]) => Promise<void> //fix: ??? change to Promise<number> where number is the amount of bytes written ???
    readonly onData: (f: (data: readonly number[]) => void) => void
    readonly close: () => Promise<void>
    readonly removeAllDataListeners: () => void
    // for more about error handling see: https://github.com/serialport/node-serialport/issues/177
    readonly onError: (f: (error: PortOpenError) => void) => void
    readonly removeAllErrorListeners: () => void
    //TODO: This add/remove listener API should be improved with something like this: getListener().add(f).remove(f), but I'm not sure it worth to do it now. 
    //CAUTION: below unsafe call is intended to use in tests, please avoid use it for production purposes
    readonly __unsafeGetConcreteDriver: () => SerialPort //TODO: remove this from interface to avoid cause dependency
}



export const castToLocalInterface = (portSpec: PortSpec, portOpened: SerialPort): PortOpened => {

    const { path, baudRate} = portSpec
  
    const write: PortOpened['write'] = data => new Promise( (resolve, reject) => {
      const data_ = [...data]
      portOpened.write(data_, (hasError, bytesWritten) => {
        if (hasError) {
          reject(new Error(`SerialPortWriteError: "${hasError}", ${bytesWritten} have been written.`))
        }
        resolve();
      });
    })
  
    const onData: PortOpened['onData'] = f => {
      // NOTE: passing the original 'buffer' type may be more time eficient and maybe be implemented in future
      portOpened.on('data', (buffer: Buffer) => {
        const data = buffer.toJSON().data
        f(data) 
      });
    }
  
    const close: PortOpened['close'] = () => new Promise( (resolve, reject) => {
      // validate
      //TODO: Refactor Extract this logic of protection
      //TODO: Improve error mechanism, avoid throwing
      if(alreadyOpened.has(path)) {
        alreadyOpened.delete(path)
      } else {
        const msg = `Tentativa de fechar uma porta que nao esta aberta ou nãofoi aberta pela rotina oficial. Porta=${path}`
        console.log(`######################################### ${msg} `)
        throw new Error(msg)
      }
      // action
      removeAllListenersFromPort(portOpened)
      portOpened.close( err => {
        if (err) {
          reject(new Error(`SerialPortCloseError: Cannot close serial port ${path}/${baudRate}. Details: ${err}.`)) 
        }
        resolve(undefined)
      });
    })
  
    const removeAllDataListeners: PortOpened['removeAllDataListeners'] = () => {
      try {
        portOpened.removeAllListeners('data');
      } catch {
        // TODO: check if delete nothing should rise an error, this try catch is an attepmt to prevent this kind of error
      }
    }
  
    const onError: PortOpened['onError'] = f => {
      portOpened.on('error', f)
    }
  
    const removeAllErrorListeners: PortOpened['removeAllErrorListeners'] = () => {
      try {
        portOpened.removeAllListeners('error');
      } catch {
        // TODO: check if delete nothing should rise an error, this try catch is an attepmt to prevent this kind of error
      }
    }
  
    const __unsafeGetConcreteDriver: PortOpened['__unsafeGetConcreteDriver'] = () => {
      return portOpened;
    }
  
    return {
      kind: 'PortOpened',
      portSpec,
      write,
      onData,
      close,
      removeAllDataListeners,
      onError,
      removeAllErrorListeners,
      __unsafeGetConcreteDriver,
    }
  }