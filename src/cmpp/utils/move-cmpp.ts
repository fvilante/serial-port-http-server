import { x_axis_setup } from "../../machine/axes-setup";
import { SingleAxis } from "../../machine/single-axis";
import { Pulses } from "../physical-dimensions/base";
import { PulsesPerTick, PulsesPerTickSquared } from "../physical-dimensions/physical-dimensions";
import { Tunnel } from "../transport/tunnel";


const main = async () => {

    const tunnel: Tunnel = {
        channel: 0,
        portSpec: {
            path: 'com6',
            baudRate: 9600,
        }
    }
    const axis = new SingleAxis(tunnel, x_axis_setup)


    console.log(`Inicializando...`)
    console.table(tunnel)
    await axis.initialize()
    await axis.goto({
        position: Pulses(500),
        speed: PulsesPerTick(5000),
        acceleration: PulsesPerTickSquared(9000),
    })


}


main();