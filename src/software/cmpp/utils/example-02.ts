import { CMPP00LG } from "../transport/memmap-CMPP00LG"
import { explodeTunnel, makeTunnel } from "./core"
import ora from 'ora'
import { doReferenceIfNecessary} from "./reference"
import { start, waitToStop } from "./start"
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
        spinner.text = `Preparando eixos...`
        await doReferenceIfNecessary(tunnel,{
            "Velocidade de referencia": PulsesPerTick(600),
            "Aceleracao de referencia": PulsesPerTickSquared(5000),
        })
        //
        spinner.text = 'programando parametros de movimento'
        await axis_.set('Posicao inicial', Pulses(500))
        await axis_.set('Posicao final', Pulses(6000))
        await axis_.set('Velocidade de avanco', PulsesPerTick(3500))
        await axis_.set('Velocidade de retorno', PulsesPerTick(3500))
        await axis_.set('Aceleracao de avanco', PulsesPerTickSquared(9000))
        await axis_.set('Aceleracao de retorno', PulsesPerTickSquared(9000))
        //
        await axis_.set('Start automatico no avanco', 'desligado')
        await axis_.set('Start automatico no retorno', 'desligado')
        await axis_.set('Tempo para o start automatico', TicksOfClock(1))
        await axis_.set('Reducao do nivel de corrente em repouso', 'ligado')
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