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
  readonly removeAllDataListeners: () => void
  // for more about error handling see: https://github.com/serialport/node-serialport/issues/177
  readonly onError: (f: (error: PortOpenError) => void) => void
  readonly removeAllErrorListeners: () => void
  //TODO: This add/remove listener API should be improved with something like this: getListener().add(f).remove(f), but I'm not sure it worth to do it now. 
  //CAUTION: below unsafe call is intended to use in tests, please avoid use it for production purposes
  readonly __unsafeGetConcreteDriver: () => SerialPort //TODO: remove this from interface to avoid cause dependency
}

export type AccessDenied = {
  errorKind: 'Access denied'    // ie: when port is already open by other proccess
  //TODO: substitute below to 'PortSpec' instead
  portSpec: PortSpec  
  detail: Error
}

export type FileNotFound = {
  errorKind: 'File not found'   // ie: when the portPath cannot be located
  portSpec: PortSpec  
  detail: Error
}

//TODO: This type should be generalized to be used in any case scenario, or we should rename this type to "UnknownPortOpenError"
export type UnknownError = {
  errorKind: 'Unknown error'   // if none of cases above apply. Note: Should never occur, but I cannot garantee
  portSpec?: PortSpec  
  detail: Error | unknown  // TODO: Remove this unknown type if possible, it is here because I'm 95% certain it's a Error type and 5% it may be other thing else. But type unknown absorbs all other types
}

export type PortOpenError = AccessDenied | FileNotFound | UnknownError

const removeAllListenersFromPort = (port: SerialPort): void => {
    //port.removeListener('error', onError)
    //port.removeListener('open', onSuccess)
    //TODO: Up-above-two lines is not working in pratice, so below lines are required
    //      In future test/check this better!
    port.removeAllListeners('open') // not fully tested but probably works
    port.removeAllListeners('error') // not fully tested but probably works
    port.removeAllListeners('data') // NOTE: This is the line that certainly works in pratice tests
    port.removeAllListeners() // NOTE: This is the line that certainly works in pratice tests (but it may be a unnecessary huge removal)
}

const openPortUsingDriver = (portPath: PortInfo['path'], baudRate: BaudRate) => new Promise<SerialPort>( (resolve, reject) => { 
  //see also: https://serialport.io/docs/guide-usage  
  
  const port = new SerialPort(portPath, { baudRate }, hasError => {
    if (hasError) {
      const error = new Error(`SerialOpenPortError: Cannot open port ${portPath}/${baudRate}. Details: ${hasError}.`)
      onError(error)
    }
  })

  const cleanUpResources = () => {
    removeAllListenersFromPort(port)
  }

  const onError = (error: Error) => {
    cleanUpResources();
    reject(error)
  }

  const onSuccess = () => {
    cleanUpResources();
    resolve(port)
  }

  
  port.on('open', onSuccess)
  port.on('error', onError)

})

const castToLocalInterface = (portSpec: PortSpec, portOpened: SerialPort): PortOpened => {

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
    portOpened.on('data', (buffer: Buffer) => f(buffer.toJSON().data) );
  }

  const close: PortOpened['close'] = () => new Promise( (resolve, reject) => {
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
    write,
    onData,
    close,
    removeAllDataListeners,
    onError,
    removeAllErrorListeners,
    __unsafeGetConcreteDriver,
  }
}


//TODO: Implement unit test for this feature, 
const castPortOpenError = (portSpec: PortSpec, error: unknown): PortOpenError => {
  //TODO: I'm using the rethrow technique but should be better to implement the error on the return type (ie: using ADT, etc)
  const str = String(error)
  const etc = { portSpec, detail: error as any} // TODO: remove this any type cast if possible
  if (str) {
    const str_ = str.toLowerCase()
    if (str_.includes('access denied')) {
      return {
        errorKind: 'Access denied',
        ...etc,
      }
    } else if (str_.includes('file not found')) {
      return {
        errorKind: 'File not found',
        ...etc,
      }
    } else {
      return {
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

//TODO: In future make it a Validated<string> or something similar.
export type PortPath = string // ie: 'com1', 'com2', etc...

export type PortSpec = {
  readonly path: PortPath 
  readonly baudRate: BaudRate  
}

//NOTE: Either, or success, or error; not both at same time.
export type EventHandler = {
  onSuccess: (portOpened: PortOpened, portSpec: PortSpec) => void
  onError: (error: PortOpenError, portSpec: PortSpec) => void
}

//TODO:  deprecate the current 'portOpener' and rename this function to 'portOpener' and
export const portOpener_CB = (portSpec: PortSpec, handler: EventHandler): void => {

  const { path, baudRate} = portSpec

  const run = () => {

    const loopBack_PortA = () => new Promise<PortOpened>( resolve => resolve(portAOpened))
    const loopBack_PortB = () => new Promise<PortOpened>( resolve => resolve(portBOpened))

    const emitPortOpenedEvent = (p: PortOpened) => { 
      handler.onSuccess(p, portSpec)
    }

    const emitErrorEvent = (err_: unknown) => {
      const err = castPortOpenError(portSpec, err_)
      handler.onError(err, portSpec)
    }

    //NOTE: This cast is intended to encapsulate from the client perspective internal details
    const castSerialPort = (p: SerialPort) => {
      return castToLocalInterface(portSpec, p)
    }


    //main code
    switch (path) {
      case LoopBackPortA_Path:
        loopBack_PortA().then(emitPortOpenedEvent)
        break;
      case LoopBackPortB_Path:
        loopBack_PortB().then(emitPortOpenedEvent)
        break
      default: 
        openPortUsingDriver(path,baudRate)
          .then(castSerialPort)
          .then(emitPortOpenedEvent)
          .catch(emitErrorEvent)
    }
  }

  //execute
  try {
    run()
  } catch (err) {
    const err_: UnknownError = {
      errorKind: 'Unknown error',
      portSpec,
      detail: err,
    }
    handler.onError(err_, portSpec)
  }
  
  
}



