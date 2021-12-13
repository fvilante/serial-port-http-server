import { CMPP00LG } from "../transport/memmap-CMPP00LG"
import ora from 'ora'
import { doReferenceIfNecessary} from "../controlers/utils/reference"
import { start, waitToStop } from "../controlers/utils/start"
import { Pulses, PulsesPerTick, PulsesPerTickSquared, TicksOfClock } from "../transport/memmap-types"
import { delay } from "../../core/delay"
import { makeTunnel } from "../datalink/tunnel"

const makeTransportLayer = CMPP00LG

const run = async () => {

    const spinner = ora().start()

    const tunnel = makeTunnel('com48', 9600, 0)


    // perde referencia, busca referencia, da um start afastando o eixo da origem (velocidade e aceleracao de refernecia parametrizada)
    const routine = async () => {
        const transportLayer = makeTransportLayer(tunnel)
        //
        spinner.text = `Preparando eixos...`
        await doReferenceIfNecessary(tunnel,{
            "Velocidade de referencia": PulsesPerTick(600),
            "Aceleracao de referencia": PulsesPerTickSquared(5000),
        })
        //
        spinner.text = 'programando parametros de movimento'
        await transportLayer.set('Posicao inicial', Pulses(500))
        await transportLayer.set('Posicao final', Pulses(6000))
        await transportLayer.set('Velocidade de avanco', PulsesPerTick(3500))
        await transportLayer.set('Velocidade de retorno', PulsesPerTick(3500))
        await transportLayer.set('Aceleracao de avanco', PulsesPerTickSquared(9000))
        await transportLayer.set('Aceleracao de retorno', PulsesPerTickSquared(9000))
        //
        await transportLayer.set('Start automatico no avanco', 'desligado')
        await transportLayer.set('Start automatico no retorno', 'desligado')
        await transportLayer.set('Tempo para o start automatico', TicksOfClock(1))
        await transportLayer.set('Reducao da corrente em repouso', 'ligado')
        //
        
        for (let k=0;k<5;k++) {
            spinner.text = `emitindo start ${k}`
            await start(tunnel)
            spinner.text = `aguardando parada`
            await waitToStop(tunnel)
        }
        spinner.text = 'fim!'
        await delay(1500)


    }

    for (let k=0; k<100;k++) {
        await routine()
    }    

}

run()