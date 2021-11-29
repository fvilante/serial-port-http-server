import { PortOpener } from "../serial";
import { frameCoreToPayload } from "../cmpp/datalink/frame-core";
import { payloadTransaction } from "../cmpp/datalink/transactioners/payload-transact";


const main = async () => {

    const portOpened = await PortOpener('com50',9600)
    const [payload] = frameCoreToPayload({
        startByte: 'STX',
        direction: 'Solicitacao',
        waddr: 0x00,
        channel: 0,
        uint16: 0x00,
    })
    const responses = [
        await payloadTransaction(portOpened,payload),
        await payloadTransaction(portOpened,payload),
    ]

    console.table(responses)
    await portOpened.close()
    
    
}

main().then( () => {
    console.log('fim')
});