import { Moviment } from "../../cmpp/controlers/core";
import { Pulses } from "../../cmpp/physical-dimensions/base";
import { PulsesPerTick, PulsesPerTickSquared } from "../../cmpp/physical-dimensions/physical-dimensions";
import { makeTunnel } from "../../cmpp/transport/tunnel";
import { random } from "../../core/utils";
import { SingleAxis } from "../single-axis";
import { randomMoviment as getRandomMoviment } from "./example-04";

let axisCounter = 0
let allCatchedErrors: readonly any[] = []
let iterationConunter = 0


const main = async () => {
    const port = 'com50'
    const axis = new SingleAxis(makeTunnel(port, 9600, 0),`Eixo_Teste_#${axisCounter++}`)
    const tolerance = [Pulses(3), Pulses(3)] as const// lower and upper bound respectively

    const itor = getRandomMoviment()

    let currentPosition_: number | undefined = undefined
    while(true) {
        const x = itor.next()
        if (x.done) break;
        const nextMoviment = x.value
        iterationConunter++
        // body
        try {
            currentPosition_ = (await axis.goto(nextMoviment, tolerance)).value
        } catch (err) {
            allCatchedErrors = [...allCatchedErrors, [port, err]]
            console.log({port, err})
        }

    }
     
    await axis.powerOff()
}




main()