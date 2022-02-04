import { makeTunnel, Tunnel } from "../cmpp/transport/tunnel"
import { Address } from "../global-env/global"
import { x_axis_setup, y_axis_setup, z_axis_setup } from "../machine/axes-setup"
import { Machine } from "../machine/machine"
import { SingleAxis } from "../machine/single-axis"

const getTunnelFromAxis = (axisName: keyof Address['Axis']): Tunnel => {
    const { portName, baudRate, channel} = Address[`Axis`][axisName]
    const tunnel = makeTunnel(portName, baudRate, channel)
    return tunnel
} 

const getMachine = (): Machine => {
    const X = new SingleAxis(getTunnelFromAxis('XAxis'),x_axis_setup)
    const Y = new SingleAxis(getTunnelFromAxis('YAxis'),y_axis_setup)
    const Z = new SingleAxis(getTunnelFromAxis('ZAxis'),z_axis_setup)
    const machine = new Machine({X,Y,Z})
    return machine
}

const main2 = async () => {
    console.log('Iniciado')
    console.log('Obtendo kit de movimento da maquina...')
    const machine = getMachine()
    //await machine.shutdown() // take care shudown() will unenergize vertical axis (Z-axis) 
    console.log('Referenciando a maquina...')
    await machine.initialize()
    console.log('Maquina referenciada.')
}

main2()