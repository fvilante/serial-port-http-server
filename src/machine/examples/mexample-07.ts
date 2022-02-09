import { Milimeter } from "../../cmpp/physical-dimensions/milimeter"
import { PulsesPerTick, PulsesPerTickSquared } from "../../cmpp/physical-dimensions/physical-dimensions"
import { makeTunnel } from "../../cmpp/transport/tunnel"
import { COMM_Port } from "../../enviroment"
import { x_axis_setup, y_axis_setup, z_axis_setup } from "../axes-setup"
import { Machine} from "../machine"
import { SingleAxis } from "../single-axis"
import { makeRamdomMoviment3D } from "./comom"



const main = async () => {

    console.log('iniciado...')
    const axis = new SingleAxis(makeTunnel(COMM_Port.z, 9600, 1),z_axis_setup)
   
    await axis.initialize()

    await axis.goto({
        position: Milimeter(300),
        speed: PulsesPerTick(3000),
        acceleration: PulsesPerTickSquared(10000),
    })
   

}


main()