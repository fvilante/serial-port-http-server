import { Future } from '../../adts/future';
import { Result } from '../../adts/result';
import { SuccessEvent } from '../../cmpp/datalink/core/interpreter';
import { TransactErrorEvent } from '../../cmpp/datalink/transactioners/payload-transact-cb';
import { PortCloseError } from '../../cmpp/datalink/transactioners/safe-payload-transact';
import { makeTunnel } from '../../cmpp/transport/tunnel';
import { PortOpenError } from '../../serial/port-opener-cb';
import { LowDriver } from '../low-driver'

const main = async () => {

    console.log('running...')

    const axis1 = new LowDriver(makeTunnel('com50', 9600,1));
    const axis2 = new LowDriver(makeTunnel('com48', 9600,1));
    const axis3 = new LowDriver(makeTunnel('com51', 9600,1));
    const axies = [axis2]//, axis2, axis3]

    type CmppResponse = Future<Result<SuccessEvent, TransactErrorEvent | PortOpenError | PortCloseError>>

    function* getNext():Generator<CmppResponse[], void, unknown> {
        let wadd_ = 0x00
        const QUANT = 0xFF
        
        while(true) {
            if(wadd_>=0xFF) wadd_ = 0
            const responses = axies.map( axis => {
                return axis.transactFrame({
                    channel: 0,
                    direction: 'Solicitacao',
                    startByte: 'STX',
                    waddr: wadd_++,
                    uint16: 0x00,
                })
            })
            yield responses
                
        }
        
    }

    const itor = getNext()
    let next = itor.next()
    let c = 0
    let errors: any[] = []

    const showReport = () => {
        console.log('** Report **')
        errors.map( err => {
            console.log(err.kind, err)
        })
        console.log('numero total de erros:', errors.length)
    }
    const id = setInterval( () => {
        showReport()
    }, 10000)

    try {
        while(!next.done) {
            console.log('iter=',c++)
            const effects = next.value
            const effects_ = await Promise.all(effects.map( fs => fs.async()))
            effects_.map( r => {
                r.forEach({
                    Ok: event => {
                        const { frameInterpreted } = event
                        //console.log(frameInterpreted.dataLow) 
                    },
                    Error: err => {
                        errors = [...errors, err]
                        throw new Error('Erro fatal')
                    }
                })
            })   
            next = itor.next()
        }
    } finally {
        clearInterval(id);
        showReport();
    }
    

    

    

}


main();