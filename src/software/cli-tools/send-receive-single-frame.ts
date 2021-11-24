import { PortOpener } from "../serial";
import { frameCoreToPayload } from "../cmpp/datalink/frame";
import { cmppSimpleTransaction } from "../cmpp/datalink/transactioners/simple-transaction";


const main = async () => {

    const portOpened = await PortOpener('com50',9600)
    const [payload] = frameCoreToPayload({
        startByte: 'STX',
        direction: 'Solicitacao',
        waddr: 0x00,
        channel: 0,
        uint16: 0x00,
    })
    const response = await cmppSimpleTransaction(portOpened)(payload)
    console.table(response)
    await portOpened.close()
    
    
}

main().then( () => {
    console.log('fim')
});