import { BaudRate, PortOpened, SerialDriver, PortInfo } from "../../serial-local-driver";
import { Future, Future_, UnsafePromiseError } from "../adts/future";
import { Push } from "../adts/push-stream";
import { Result, Result_, UnsafeSyncCallError } from "../adts/result";

// Fix: This moment we are just adapting the original serial driver to have an API ADT-based
//      but the ideal is to reinplement serial-driver in ADT terms

export type PortToOpen = {
    portPath: string
    baudRate: BaudRate
}

export type PortOpenError = {
    kind: 'PortOpenError'
    errorMessage?: `Cannot Open serial port`
    details?: {
        port: PortToOpen
        moreDetails: unknown
    }
}

export type PortWriteError = {
    kind: 'PortWriteError'
    errorMessage?: `Cannot write to serial port`
    details?: {
        port: PortToOpen
        moreDetails: unknown
    }
}

export type PortReadError = {
    kind: 'PortReadError'
    errorMessage?: `Cannot read from serial port`
    details?: {
        port: PortToOpen
        moreDetails: unknown
    }
}

export type PortCloseError = {
    kind: 'PortCloseError'
    errorMessage?: `Cannot close serial port`
    details?: {
        port: PortToOpen
        moreDetails: unknown
    }
}

export type PortListError = {
    kind: 'PortListError'
    errorMessage: `Cannot list serial ports`
    details: {

    }
}

export type PortError = 
    | PortListError
    | PortOpenError
    | PortCloseError
    | PortWriteError
    | PortReadError



export type PortOpened_ = {
    kind: 'PortOpened_';
    write: (data: readonly number[]) => Future<Result<void, PortWriteError>>
    onData: () => Push<Result<readonly number[], PortReadError>>
    close: () => Future<Result<void, PortCloseError>>
}


export type SerialDriverADT = {
    kind: 'SerialLocalDriverADT'
    listPorts: () => Future<Result<readonly PortInfo[], PortListError>>
    openPort: (p: PortToOpen) => Future<Result<PortOpened_, PortOpenError>>
}


// helper, map UnsafePromise to respective error type
const castError = {
    toPortListError: () => (u: UnsafePromiseError): PortListError => ({
        kind: 'PortListError',
        errorMessage: 'Cannot list serial ports',
        details: u
    }),
    toPortOpenError: (p: PortToOpen) => (u: UnsafePromiseError): PortOpenError => ({
        kind: 'PortOpenError',
        errorMessage: 'Cannot Open serial port',
        details: { 
            port: p,
            moreDetails: u   
        }
    }),
    toPortWriteError: (p: PortToOpen) => (u: UnsafePromiseError): PortWriteError => ({
        kind: 'PortWriteError',
        errorMessage: 'Cannot write to serial port',
        details: { 
            port: p,
            moreDetails: u   
        }
    }),
    toPortToReadError: (p: PortToOpen) => (u: UnsafeSyncCallError): PortReadError => ({
        kind: 'PortReadError',
        errorMessage: 'Cannot read from serial port',
        details: { 
            port: p,
            moreDetails: u   
        }
    }),
    toPortToCloseError: (p: PortToOpen) => (u: UnsafePromiseError): PortCloseError => ({
        kind: 'PortCloseError',
        errorMessage: 'Cannot close serial port',
        details: { 
            port: p,
            moreDetails: u   
        }
    }),
}


export const SerialLocalDriverADT = (concreteDriver: SerialDriver): SerialDriverADT => {

    // helper aliases
    type T = SerialDriverADT
    const mapResultA = Future_.mapResultA
    const mapResultError = Future_.mapResultError

    const listPorts: T['listPorts'] = () => {
        const safeFuture = Future_.fromUnsafePromise( () => concreteDriver.listPorts())
        const errorMapper = castError.toPortListError()
        const mapped = mapResultError(safeFuture, errorMapper)
        return mapped
    }

    const openPort: T['openPort'] = portToOpen => {
        const { portPath, baudRate} = portToOpen
        const safeFuture = Future_.fromUnsafePromise( () => concreteDriver.open(portPath, baudRate) )
        const errorMapper = castError.toPortOpenError(portToOpen)

        const mapPortOpened = (concretePort: PortOpened): PortOpened_ => {

            type T = PortOpened_

            const write: T['write'] = data => {
                const safeFuture = Future_.fromUnsafePromise( () => concretePort.write(data))
                const errorMapper = castError.toPortWriteError(portToOpen)
                const mapped = mapResultError(safeFuture, errorMapper)
                return mapped
            }

            const onData: T['onData'] = () => {
                return Push( yield_ => {
                    const unsafeRun = ():void => {
                        concretePort.onData( data => {
                            yield_(Result_.Ok(data))
                        });
                    }
                    const safeRun = Result_.fromUnsafeSyncCall(unsafeRun)
                    const errorMapper = castError.toPortToReadError(portToOpen)
                    const run = safeRun.mapError(errorMapper)
                    //unsafe runs result and tap error if it happens
                    run.forError( err => yield_(Result_.Error(err)))
                })
            }

            const close: T['close'] = () => {
                const safeFuture = Future_.fromUnsafePromise( () => concretePort.close())
                const errorMapper = castError.toPortToCloseError(portToOpen)
                const mapped = mapResultError(safeFuture, errorMapper)
                return mapped
            }


            return {
                kind: 'PortOpened_',
                write,
                onData,
                close,
            }


        }

        const mapped = mapResultA(safeFuture, mapPortOpened)
        const mapped2 = mapResultError(mapped, errorMapper)
        return mapped2

    }
        
    return {
        kind: 'SerialLocalDriverADT',
        listPorts,
        openPort,
    }

}