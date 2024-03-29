import { Kinematics, Moviment } from "../../cmpp/controlers/core"
import { SmartReferenceParameters } from "../../cmpp/controlers/utils/smart-reference"
import { Pulses } from "../../cmpp/physical-dimensions/base"
import { Milimeter } from "../../cmpp/physical-dimensions/milimeter"
import { PulsesPerTick, PulsesPerTickSquared } from "../../cmpp/physical-dimensions/physical-dimensions"
import { makeTunnel } from "../../cmpp/transport/tunnel"
import { random } from "../../core/utils"
import { x_axis_setup, y_axis_setup, z_axis_setup } from "../axes-setup"
import { Moviment3D } from "../machine"
import { SingleAxis } from "../single-axis"


export function* makeRamdomMoviment3D():Generator<Moviment3D> {
    while(true) {
        const m: Moviment3D = {
            X: {
                position: Pulses(random(500,2200)),
                speed: PulsesPerTick(random(2000,5000)),
                acceleration: PulsesPerTickSquared(random(5000,15000)),
            },
            Y: {
                position: Pulses(random(500,2200)),
                speed: PulsesPerTick(random(2000,5000)),
                acceleration: PulsesPerTickSquared(random(5000,15000)),
            },
            Z: {
                position: Milimeter(random(100,300)),
                speed:  PulsesPerTick(random(2000,5000)),
                acceleration: PulsesPerTickSquared(random(5000,15000)),
            },
        }
        yield(m)
    }
    
}

// 

export const tunnel_X = makeTunnel('com50', 9600, 1)
export const tunnel_Y = makeTunnel('com48', 9600, 1)
export const tunnel_Z = makeTunnel('com51', 9600, 1)
//
export const axisX = new SingleAxis(tunnel_X, x_axis_setup)
export const axisY = new SingleAxis(tunnel_Y, y_axis_setup)
export const axisZ = new SingleAxis(tunnel_Z, z_axis_setup)
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
        const p1: Pulses = Pulses(random(500,600))
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

