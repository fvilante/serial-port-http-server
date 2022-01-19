import { Moviment } from "../../cmpp/controlers/core"
import { Pulses } from "../../cmpp/physical-dimensions/base"
import { PulsesPerTick, PulsesPerTickSquared } from "../../cmpp/physical-dimensions/physical-dimensions"
import { makeTunnel } from "../../cmpp/transport/tunnel"
import { random } from "../../core/utils"
import { Machine, Moviment3D } from "../machine"
import { SingleAxis } from "../single-axis"



function* makeMoviment3D():Generator<Moviment3D> {
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
                position: Pulses(random(500,2200)),
                speed:  PulsesPerTick(random(2000,5000)),
                acceleration: PulsesPerTickSquared(random(5000,15000)),
            },
        }
        yield(m)
    }
    
}



const main = async () => {

    console.log('iniciado...')
    const axisX = new SingleAxis(makeTunnel('com50', 9600, 1),`Eixo_X`)
    const axisY = new SingleAxis(makeTunnel('com51', 9600, 1),`Eixo_Y`)
    const axisZ = new SingleAxis(makeTunnel('com48', 9600, 1),`Eixo_Z`)

    const m = new Machine({X: axisX, Y: axisY, Z: axisZ})
    
    await m.initialize()
    const it = makeMoviment3D()
    let r = it.next()
    let c = 0
    while(!r.done) {
        const point = r.value
        const report = {
            x: point.X.position.value,
            y: point.Y.position.value,
            z: point.Z.position.value,
        }
        console.log(`c=${++c}, going to position -> [x=${report.x}, y=${report.y}, z=${report.z}]`)
        await m.goto(point)
        r = it.next()
    }
   

}


main()