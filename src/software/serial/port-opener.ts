// NOTE: This module is just a wrapper over the real concrete nodejs serial port module.
//       see also: https://serialport.io/docs/guide-usage
import { BaudRate } from './baudrate'
import SerialPort  from 'serialport'
import { PortInfo } from './port-info'
import { LoopBackPortA_Path, LoopBackPortB_Path, portAOpened, portBOpened } from './loopback'


export type OpenedErrorEvent = undefined

export type PortOpened = {
  readonly kind: 'PortOpened'
  readonly write: (data: readonly number[]) => Promise<void> //fix: ??? change to Promise<number> where number is the amount of bytes written ???
  readonly onData: (f: (data: readonly number[]) => void) => void
  readonly close: () => Promise<void>
  readonly removeOnDataListener: (f: (data: readonly number[]) => void) => void
  // for more about error handling see: https://github.com/serialport/node-serialport/issues/177
  readonly onError: (f: (error: PortOpenError) => void) => void
  readonly removeOnErrorListener: (f: (error: PortOpenError) => void) => void
  //TODO: This add/remove listener API should be improved with something like this: getListener().add(f).remove(f), but I'm not sure it worth it. 
  //CAUTION: below unsafe call is intended to use in tests, please avoid use it for production purposes
  readonly __unsafeGetConcreteDriver: () => SerialPort
}


export type AccessDenied = {
  errorKind: 'Access denied'    // ie: when port is already open by other proccess
  portPath: string
  baudRate: BaudRate
  detail: Error
}

export type FileNotFound = {
  errorKind: 'File not found'   // ie: when the portPath cannot be located
  portPath: string
  baudRate: BaudRate
  detail: Error
}

export type UnknownError = {
  errorKind: 'Unknown error'   // if none of cases above apply. Note: Should never occur, but I cannot garantee
  portPath: string
  baudRate: BaudRate
  detail: Error | unknown  // TODO: Remove this unknown type if possible, it is here because I'm 95% certain it's a Error type and 5% it may be other thing else. But type unknown absorbs all other types
}

export type PortOpenError = AccessDenied | FileNotFound | UnknownError


const openPortUsingDriver = (portPath: PortInfo['path'], baudRate: BaudRate) => new Promise<SerialPort>( (resolve, reject) => { 
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

})

const castToLocalInterface = (portPath: PortInfo['path'], baudRate: BaudRate, portOpened: SerialPort): PortOpened => {

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


//TODO: Transmiting error types through throwing is not something I consider safe, solve this when possible.
//      the problem of using throws to communicate errors is that when you Catch an error you need to manually annotate the type and this is error prone, the advantage is that that semantic is native to the language. I prefer some solution ADT-like, see Result ADT in repo for more.
//      When can also use simple  callback event handlers to communicate errors
//TODO: Implement unit test for this feature, //NOTE: At run-time the PortOpenError object was tested and is working
const castPortOpenError = (portPath: PortInfo['path'], baudRate: BaudRate, error: unknown): never /*PortOpenError*/ => {
  //TODO: I'm using the rethrow technique but should be better to implement the error on the return type (ie: using ADT, etc)
  const str = String(error)
  const etc = { portPath, baudRate, detail: error as any} // TODO: remove this any type cast if possible
  if (str) {
    const str_ = str.toLowerCase()
    if (str_.includes('access denied')) {
      throw {
        errorKind: 'Access denied',
        ...etc,
      }
    } else if (str_.includes('file not found')) {
      throw {
        errorKind: 'File not found',
        ...etc,
      }
    } else {
      throw {
        errorKind: 'Unknown error',
        ...etc,
      }
    }
  } else {
    throw {
      errorKind: 'File not found',
      ...etc,
    }
  }
  
}

export type PortOpener = (path: PortInfo['path'], baudRate: BaudRate) => Promise<PortOpened>

//TODO: Ensures that if the port is not open the all errors goes through the promise .catch method
// if it throws then emit a casted 'OpenErrorEvent'
export const PortOpener = (portPath: PortInfo['path'], baudRate: BaudRate):Promise<PortOpened> => {

    const loopBack_PortA = () => new Promise<PortOpened>( resolve => resolve(portAOpened))
    const loopBack_PortB = () => new Promise<PortOpened>( resolve => resolve(portBOpened))

    switch (portPath) {
      case LoopBackPortA_Path:
        return loopBack_PortA()
      case LoopBackPortB_Path:
        return loopBack_PortB()
      default: 
        return openPortUsingDriver(portPath,baudRate)
                .then( port => castToLocalInterface(portPath,baudRate, port) )
                .catch( err => castPortOpenError(portPath,baudRate, err) )
    }
}



