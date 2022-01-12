import { Moviment } from "../../cmpp/controlers/core"
import { Pulses } from "../../cmpp/physical-dimensions/base"
import { PulsesPerTick, PulsesPerTickSquared } from "../../cmpp/physical-dimensions/physical-dimensions"
import { makeTunnel } from "../../cmpp/transport/tunnel"
import { Machine } from "../machine"
import { SingleAxis } from "../single-axis"

// 1) PF=PA (exatamente igual) ele busca o PI
// 2) Se PF=PA±1 entao ele nem se meche (normalmente)
// 3) Se PF=PA±delta onde delta >= 2, entao ele tenta alcançar 


const main = async () => {

    console.log('iniciado...')
    const axisX = new SingleAxis(makeTunnel('com50', 9600, 1))
    const axisY = new SingleAxis(makeTunnel('com51', 9600, 1))
    const axisZ = new SingleAxis(makeTunnel('com48', 9600, 1))

    const point1: Moviment = {
        position: Pulses(2201),
        speed: PulsesPerTick(9000),
        acceleration: PulsesPerTickSquared(15000),
    }

    const { get } = axisX.transportLayer
    const janela = await get('Tolerancia de Erro do zero index')
    console.log(`Janela=${janela.value} pulsos`)
    await axisX.shutdown()
    await axisX.initialize()
    await axisX.goto2(point1)
    const currentPosition = await axisX.getCurrentPosition()
    const point2: Moviment = {
        ...point1,
        position: Pulses(currentPosition.value+0)
        
    }
    console.log(`Posicao atual (P1) = ${currentPosition.value}`)
    console.log(`Irei mover para (P2): ${point2.position.value}`)
    console.log('iniciando movimento...')
    await axisX.goto2(point2)
    console.log(`movimento M2 finalizado!`)
    const currentPosition2 = await axisX.getCurrentPosition()
    console.log(`Posicao atual (P3) = ${currentPosition2.value}`)

    const m = new Machine({X: axisX, Y: axisY, Z: axisZ})
/*
    await m.initialize()
    await m.goto({
        X: {
            position: Pulses(2200),
            speed: PulsesPerTick(1000),
            acceleration: PulsesPerTickSquared(5000),
        },
        Y: {
            position: Pulses(2200),
            speed: PulsesPerTick(1000),
            acceleration: PulsesPerTickSquared(5000),
        },
        Z: {
            position: Pulses(2200),
            speed: PulsesPerTick(1000),
            acceleration: PulsesPerTickSquared(5000),
        },
    })
    await m.goto({
        X: {
            position: Pulses(2200),
            speed: PulsesPerTick(1000),
            acceleration: PulsesPerTickSquared(5000),
        },
        Y: {
            position: Pulses(2200),
            speed: PulsesPerTick(1000),
            acceleration: PulsesPerTickSquared(5000),
        },
        Z: {
            position: Pulses(2200),
            speed: PulsesPerTick(1000),
            acceleration: PulsesPerTickSquared(5000),
        },
    })
*/
}


main()