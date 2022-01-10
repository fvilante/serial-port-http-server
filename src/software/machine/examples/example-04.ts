import { Moviment } from "../../cmpp/controlers/core";
import { Pulses } from "../../cmpp/physical-dimensions/base";
import { PulsesPerTick, PulsesPerTickSquared } from "../../cmpp/physical-dimensions/physical-dimensions";
import { makeTunnel } from "../../cmpp/transport/tunnel";
import { random } from "../../core/utils";
import { SingleAxis } from "../single-axis";

let axisCounter = 0
let allCatchedErrors: readonly any[] = []
let iterationConunter = 0

export function* randomMoviment():Generator<Moviment, void, unknown> {
    const AXIS_MIN_POSITION = 500
    const AXIS_MAX_POSITION = 2300
    while(true) {
        yield {
            position: Pulses(random(AXIS_MIN_POSITION, AXIS_MAX_POSITION)),
            speed: PulsesPerTick(5000),
            acceleration: PulsesPerTickSquared(20000),
        }
    }
}

const main = async () => {
    const port = 'com50'
    const axis = new SingleAxis(makeTunnel(port, 9600, 0),`Eixo_Teste_#${axisCounter++}`)
    const tolerance = [Pulses(3), Pulses(3)] as const// lower and upper bound respectively

    const itor = randomMoviment()

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