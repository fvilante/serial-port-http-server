import { makeTunnel } from "../../cmpp/transport/tunnel"
import { COMM_Port } from "../../enviroment"
import { x_axis_setup, y_axis_setup, z_axis_setup } from "../axes-setup"
import { Machine} from "../machine"
import { SingleAxis } from "../single-axis"
import { makeRamdomMoviment3D } from "./comom"


const main = async () => {

    console.log('iniciado...')
    const axisX = new SingleAxis(makeTunnel(COMM_Port.x, 9600, 1),x_axis_setup)
    const axisY = new SingleAxis(makeTunnel(COMM_Port.y, 9600, 1),y_axis_setup)
    const axisZ = new SingleAxis(makeTunnel(COMM_Port.z, 9600, 1),z_axis_setup)

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