// NOTE: This module is just a wrapper over the real concrete nodejs serial port module.
//       see also: https://serialport.io/docs/guide-usage
import { BaudRate } from '../../core/baudrate'
import SerialPort  from 'serialport'
import { PortInfo } from '../../core/port-info'
import { LoopBackPortA_Path, LoopBackPortB_Path, portAOpened, portBOpened } from '../loopback/loopback'
import { AccessDenied, castPortOpenError, FileNotFound, PortOpenError, UnknownError } from './errors-types'
import { castToLocalInterface, PortOpened } from './port-opened'
import { PortSpec } from '../../core/port-spec'

//TODO: Refactor Extract this logic of protection
export const alreadyOpened = new Set() // registers already opened port to prevent open same port twice

export type OpenedErrorEvent = undefined

export const removeAllListenersFromPort = (port: SerialPort): void => {
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




//NOTE: Either, or success, or error; not both at same time.
export type EventHandler = {
  onSuccess: (portOpened: PortOpened, portSpec: PortSpec) => void
  onError: (error: PortOpenError, portSpec: PortSpec) => void
}

//TODO:  deprecate the current 'portOpener' and rename this function to 'portOpener' and
//TODO: Should have a timeout error handling for port opening (maybe it already exists in the concrete 3rdParty library, check it or delete this comment)
export const portOpener_CB = (portSpec: PortSpec, handler: EventHandler): void => {

  const { path, baudRate} = portSpec


  //TODO: Refactor Extract this logic of protection
  //TODO: Improve error mechanism, avoid throwing
  if (alreadyOpened.has(path)) {
    const msg = `ERRO TENTANTO ABRIR A PORTA ${path}}DUAS VEZES`
    console.log(`*************************************  ${msg} ***************`)
    throw new Error(msg)
  } else {
    alreadyOpened.add(path)
  }
  

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
      kind: 'Unknown error',
      portSpec,
      detail: err,
    }
    handler.onError(err_, portSpec)
  }
  
  
}



