import { Kinematics, Moviment } from "../../cmpp/controlers/core";
import { Position, Pulses } from "../../cmpp/physical-dimensions/base";
import { PulsesPerTick, PulsesPerTickSquared } from "../../cmpp/physical-dimensions/physical-dimensions";
import { CMPP00LG } from "../../cmpp/transport/memmap-CMPP00LG";
import { makeTunnel, Tunnel } from "../../cmpp/transport/tunnel";
import { ExecuteInParalel } from "../../core/promise-utils";
import { random } from "../../core/utils";
import { SingleAxis } from "../single-axis";

let axisCounter = 1
let allCatchedErrors: readonly any[] = []
let iterationConunter = 0

//const itor = getRandomMoviment()
const tunnel1 = makeTunnel('com50', 9600, 1)
const tunnel2 = makeTunnel('com48', 9600, 1)
const tunnel3 = makeTunnel('com51', 9600, 1)



const initialize_Axis_At_Random_Parameters = async (axis: SingleAxis) => {
    //configure
    const p1: Position = Pulses(random(500,600))
    const k1: Kinematics = {
        speed: PulsesPerTick(random(500,1000)),
        acceleration: PulsesPerTickSquared(5000)
    }
    const m2: Moviment = {
        position: Pulses(random(500,2300)),
        speed: PulsesPerTick(random(1000, 2000)),
        acceleration: PulsesPerTickSquared(random(5000, 10000)),
    }

    //do
    try {
        await axis.shutdown()
        await axis.initialize({endPosition: p1, reference: k1})
        await axis.goto2(m2)
    } catch (err) {
        console.log(`**** Error Detected axis=${axis.axisName}*************`)
        console.log(`p1=`,p1.value)
        console.log(`k1={speed=${k1.speed.value} accel=${k1.acceleration.value} `)
        console.log(err)
        allCatchedErrors = [...allCatchedErrors, err]
    }
    
}


const main = async () => {

    const doIt = async (tunnel: Tunnel) => {
        const axis = new SingleAxis(tunnel,`Eixo_Teste_#${axisCounter++}`)
        let c = 0
        while(true) {
            console.log(`interação=${c++}`)
            await initialize_Axis_At_Random_Parameters(axis)
        }
    }

    const program = [tunnel1, tunnel2, tunnel3].map( tunnel => () => doIt(tunnel))
    await ExecuteInParalel(program)

    
}

// main
const report = () => {
    console.log(`******************** ERRORS REPORT ************************************`)
    console.log(`totalErrors=${allCatchedErrors.length}`)
    console.log(`errorsList=`, allCatchedErrors)
    console.log()
}
setInterval( () => report(), 25000)
main()