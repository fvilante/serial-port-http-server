import { BaudRate } from "../../../serial/core/baudrate"

//Here we stabilish the timeout as a function of baudRate
//TODO: Implement 'Milisecond' as the return type instead of 'number'
// Note: for a reference baudrate 9600 we define what is the acceptable miliseconds for timeout to wait receive the reception frame from cmpp 
//       We're adopting 300 milisecs as default.
//       This was arbitrarily decided. (Experience showed that in a (OS: Windows7, Proccessor: i7) enviroment and timeout=100 milisecs you will find 1 false timeout error per each 2500 frames received)
export const calculateTimeoutByBaudrate = (baudRate: BaudRate, timeToWaitAt9600ReferenceInMiliseconds: number = 300): number => {
    //NOTE: the 100 miliseconds below is totaly arbitrary based in my feelings and experience, maybe this number can be optimized in future
    const timeout =  (9600/baudRate) * timeToWaitAt9600ReferenceInMiliseconds 
    return Math.round(timeout)
}
