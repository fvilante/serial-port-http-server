import { CMPP00LG } from "../transport/memmap-CMPP00LG"
import { isReferenced, makeTunnel } from "./core"
import { forceLooseReference } from "./force-loose-reference"
import ora from 'ora'
import { forceReference } from "./force-reference"
import { start } from "./start"
import { Pulses, PulsesPerTick, PulsesPerTickSquared } from "../transport/memmap-types"
import { executeInSequence } from "../../core/promise-utils"
import { delay } from "../../core/delay"

const makeAxis_ = CMPP00LG

const run = async () => {

    const spinner = ora().start()

    const tunnel = makeTunnel('com48', 9600, 0)
    const axis = [tunnel, makeAxis_] as  const

    // perde referencia, busca referencia, da um start afastando o eixo da origem (velocidade e aceleracao de refernecia parametrizada)
    const routine = async (program: readonly [velRef: number, acRef: number]) => {
        const axis_ = makeAxis_(tunnel)
        await axis_.set('Start automatico no avanco', 'desligado')
        await axis_.set('Start automatico no retorno', 'desligado')
        const [valref, acRef] = program
        spinner.text = `Executando programa: valRef=${valref}, acRef=${acRef}`
        const isRef1 = await isReferenced(...axis)
        spinner.text = `Eixo esta referenciado? ${isRef1}`
        spinner.text = `forçando perda da referencia`
        await forceLooseReference(...axis)
        const isRef2 = await isReferenced(...axis)
        spinner.text = `Eixo esta referenciado? ${isRef2}`
        spinner.text = `forçando referenciar`
        await forceReference(...axis, { 
            "Velocidade de referencia": PulsesPerTick(valref),
            "Aceleracao de referencia": PulsesPerTickSquared(acRef),
        })
        const isRef3 = await isReferenced(...axis)
        spinner.text = `Eixo esta referenciado? ${isRef3}`
        spinner.text = `programando parametros de movimento`
        await axis_.set('Posicao inicial', Pulses(5000))
        await axis_.set('Posicao final', Pulses(5500))
        spinner.text = 'emitindo sinal de start...'
        await start(tunnel, makeAxis_)
        spinner.text = 'start emitido'
        spinner.text = 'iniciando delay de para aguardar finalizacao do movimento'
        await delay(5000)
        spinner.text = 'delay concluido'


    }

    for (let k=0; k<100;k++) {
        await routine([600, 5000])
    }    

}

run()