import { CMPP00LG } from "../transport/memmap-CMPP00LG"
import { isReferenced, makeTunnel } from "./core"
import { forceLooseReference } from "./force-loose-reference"
import ora from 'ora'
import { doReference } from "./do-reference"

const makeAxis_ = CMPP00LG

const run = async () => {

    const spinner = ora().start()

    const tunnel = makeTunnel('com48', 9600, 0)
    const axis = [tunnel, makeAxis_] as  const

    const isRef1 = await isReferenced(...axis)
    spinner.succeed(`Eixo esta referenciado? ${isRef1}`)
    spinner.info(`forçando perda da referencia`)
    await forceLooseReference(...axis)
    const isRef2 = await isReferenced(...axis)
    spinner.succeed(`Eixo esta referenciado? ${isRef2}`)
    spinner.info(`forçando referenciar`)
    await doReference(...axis)
    const isRef3 = await isReferenced(...axis)
    spinner.succeed(`Eixo esta referenciado? ${isRef3}`)


}

run()