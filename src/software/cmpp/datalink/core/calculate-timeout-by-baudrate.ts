import { BaudRate } from "../../../serial/core/baudrate"

//Here we stabilish the timeout as a function of baudRate
//TODO: Implement 'Milisecond' as the return type instead of 'number'
export const calculateTimeoutByBaudrate = (baudRate: BaudRate): number => {
    //NOTE: the 100 miliseconds below is totaly arbitrary based in my feelings and experience, maybe this number can be optimized in future
    const timeout =  (9600/baudRate) * 100 // Note: for 9600 is acceptable a 100 miliseconds timeout for wait the reception frame from cmpp then...
    return Math.round(timeout)
}
