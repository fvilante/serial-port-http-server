import { Kinematics, Moviment } from "../../cmpp/controlers/core";
import { Position, Pulses } from "../../cmpp/physical-dimensions/base";
import { PulsesPerTick, PulsesPerTickSquared } from "../../cmpp/physical-dimensions/physical-dimensions";
import { CMPP00LG } from "../../cmpp/transport/memmap-CMPP00LG";
import { makeTunnel, Tunnel } from "../../cmpp/transport/tunnel";
import { ExecuteInParalel } from "../../core/promise-utils";
import { random } from "../../core/utils";
import { SingleAxis } from "../single-axis";

let axisCounter = 0
let allCatchedErrors: readonly any[] = []
let iterationConunter = 0

//const itor = getRandomMoviment()
const tunnel1 = makeTunnel('com48', 9600, 1)
const tunnel2 = makeTunnel('com50', 9600, 1)
const tunnel3 = makeTunnel('com51', 9600, 1)



const initialize_Axis_At_Random_Parameters = async (axis: SingleAxis) => {
    //configure
    const p1: Position = Pulses(500)
    const k1: Kinematics = {
        speed: PulsesPerTick(500),
        acceleration: PulsesPerTickSquared(5000)
    }
    //do
    try {
        await axis.shutdown()
        await axis.initialize({endPosition: p1, reference: k1})
    } catch (err) {
        console.log('**** Error Detected *************')
        console.log(err)
        allCatchedErrors = [...allCatchedErrors, err]
    }
    
}


const goAnyWhere = async (axis: SingleAxis):Promise<void> => {
    const { set } = axis.transportLayer
    const p2: Position = Pulses(random(500, 2300))
    await set('Posicao final', p2)
    await axis.startSerial()
    await axis.waitToStop()
}

const main = async () => {

    const doIt = async (tunnel: Tunnel) => {
        const axis = new SingleAxis(tunnel,`Eixo_Teste_#${axisCounter++}`)
        let c = 0
        while(true) {
            console.log(`interação=${c++}`)
            await initialize_Axis_At_Random_Parameters(axis)
            await goAnyWhere(axis)
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