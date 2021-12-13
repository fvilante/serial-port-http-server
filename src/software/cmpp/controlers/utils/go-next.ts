import { Pulses_ } from "../../transport/memmap-types"
import { CmppControler } from "../cmpp-controler"
import { Moviment } from "../core"


//absolute moviment

export const setNext = async (cmppControler: CmppControler, next: Moviment) => {
    await cmppControler.setMainParameters({
        "Posicao final": next.position,
        //TODO: There should be a way looking startL.direcao to decide whether to use 'avanco' or 'retorno' to perform next moviment. This should increse performance.
        "Velocidade de avanco": next.speed,
        "Velocidade de retorno": next.speed,
        "Aceleracao de avanco": next.acceleration,
        "Aceleracao de retorno": next.acceleration,
    })
}


export const goNext = async (cmppControler: CmppControler, next: Moviment) => {
    await setNext(cmppControler, next)
    await cmppControler.start()
    await cmppControler.waitToStop()
}

//relative moviment

export const setNextRelative = async (cmppControler: CmppControler, step: Moviment) => {
    const currentPosition = await cmppControler.getCurrentPosition()
    const nextPosition = Pulses_.add(currentPosition, step.position)
    const nextMoviment = {...step, position: nextPosition}
    await cmppControler.setMainParameters({
        "Posicao final": nextMoviment.position,
        //TODO: There should be a way looking startL.direcao to decide whether to use 'avanco' or 'retorno' to perform next moviment. This should increse performance.
        "Velocidade de avanco": nextMoviment.speed,
        "Velocidade de retorno": nextMoviment.speed,
        "Aceleracao de avanco": nextMoviment.acceleration,
        "Aceleracao de retorno": nextMoviment.acceleration,
    })
}

export const goNextRelative = async (cmppControler: CmppControler, step: Moviment) => {
    await setNextRelative(cmppControler,step)
    await cmppControler.start()
    await cmppControler.waitToStop()
}