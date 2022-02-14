import { keyboardEventEmiter, KeyboardEventEmitter } from "../keyboard/read-keyboard-async"
import { Barcode } from "../barcode/barcode-core"
import { makeBarcodeStream } from '../barcode/barcode-stream'
import { startRouting } from "../matriz-router"
import { fetchMatrizByBarcodeRaw } from "../matriz/matriz-cadastro-geral-reader"
import { Matriz } from "../matriz/matriz"
import { delay } from "../core/delay"
import { getAxisControler } from "../axis-controler"
import { X_AxisStarterKit, Y_AxisStarterKit, Z_AxisStarterKit } from "../axis-starter-kit"
import { AxisControler } from "../axis-controler"
import { makeTunnel, Tunnel } from "../cmpp/transport/tunnel"
import { Address } from "../global-env/global"
import { Machine } from "../machine/machine"
import { SingleAxis } from "../machine/single-axis"
import { x_axis_setup, y_axis_setup, z_axis_setup } from "../machine/axes-setup"


const getMachine = (): Machine => {
    const getTunnelFromAxis = (axisName: keyof Address['Axis']): Tunnel => {
        const { portName, baudRate, channel} = Address[`Axis`][axisName]
        const tunnel = makeTunnel(portName, baudRate, channel)
        return tunnel
    } 
    const X = new SingleAxis(getTunnelFromAxis('XAxis'),x_axis_setup)
    const Y = new SingleAxis(getTunnelFromAxis('YAxis'),y_axis_setup)
    const Z = new SingleAxis(getTunnelFromAxis('ZAxis'),z_axis_setup)
    const machine = new Machine({X,Y,Z})
    return machine
}


const getMatrizFromDB = async (barcode: Barcode): Promise<Matriz> => {
    const matrizMatches = await fetchMatrizByBarcodeRaw(barcode)
    const matriz = await throwIfNotJustOneMatrizWasFound__(matrizMatches)
    return matriz
}

const throwIfNotJustOneMatrizWasFound__ = async (ms: readonly Matriz[]): Promise<Matriz> => 
    new Promise( async (resolve, reject) => {
        const length = ms.length
        if(length===1) {
            // has one item
            resolve(ms[0])
        } else if(length>1) {
            // has many items
            const err = 'Existe mais de uma matriz cadastrada para o mesmo codigo de barras. O programa será encerrado.'
            console.log(err)
            await delay(5000)
            reject(err)
            
        } else {
            const err = 'A matriz lida nao esta cadastrada, o programa será encerrado.'
            console.log(err)
            await delay(5000)
            reject(err)
        }
     })
        

const showKeyStrokesOnScreen = (f: KeyboardEventEmitter): KeyboardEventEmitter => {
    type Args =  Parameters<typeof f>
    type Response = ReturnType<typeof f>
    return (...args: Args):Response => {
        const consumer = args[0]
        const keyboardEventEmiter = f
        keyboardEventEmiter( keyboardEvent => {
            const { sequence } = keyboardEvent
            console.log(sequence)
            consumer(keyboardEvent)
        })

    } 
}

const printHeadText = () => {
    console.log('-------------------------')
    console.log('PROGRAMA INICIADO')
    console.log('-------------------------')
    console.log()
    console.log('Para iniciar a impressao da matriz execute uma das duas operações abaixo:')
    console.log()
    console.log('NOTA: Para finalizar o programa, a qualquer momento, pressione as teclas "ctrl+c" 3 vezes consecutivas.')
    console.log()
    console.log('1) Leia o barcode com o leitor de codigo de barras, ou;')
    console.log('2) Digite o codigo de barras manualmente e em seguida pressione a tecla <enter>. O texto digitado deve estar exatamente igual ao campo cadastrado no cadastro geral. (OBS: Nao utilize as teclas "setas direcionais", "backspace", durante a edição)')
    console.log('-')
}


export type AxisKit = {
    x: AxisControler,
    y: AxisControler,
    z: AxisControler,
} 

const main3 = () => {
    const keyboardEventEmiter__ = showKeyStrokesOnScreen(keyboardEventEmiter)
    printHeadText();
    //TODO: Improve the method of keyboard reading from user, because if it hits 'backspace' key, for example, they will not capture the matrix register 
    makeBarcodeStream(keyboardEventEmiter__)
        .unsafeRun( barcode => {

            const runProgram = async () => {
                const matriz = await getMatrizFromDB(barcode)
                const machine = getMachine()
                await machine.initialize()
                return startRouting(matriz, machine)
            }

            runProgram()

        })
}

//run
main3();