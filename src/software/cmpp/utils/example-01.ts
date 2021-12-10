import { CMPP00LG } from "../transport/memmap-CMPP00LG"
import { explodeTunnel, makeTunnel } from "../controlers/core"
import { forceLooseReference } from "../controlers/utils/force-loose-reference"
import ora from 'ora'
import { forceReference, isReferenced } from "../controlers/utils/reference"
import { start, waitToStopThenStart } from "../controlers/utils/start"
import { Pulses, PulsesPerTick, PulsesPerTickSquared, TicksOfClock } from "../transport/memmap-types"

const makeAxis_ = CMPP00LG

const run = async () => {

    const spinner = ora().start()

    const tunnel = makeTunnel('com48', 9600, 0)
    const { baudRate, channel, path} = explodeTunnel(tunnel)
    const axis = [tunnel, makeAxis_] as  const

    // perde referencia, busca referencia, da um start afastando o eixo da origem (velocidade e aceleracao de refernecia parametrizada)
    const routine = async (program: readonly [velRef: number, acRef: number]) => {
        const axis_ = makeAxis_(tunnel)
        spinner.text = 'programando parametros de movimento'
        await axis_.set('Posicao inicial', Pulses(1000))
        await axis_.set('Posicao final', Pulses(2000))
        await axis_.set('Velocidade de avanco', PulsesPerTick(3000))
        await axis_.set('Velocidade de retorno', PulsesPerTick(3000))
        await axis_.set('Aceleracao de avanco', PulsesPerTickSquared(9000))
        await axis_.set('Aceleracao de retorno', PulsesPerTickSquared(9000))
        //
        await axis_.set('Start automatico no avanco', 'desligado')
        await axis_.set('Start automatico no retorno', 'desligado')
        await axis_.set('Tempo para o start automatico', TicksOfClock(1))
        const [valref, acRef] = program
        spinner.text = `Executando programa: valRef=${valref}, acRef=${acRef}`
        const isRef1 = await isReferenced(tunnel)
        spinner.text = `Eixo esta referenciado? ${isRef1}`
        spinner.text = `forçando perda da referencia`
        await forceLooseReference(tunnel)
        const isRef2 = await isReferenced(tunnel)
        spinner.text = `Eixo esta referenciado? ${isRef2}`
        spinner.text = `forçando referenciar`
        await forceReference(tunnel, { 
            "Velocidade de referencia": PulsesPerTick(valref),
            "Aceleracao de referencia": PulsesPerTickSquared(acRef),
        })
        const isRef3 = await isReferenced(tunnel)
        spinner.text = `Eixo esta referenciado? ${isRef3}`
        spinner.text = 'emitindo sinal de start...'
        await start(tunnel)
        spinner.text = 'start emitido'
        spinner.text = 'programado parametros de movimento'
        spinner.text = 'aguardando parada para dar restart 1'
        await waitToStopThenStart(tunnel)
        spinner.text = 'aguardando parada para dar restart 2'
        await waitToStopThenStart(tunnel)
        spinner.text = 'aguardando parada para dar restart 3'
        await waitToStopThenStart(tunnel)
        spinner.text = 'aguardando parada para dar restart 4'
        await waitToStopThenStart(tunnel)
        spinner.text = 'aguardando parada para dar restart 5'
        await waitToStopThenStart(tunnel)
        spinner.text = 'aguardando parada para dar restart 6'
        await waitToStopThenStart(tunnel)
        spinner.text = 'fim!'


    }

    for (let k=0; k<100;k++) {
        await routine([750, 5000])
    }    

}

run()