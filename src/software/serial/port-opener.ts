// NOTE: This module is just a wrapper over the real concrete nodejs serial port module.
//       see also: https://serialport.io/docs/guide-usage
import { BaudRate } from './baudrate'
import SerialPort  from 'serialport'
import { PortInfo } from './port-info'
import { LoopBackPortA_Path, LoopBackPortB_Path, portAOpened, portBOpened } from './loopback'

export type PortOpened = {
    readonly kind: 'PortOpened'
    readonly write: (data: readonly number[]) => Promise<void> //fix: ??? change to Promise<number> where number is the amount of bytes written ???
    readonly onData: (f: (data: readonly number[]) => void) => void
    readonly close: () => Promise<void>
}

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
        // NOTE: pass the original buffer may be more time eficient. Maybe be implemented on future
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
  
      return {
        kind: 'PortOpened',
        write,
        onData,
        close,
      }
    }

    const openPortUsingDriver = () => new Promise<SerialPort>( (resolve, reject) => { 
      //see also: https://serialport.io/docs/guide-usage  
      const port = new SerialPort(portPath, { baudRate }, hasError => {
        if (hasError) {
          reject(new Error(`SerialOpenPortError: Cannot open port ${portPath}/${baudRate}. Details: ${hasError}.`))
        }
      })
      port.on('open', () => resolve(port))   
    })
      .then( castToLocalInterface );

    const loopBack_PortA = new Promise<PortOpened>( resolve => resolve(portAOpened))
    const loopBack_PortB = new Promise<PortOpened>( resolve => resolve(portBOpened))

    switch (portPath) {
      case LoopBackPortA_Path:
        return loopBack_PortA
      case LoopBackPortB_Path:
        return loopBack_PortB
      default: 
        return openPortUsingDriver()
    }
}



