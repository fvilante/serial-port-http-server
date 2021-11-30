import { frameCoreToPayload } from "../cmpp/datalink/frame-core";
import { payloadTransaction_WithCB } from "../cmpp/datalink/transactioners/payload-transact";
import { PortOpened, portOpener, PortSpec } from "../serial";


const main = async () => {

    let portOpened_: PortOpened | undefined = undefined

    const spec: PortSpec = {
        path: 'com50',
        baudRate: 9600
    }

    try {
        portOpened_ = await portOpener(spec)
    } catch (err) {
        console.table(err)
        throw new Error(`Se liga porque a coisa ta punk`)
    }

    const portOpened = portOpened_ as PortOpened
    
    const dataToSend = frameCoreToPayload({
        startByte: 'STX',
        direction: 'Solicitacao',
        waddr: 0x00,
        channel: 0,
        uint16: 0x00,
    })
    
    payloadTransaction_WithCB(portOpened, ...dataToSend, {
        BEGIN: header => {
            console.log('Iniciando...Preparando para enviar:')
            console.table(header)
        },
        END: () => {
            console.log('END')
            console.log('Fechando a porta...')
            portOpened.close()
            console.log('Fechada')
        },
        willSend: () => {
            console.log(`Preparando para enviar...`)
        },
        hasSent: () => {
            console.log('Ok enviado!')
        },
        onDataChunk: data => {
            console.log(`Recebi um chunk, veja: ${data}`)
        },
        onError: error => {
            console.log(`Ixi! Erro, veja:`)
            console.table(error)
        },
        onStateChange: event => {
            //console.table(event)
        },
        onSuccess: event => {
            console.log('sucesso!')
            console.table(event)
        }
    })
    
    
}

main().then( () => {
    console.log('fim')

});