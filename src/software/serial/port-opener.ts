// NOTE: This module is just a wrapper over the real concrete nodejs serial port module.
//       see also: https://serialport.io/docs/guide-usage
import { BaudRate } from './baudrate'
import SerialPort  from 'serialport'
import { PortInfo } from './port-info'
import { LoopBackPortA_Path, LoopBackPortB_Path, portAOpened, portBOpened } from './loopback'

export type ErrorEvent = any //TODO: improve this error event type

export type PortOpened = {
  readonly kind: 'PortOpened'
  readonly write: (data: readonly number[]) => Promise<void> //fix: ??? change to Promise<number> where number is the amount of bytes written ???
  readonly onData: (f: (data: readonly number[]) => void) => void
  readonly close: () => Promise<void>
  readonly removeOnDataListener: (f: (data: readonly number[]) => void) => void
  // for more about error handling see: https://github.com/serialport/node-serialport/issues/177
  readonly onError: (f: (error: ErrorEvent) => void) => void
  readonly removeOnErrorListener: (f: (error: ErrorEvent) => void) => void
  //TODO: This add/remove listener API should be improved with something like this: getListener().add(f).remove(f), but I'm not sure it worth it. 
  //CAUTION: below unsafe call is intended to use in tests, please avoid use it for production purposes
  readonly __unsafeGetConcreteDriver: () => SerialPort
  }

//TODO: Ensures that if the port is not open the all errors goes through the promise .catch method
export type PortOpener = (path: PortInfo['path'], baudRate: BaudRate) => Promise<PortOpened>

//

export const PortOpener: PortOpener = (portPath, baudRate) => {

    const castToLocalInterface = (portOpened: SerialPort): PortOpened => {

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
        portOpened.on('data', (buffer: Buffer) => f(buffer.toJSON().data) );
      }
  
      const close: PortOpened['close'] = () => new Promise( (resolve, reject) => {
        portOpened.close( err => {
          if (err) {
            reject(new Error(`SerialPortCloseError: Cannot close serial port ${portPath}/${baudRate}. Details: ${err}.`)) 
          }
          resolve(undefined)
        });
      })

      const removeOnDataListener: PortOpened['removeOnDataListener'] = f => {
        portOpened.removeListener('data', f);
      }

      const onError: PortOpened['onError'] = f => {
        portOpened.on('error', f)
      }

      const removeOnErrorListener: PortOpened['removeOnErrorListener'] = f => {
        portOpened.removeListener('error', f)
      }

      const __unsafeGetConcreteDriver: PortOpened['__unsafeGetConcreteDriver'] = () => {
        return portOpened;
      }
  
      return {
        kind: 'PortOpened',
        write,
        onData,
        close,
        removeOnDataListener,
        onError,
        removeOnErrorListener,
        __unsafeGetConcreteDriver,
      }
    }

    const openPortUsingDriver = () => new Promise<SerialPort>( (resolve, reject) => { 
      //see also: https://serialport.io/docs/guide-usage  
      
      const cleanUpResources = () => {
        port.removeListener('error', onError)
        port.removeListener('open', onSuccess)
      }

      const onError = (error: Error) => {
        cleanUpResources();
        reject(error)
      }

      const onSuccess = () => {
        cleanUpResources();
        resolve(port)
      }

      const port = new SerialPort(portPath, { baudRate }, hasError => {
        if (hasError) {
          const error = new Error(`SerialOpenPortError: Cannot open port ${portPath}/${baudRate}. Details: ${hasError}.`)
          onError(error)
        }
      })

      port.on('open', onSuccess)
      port.on('error', onError)

    }).then( castToLocalInterface )

    const loopBack_PortA = () => new Promise<PortOpened>( resolve => resolve(portAOpened))
    const loopBack_PortB = () => new Promise<PortOpened>( resolve => resolve(portBOpened))

    switch (portPath) {
      case LoopBackPortA_Path:
        return loopBack_PortA()
      case LoopBackPortB_Path:
        return loopBack_PortB()
      default: 
        return openPortUsingDriver()
    }
}



