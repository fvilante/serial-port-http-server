import { CMPP00LG } from "../../transport/memmap-CMPP00LG"
import ora from 'ora'
import { doReferenceIfNecessary } from "../utils/reference"
import { start, waitToStop } from "../utils/start"
import { Pulses, PulsesPerTick, PulsesPerTickSquared, TicksOfClock } from "../../transport/memmap-types"
import { delay } from "../../../core/delay"
import { makeTunnel } from "../../datalink/tunnel"

const TransportLayer = CMPP00LG

const run = async () => {

    const spinner = ora().start()

    const tunnel = makeTunnel('com48', 9600, 0)

    // perde referencia, busca referencia, da um start afastando o eixo da origem (velocidade e aceleracao de refernecia parametrizada)
    const routine = async () => {
        const transportLayer = TransportLayer(tunnel)
        //
        spinner.text = 'programando parametros de movimento'
        await transportLayer.set('Posicao inicial', Pulses(3000))
        await transportLayer.set('Posicao final', Pulses(6000))
        await transportLayer.set('Velocidade de avanco', PulsesPerTick(2500))
        await transportLayer.set('Velocidade de retorno', PulsesPerTick(2500))
        await transportLayer.set('Aceleracao de avanco', PulsesPerTickSquared(9000))
        await transportLayer.set('Aceleracao de retorno', PulsesPerTickSquared(9000))
        //
        await transportLayer.set('Start automatico no avanco', 'desligado')
        await transportLayer.set('Start automatico no retorno', 'desligado')
        await transportLayer.set('Tempo para o start automatico', TicksOfClock(1))
        await transportLayer.set('Reducao da corrente em repouso', 'ligado')
        //
        spinner.text = `Preparando eixos...`
        //await forceLooseReference(...axis)
        await doReferenceIfNecessary(tunnel,{
            "Velocidade de referencia": PulsesPerTick(600),
            "Aceleracao de referencia": PulsesPerTickSquared(5000),
        })
        //
        let total=0
        spinner.text = `emitindo start`
        await start(tunnel)
        await waitToStop(tunnel)
        spinner.text = `Referenciado e Pronto.`
        await delay(3000)

        const sentStarts = async (n: number) => {
            for (let k=0; k<n; k++) {
                spinner.text = `emitindo start ${k++}, total=${total++}`
                await start(tunnel)
            }
        }
        
        await sentStarts(1);
        await sentStarts(1);
        await transportLayer.set('Velocidade de avanco', PulsesPerTick(500))
        await transportLayer.set('Velocidade de retorno', PulsesPerTick(500))
        await transportLayer.set('Posicao final', Pulses(4000))
        

        spinner.text = 'fim!'
        await waitToStop(tunnel)
    }

    for (let k=0; k<100;k++) {
        await routine()
    }    

}

run()