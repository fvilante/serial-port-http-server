import { frameCoreToPayload } from "../cmpp/datalink/core/frame-core";
import { payloadTransact } from "../cmpp/datalink/transactioners/payload-transact";
import { PortSpec } from "../serial/core/port-spec";
import { portOpener } from "../serial/port-controler/adapters/port-opener";
import { PortOpened } from "../serial/port-controler/main/port-opened";



const main = async () => {

    let portOpened_: PortOpened | undefined = undefined

    const spec: PortSpec = {
        path: 'com50',
        baudRate: 9600
    }

    portOpener(spec)
        .then( async portOpened => {

            const timeout = 1000 // miliseconds

            const payloadCore = frameCoreToPayload({
                startByte: 'STX',
                direction: 'Solicitacao',
                waddr: 0x00,
                channel: 2,
                uint16: 0x00,
            })

            try {
                const response = await payloadTransact(portOpened, payloadCore, timeout)
                console.table(response)
            } catch (err) {
                console.log('saiu por erro')
                console.log(err)
            } finally {
                portOpened.close()
            }
            

            

        })
        .catch( err => {
            console.log('outro tipo de erro ->', err)
        })

    
}

main().then( () => {
    console.log('fim')

});