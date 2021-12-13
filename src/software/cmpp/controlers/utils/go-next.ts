import { Pulses_ } from "../../transport/memmap-types"
import { AxisControler } from "../axis-controler"
import { Moviment } from "../core"


//absolute moviment

export const setNext = async (axisControler: AxisControler, next: Moviment) => {
    await axisControler.setMainParameters({
        "Posicao final": next.position,
        //TODO: There should be a way looking startL.direcao to decide whether to use 'avanco' or 'retorno' to perform next moviment. This should increse performance.
        "Velocidade de avanco": next.speed,
        "Velocidade de retorno": next.speed,
        "Aceleracao de avanco": next.acceleration,
        "Aceleracao de retorno": next.acceleration,
    })
}


export const goNext = async (axisControler: AxisControler, next: Moviment) => {
    await setNext(axisControler, next)
    await axisControler.start()
    await axisControler.waitToStop()
}

//relative moviment

export const setNextRelative = async (axisControler: AxisControler, step: Moviment) => {
    const currentPosition = await axisControler.getCurrentPosition()
    const nextPosition = Pulses_.add(currentPosition, step.position)
    const nextMoviment = {...step, position: nextPosition}
    await axisControler.setMainParameters({
        "Posicao final": nextMoviment.position,
        //TODO: There should be a way looking startL.direcao to decide whether to use 'avanco' or 'retorno' to perform next moviment. This should increse performance.
        "Velocidade de avanco": nextMoviment.speed,
        "Velocidade de retorno": nextMoviment.speed,
        "Aceleracao de avanco": nextMoviment.acceleration,
        "Aceleracao de retorno": nextMoviment.acceleration,
    })
}

export const goNextRelative = async (axisControler: AxisControler, step: Moviment) => {
    await setNextRelative(axisControler,step)
    await axisControler.start()
    await axisControler.waitToStop()
}