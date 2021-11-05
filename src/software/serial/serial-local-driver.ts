import { BaudRate } from './baudrate'
import SerialPort  from 'serialport'


/**
 * Serial Driver - 
 *   Abstract
 */


export type PortInfo = {
    readonly uid: string; // port path (exemple in linux: '/dev/tty-usbserial1', or in windows: 'COM6')
    readonly manufacturer?: string;
    readonly serialNumber?: string;
    readonly pnpId?: string;
    readonly locationId?: string;
    readonly productId?: string;
    readonly vendorId?: string;
}

export type PortOpened = {
    readonly kind: 'PortOpened'
    readonly write: (data: readonly number[]) => Promise<void>
    readonly onData: (f: (data: readonly number[]) => void) => void
    readonly close: () => Promise<void>
}

export type SerialDriver = {
  readonly listPorts: () => Promise<readonly PortInfo[]>
  readonly open: (uid: PortInfo['uid'], baudRate: BaudRate) => Promise<PortOpened>
}

export type SerialDriverConstructor = () => SerialDriver


/**
 * Serial Driver - Concrete
 */

export const SerialDriverConstructor: SerialDriverConstructor = () =>  {
  
  const listPorts: SerialDriver['listPorts'] =  () =>  {
    const list = SerialPort.list();
    const portsInfo: Promise<readonly PortInfo[]> = list.then( y => y.map( x => ({ uid: x.path, ...x })));
    return portsInfo;
  }

  const open: SerialDriver['open'] = (uid, baudRate) => {

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
        const port = new SerialPort(uid, { baudRate } )
        port.on('open', () => resolve(port))
        port.on('error', err => reject(err))
      })
        .then( introduceLocalInterface );

    return portOpened;
  }

  return {
    listPorts,
    open,
  }

}
