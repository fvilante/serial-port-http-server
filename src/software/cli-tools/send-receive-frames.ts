import { frameCoreToPayload } from "../cmpp/datalink/frame-core";
import { payloadTransact } from "../cmpp/datalink/transactioners/payload-transact";
import { payloadTransaction_CB } from "../cmpp/datalink/transactioners/payload-transact-cb";
import { PortOpened, portOpener, PortSpec } from "../serial";


const main = async () => {

    let portOpened_: PortOpened | undefined = undefined

    const spec: PortSpec = {
        path: 'com50',
        baudRate: 9600
    }

    portOpener(spec)
        .then( async portOpened => {

            const timeout = 1000 // miliseconds

            const dataToSend = frameCoreToPayload({
                startByte: 'STX',
                direction: 'Solicitacao',
                waddr: 0x00,
                channel: 2,
                uint16: 0x00,
            })

            try {
                const response = await payloadTransact(portOpened, dataToSend, timeout)
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