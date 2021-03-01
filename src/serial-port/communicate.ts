import { BaudRate, PortOpened, SerialDriverConstructor } from '../serial-local-driver'

export const CommDriver = SerialDriverConstructor()

// CRITICAL
// Fix: When timeout hapens, communicate should return the rejection of a promise
//      but we are returning void synchronously. This make program be inoperative
//      when printer time out (ie: when serial-hub bugs)
//      Would be better to develop 'communicate' using total lazy functors as strategy

// Comunicate with a device sending to it data, and grabing the response to a interpreter
// The interpreter is responsible to msg back when he has finished processing the response
// or signal back if an error has ocuried
export const communicate = (
    portName: string,  // com1, com2, etc
    baudRate: BaudRate, //2400, 9600, etc
    dataToSend: readonly number[], // ie ->  [0x1B,0x02,0x00,0x1C,0x00,0x00,0x1B,0x03,0xDF]
    receiver: (dataReceived: readonly number[], hasFinished: () => Promise<void>) => void, // caller calls the hasFinished when it is enough of receiving data, than it waits the promise completion which is the time to some resources to release
    timeout: number, // in milisecs, ex: 1000, 500, 3000, etc.. / Timing begin after last byte of data has been sent
    ): void => {

    let portOpened: PortOpened | undefined = undefined
    let id: NodeJS.Timeout | undefined = undefined

    // release resources
    const hasFinished_ = ():Promise<void> => new Promise( (resolve, reject) => {
        if (id!==undefined) {
            clearTimeout(id);
            id = undefined
        }
        if (portOpened!==undefined) {
            console.log(`fechando porta ${portName}...`)
            portOpened.close()
                .then( () => { 
                    console.log(`porta ${portName} fechada com sucesso.`)
                    resolve();
                })
                .catch( err => reject(err))
            portOpened = undefined
        } else /*portOpened===undefined*/ {
            resolve()
        }
    })

    console.log(`Abrindo porta ${portName}...`)
    CommDriver.open(portName, baudRate)
        .then( portOpened_ => {
            portOpened = portOpened_;
            console.log(`aberta ${portName}`);
            console.log(`gravando dados...`);
            console.log(`configurando reception handler.`)
            portOpened.onData( dataReceived => {
                console.log(`recebendo dado da ${portName}:`);
                console.log(dataReceived);
                receiver(dataReceived, hasFinished_);
            })
            portOpened.write(dataToSend)
                .then( () => {
                    console.log(`gravado.`);                      
                    id = setTimeout( () => {
                        hasFinished_()
                            //.then( () => reject('Communication with serial device, timed out.'));
                    }, timeout);
                })
        })


}