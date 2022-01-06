import { Moviment } from "../../cmpp/controlers/core";
import { Pulses } from "../../cmpp/physical-dimensions/base";
import { PulsesPerTick, PulsesPerTickSquared } from "../../cmpp/physical-dimensions/physical-dimensions";
import { makeTunnel } from "../../cmpp/transport/tunnel";
import { random } from "../../core/utils";
import { SingleAxis } from "../single-axis";

let axisCounter = 0
let allCatchedErrors: readonly any[] = []
let iterationConunter = 0

const runTest = async (port: string) => {
    const axis = new SingleAxis(makeTunnel(port, 9600, 0),`Eixo_Teste_#${axisCounter++}`)

    const gotoSafe = async (m: Moviment) => {
        const tolerance = [Pulses(3), Pulses(3)] as const// lower and upper bound respectively
        return await axis.goto(m, tolerance)
    }

    function* randomMoviment():Generator<Moviment, void, unknown> {
        const AXIS_MIN_POSITION = 500
        const AXIS_MAX_POSITION = 2300
        while(true) {
            yield {
                position: Pulses(random(AXIS_MIN_POSITION, AXIS_MAX_POSITION)),
                speed: PulsesPerTick(5000),
                acceleration: PulsesPerTickSquared(20000),
            }
        }
    }

    const itor = randomMoviment()
    let currentPosition_: number | undefined = undefined
    while(true) {
        const x = itor.next()
        if (x.done) break;
        const nextMoviment = x.value
        //const expectedPosition = nextMoviment.position.value
        // header
        //const beforePosition = (await axis.getCurrentPosition()).value
        iterationConunter++
        //console.log(`${port}/indo para=`, expectedPosition)
        //console.log(`${port}/current position (before)=`, beforePosition)
        const beforeStatus = (await axis.getMovimentStatus())
        //console.log(`${port}/current status (before)=`, beforeStatus)
        
        // body
        try {
            currentPosition_ = (await gotoSafe(nextMoviment)).value
        } catch (err) {
            allCatchedErrors = [...allCatchedErrors, [port, err]]
            console.log({port, err})
        }
        // footer
        //const afterPosition = (await axis.getCurrentPosition()).value
        //console.log(`${port}/current position (after)=`, afterPosition)
        //const afterStatus = (await axis.getMovimentStatus())
        //console.log(`${port}/current status (after)=`, afterStatus)
        
        //const currentStatus = await axis.getMovimentStatus()
        //console.log('finalizado=',{
        //    port,
        //    currentPosition: currentPosition_,
        //    expectedPosition,
        //    currentStatus
        //})

    }
     
    await axis.powerOff()
}

const  main = async () => {

   

    const runAndCaptureError = async (port: string) => {
        try {
            await runTest(port)
        } catch (err) {
            allCatchedErrors = [...allCatchedErrors, [port, err]]
        }
    }

    setInterval( () => {
        console.log('***********************')
        console.log('iteracoes=', iterationConunter)
        console.log(allCatchedErrors)
        console.log('***********************')
    },10000)
    
    await Promise.all([
        runAndCaptureError('com50'),
        runAndCaptureError('com51'),
        runAndCaptureError('com48'),
    ])
    

   

}


main()