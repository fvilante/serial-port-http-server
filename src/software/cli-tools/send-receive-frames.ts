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

            const dataToSend = frameCoreToPayload({
                startByte: 'STX',
                direction: 'Solicitacao',
                waddr: 0x00,
                channel: 0,
                uint16: 0x00,
            })

            const response = await payloadTransact(portOpened, dataToSend)

            console.table(response)

            portOpened.close()

        })
        .catch( err => {
            console.log(err)
        })

    
}

main().then( () => {
    console.log('fim')

});