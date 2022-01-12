import { Pulses } from "../../cmpp/physical-dimensions/base";
import { PulsesPerTick, PulsesPerTickSquared } from "../../cmpp/physical-dimensions/physical-dimensions";
import { makeTunnel } from "../../cmpp/transport/tunnel";
import { SingleAxis } from "../single-axis";



const main = async () => {
    const axis = new SingleAxis(makeTunnel('com50', 9600, 0),'Eixo_Teste')
    console.log('eixo criado')
    //
    console.log('iniciando')
    await axis.initialize()
    console.log('iniciado!')
    await axis.shutdown()
    const pos2 = await axis.initialize()
    const pos3 = await axis.goto({
        position: Pulses(2300),
        speed: PulsesPerTick(1000),
        acceleration: PulsesPerTickSquared(5000),
    })
    const pos4 = await axis.goto({
        position: Pulses(3300),
        speed: PulsesPerTick(1000),
        acceleration: PulsesPerTickSquared(5000),
    })
    console.log('pos4=',pos4.value)
    console.log('powering off')
    await axis.shutdown()
    console.log('fim')
}

main()
