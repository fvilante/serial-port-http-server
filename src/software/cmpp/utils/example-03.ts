import { CMPP00LG } from "../transport/memmap-CMPP00LG"
import { explodeTunnel, isReferenced, makeTunnel } from "./core"
import { forceLooseReference } from "./force-loose-reference"
import ora from 'ora'
import { doReferenceIfNecessary, forceReference } from "./reference"
import { isStoped, start, waitToStop, waitToStopThenStart } from "./start"
import { Pulses, PulsesPerTick, PulsesPerTickSquared, TicksOfClock } from "../transport/memmap-types"
import { delay } from "../../core/delay"

const makeAxis_ = CMPP00LG

const run = async () => {

    const spinner = ora().start()

    const tunnel = makeTunnel('com48', 9600, 0)
    const { baudRate, channel, path} = explodeTunnel(tunnel)
    const axis = [tunnel, makeAxis_] as  const

    // perde referencia, busca referencia, da um start afastando o eixo da origem (velocidade e aceleracao de refernecia parametrizada)
    const routine = async () => {
        const axis_ = makeAxis_(tunnel)
        //
        spinner.text = 'programando parametros de movimento'
        await axis_.set('Posicao inicial', Pulses(3000))
        await axis_.set('Posicao final', Pulses(6000))
        await axis_.set('Velocidade de avanco', PulsesPerTick(2500))
        await axis_.set('Velocidade de retorno', PulsesPerTick(2500))
        await axis_.set('Aceleracao de avanco', PulsesPerTickSquared(9000))
        await axis_.set('Aceleracao de retorno', PulsesPerTickSquared(9000))
        //
        await axis_.set('Start automatico no avanco', 'desligado')
        await axis_.set('Start automatico no retorno', 'desligado')
        await axis_.set('Tempo para o start automatico', TicksOfClock(1))
        await axis_.set('Reducao do nivel de corrente em repouso', 'ligado')
        //
        spinner.text = `Preparando eixos...`
        //await forceLooseReference(...axis)
        await doReferenceIfNecessary(...axis,{
            "Velocidade de referencia": PulsesPerTick(600),
            "Aceleracao de referencia": PulsesPerTickSquared(5000),
        })
        //
        let total=0
        spinner.text = `emitindo start`
        await start(tunnel, makeAxis_)
        await waitToStop(tunnel, makeAxis_)
        spinner.text = `Referenciado e Pronto.`
        await delay(3000)

        const sentStarts = async (n: number) => {
            for (let k=0; k<n; k++) {
                spinner.text = `emitindo start ${k++}, total=${total++}`
                await start(tunnel, makeAxis_)
            }
        }
        
        await sentStarts(1);
        await sentStarts(1);
        await axis_.set('Velocidade de avanco', PulsesPerTick(500))
        await axis_.set('Velocidade de retorno', PulsesPerTick(500))
        await axis_.set('Posicao final', Pulses(4000))
        

        spinner.text = 'fim!'
        await waitToStop(tunnel, makeAxis_)
    }

    for (let k=0; k<100;k++) {
        await routine()
    }    

}

run()