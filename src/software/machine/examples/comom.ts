import { Kinematics, Moviment } from "../../cmpp/controlers/core"
import { SmartReferenceParameters } from "../../cmpp/controlers/utils/smart-reference"
import { Position, Pulses } from "../../cmpp/physical-dimensions/base"
import { PulsesPerTick, PulsesPerTickSquared } from "../../cmpp/physical-dimensions/physical-dimensions"
import { makeTunnel } from "../../cmpp/transport/tunnel"
import { random } from "../../core/utils"
import { SingleAxis } from "../single-axis"

export const tunnel_X = makeTunnel('com50', 9600, 1)
export const tunnel_Y = makeTunnel('com48', 9600, 1)
export const tunnel_Z = makeTunnel('com51', 9600, 1)
//
export const axisX = new SingleAxis(tunnel_X)
export const axisY = new SingleAxis(tunnel_Y)
export const axisZ = new SingleAxis(tunnel_Z)
export const axis = axisX

//

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

export const getRandomMoviment = ():Moviment => {
    const m = moviment__.next()
    if(m.done) {
        throw Error()
    } else {
        return m.value
    }
}