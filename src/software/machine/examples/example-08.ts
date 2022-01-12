import { Kinematics, Moviment } from "../../cmpp/controlers/core";
import { SmartReferenceParameters } from "../../cmpp/controlers/utils/smart-reference";
import { Position, Pulses } from "../../cmpp/physical-dimensions/base";
import { PulsesPerTick, PulsesPerTickSquared } from "../../cmpp/physical-dimensions/physical-dimensions";
import { makeTunnel, Tunnel } from "../../cmpp/transport/tunnel";
import { ExecuteInParalel } from "../../core/promise-utils";
import { makeRange, random } from "../../core/utils";
import { SingleAxis } from "../single-axis";

let axisCounter = 1
let allCatchedErrors: readonly any[] = []

//const itor = getRandomMoviment()
const tunnel1 = makeTunnel('com50', 9600, 1)
const tunnel2 = makeTunnel('com48', 9600, 1)
const tunnel3 = makeTunnel('com51', 9600, 1)

function* randomMoviment():Generator<Moviment>  {
    while(true) {
        const m: Moviment = {
            position: Pulses(random(500,2300)),
            speed: PulsesPerTick(random(1000, 2000)),
            acceleration: PulsesPerTickSquared(random(5000, 10000)),
        }
        yield(m)
    }
    
}

function* randomReference():Generator<SmartReferenceParameters> {
    while(true) {
        const p1: Position = Pulses(random(500,600))
        const k1: Kinematics = {
            speed: PulsesPerTick(random(500,1000)),
            acceleration: PulsesPerTickSquared(5000)
        }
        const m: SmartReferenceParameters = {
            endPosition: p1,
            reference: k1,
        }
        yield(m)
    }
    
}

const moviment__ = randomMoviment()
const reference__ = randomReference()

const getRandomMoviment = ():Moviment => {
    const m = moviment__.next()
    if(m.done) {
        throw Error()
    } else {
        return m.value
    }
}

let moves = 0
let cases = 0
const main = async () => {

        
        const axis1 = new SingleAxis(tunnel1,`Eixo_Teste_#${1}`)
        const axis2 = new SingleAxis(tunnel2,`Eixo_Teste_#${2}`)
        const axis3 = new SingleAxis(tunnel3,`Eixo_Teste_#${3}`)
        

        const run = async (axis: SingleAxis) => {
            await axis.shutdown()
            await axis.initialize()
            for (let k of makeRange(0,30,1)) {
                moves++
                //console.log(`moves=${moves}`)
                const m = getRandomMoviment()
                await axis.goto2(m)
            }
        }
      
        while(true) {
            try {
                console.log(`case=${++cases}`)
                await ExecuteInParalel([ axis1, axis2,axis3].map( axis => () => run(axis)))
            } catch (err) {
                allCatchedErrors = [...allCatchedErrors, err]
                console.log(err)
                report()
            }
        }
        
    
        
    
}

// main
const report = () => {
    console.log(`******************** ERRORS REPORT ************************************`)
    console.log(`totalErrors=${allCatchedErrors.length}`)
    console.log(`cases=${cases}`)
    console.log(`moves=${moves}`)
    console.log(`errorsList=`, allCatchedErrors)
    console.log()
}

// execution

const id = setInterval( () => report(), 25000)
main().then( () => {
    clearInterval(id);
})
