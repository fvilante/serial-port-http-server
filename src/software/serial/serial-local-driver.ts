import { BaudRate } from './baudrate'
import SerialPort  from 'serialport'
import { PortInfo } from './port-info'

// NOTE
//  This module is just a wrapper over the real concrete nodejs serial port module.


/**
 * Serial Driver - 
 *   Abstract
 */

export type PortOpened = {
    readonly kind: 'PortOpened'
    readonly write: (data: readonly number[]) => Promise<void>
    readonly onData: (f: (data: readonly number[]) => void) => void
    readonly close: () => Promise<void>
}

export type PortOpener = (path: PortInfo['path'], baudRate: BaudRate) => Promise<PortOpened>


/**
 * Serial Driver - Concrete
 */

export const PortOpener: PortOpener = (path, baudRate) => {

    const introduceLocalInterface = (portOpened: SerialPort): PortOpened => {

      const write: PortOpened['write'] = data => new Promise( (resolve, reject) => {
        portOpened.write([...data], err => reject(err));
        resolve();
      })
  
      const onData: PortOpened['onData'] = f => {
        // note: pass the original buffer may be more time eficient. Maybe be implemented on future
        portOpened.on('data', (data: Buffer) => f(data.toJSON().data) );
      }
  
      const close: PortOpened['close'] = () => new Promise( (resolve, reject) => {
        portOpened.close( err => {
          if (err===undefined || err===null) {
            resolve(undefined)
          } else {
            reject(err) 
          }
        });
      })
  
      return {
        kind: 'PortOpened',
        write,
        onData,
        close,
      }
    }

    const portOpened = new Promise<SerialPort>( (resolve, reject) => { 
        const port = new SerialPort(path, { baudRate } )
        port.on('open', () => resolve(port))
        port.on('error', err => reject(err))
      })
        .then( introduceLocalInterface );

    return portOpened;
}



