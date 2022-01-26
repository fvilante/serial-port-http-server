import { makeTunnel } from "../../cmpp/transport/tunnel"
import { Machine} from "../machine"
import { SingleAxis } from "../single-axis"
import { makeRamdomMoviment3D } from "./comom"

const COMM_Port = {
    x: 'com53',
    y: 'com50',
    z: 'com48',
} as const

const main = async () => {

    console.log('iniciado...')
    const axisX = new SingleAxis(makeTunnel(COMM_Port.x, 9600, 1),`Eixo_X`)
    const axisY = new SingleAxis(makeTunnel(COMM_Port.y, 9600, 1),`Eixo_Y`)
    const axisZ = new SingleAxis(makeTunnel(COMM_Port.z, 9600, 1),`Eixo_Z`)

    const m = new Machine({X: axisX, Y: axisY, Z: axisZ})
    
    await m.initialize()
    const it = makeRamdomMoviment3D()
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
        //r = it.next()
    }
   

}


main()