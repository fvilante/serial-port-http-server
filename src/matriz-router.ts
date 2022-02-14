import { AxisControler } from "./axis-controler"
import { Milimeter } from "./cmpp/physical-dimensions/milimeter"
import { Matriz } from "./matriz/matriz"
import { programMessage } from "./printer/program-message"
import { executeInSequence } from "./core/promise-utils"
import { Machine } from "./machine/machine"
import { Pulses } from "./cmpp/physical-dimensions/base"
import { PulsesPerTick, PulsesPerTickSquared, Pulses_ } from "./cmpp/physical-dimensions/physical-dimensions"
import { Kinematics } from "./cmpp/controlers/core"
import { SingleAxis } from "./machine/single-axis"

//  Responsible to create and execute the routing for perform the printing
//  work over the Matriz


// ----------

type PrintLineArgument = { 
    primeiraMensagem: Milimeter
    ultimaMensagem: Milimeter 
    velocidadeDeImpressao: PulsesPerTick 
    rampa: Pulses 
    numeroDeMensagens: number 
    xControler: SingleAxis 
}   

// TODO: reduce number of parameters extracting it to types
// NOTE: Algorithm => Imprime Linha Somente No Avanco E Interpolando
export const PrintLine = async ( arg: PrintLineArgument ): Promise<void> => {
    const { 
        primeiraMensagem, 
        ultimaMensagem, 
        velocidadeDeImpressao, 
        rampa, 
        numeroDeMensagens, 
        xControler 
    } = arg

    const defaults = { // in pulses
        aceleracaoDeAvanco: PulsesPerTickSquared(6000),
        aceleracaoDeRetorno: PulsesPerTickSquared(3000),
        // rampa: 640, // in steps
        //velAv: 1700, // Fix: remove this, because we are getting this by parameter
        velocidadeDeRetorno: PulsesPerTick(2300), 
    }

    const x = xControler

    const xi_InPulses = x.__convertMilimetersToPulse(primeiraMensagem)
    const xf_InPulses = x.__convertMilimetersToPulse(ultimaMensagem)

    await x.setPrintings({
        numeroDeMensagensNoAvanco: numeroDeMensagens,
        posicaoDaPrimeiraMensagemNoAvanco: xi_InPulses,
        posicaoDaUltimaMensagemNoAvanco: xf_InPulses,
        numeroDeMensagensNoRetorno: 0,
        posicaoDaPrimeiraMensagemNoRetorno: Pulses(500), //NOTE: not unused, there is not "printing on return" in the current routing method
        posicaoDaUltimaMensagemNoRetorno: Pulses(500), //NOTE: not unused, there is not "printing on return" in the current routing method
    })

    const { min: minX, max: maxX } = x.axisSetup.absoluteRange

    const POSINI = Pulses(xi_InPulses.value - rampa.value)
    const POSFIN = Pulses(xf_InPulses.value + rampa.value)
    const safePOSINI = POSINI < minX ? minX : POSINI
    const safePOSFIM = POSFIN > maxX ? maxX : POSFIN

    // avança X
    await x.goto({
        position: safePOSFIM,
        speed: velocidadeDeImpressao,
        acceleration: defaults.aceleracaoDeAvanco,
    }) 
    // retorna X
    await x.goto({
        position: safePOSINI,
        speed: defaults.velocidadeDeRetorno,
        acceleration: defaults.aceleracaoDeRetorno,
    }) 
    // reseta impressao
    await x.resetPrintings() //TODO: for performance reason this line may be performed in paralel with y axis moviment

    return

}


export const startRouting = async (matriz: Matriz, machine: Machine): Promise<void> => {
        
    const {
        printer,
        remoteFieldId,
        msg,
        zLevel,
        linhasY,
    } = matriz

    

    //TODO: Justify or eliminate the need for this legacy parameters
    const legacyParameters = {
        minZ: 610, //NOTE: Represents the minimum clear position (in pulses) that can be reached by z Axis
        z: {
            speed: 400,
            acceleration: 5000,
        },
        y: {
            speed: 1000,
            acceleration: 1500,
        },
        x: {
            speed: 2000,
            acceleration: 4000,
        },
    } as const

    const doASingleXLine = async (yPos: Milimeter, impressoesX: Matriz['impressoesX']): Promise<void> => {

        // Fix: Velocity must not be a constant
        const fazLinhaXUmaVezInteira = async (impressoes: Matriz['impressoesX']):Promise<void> => {

            // put x at the begining position
            const minX = machine.axis.X.axisSetup.absoluteRange.min //NOTE: Represents the minimum clear position (in pulses) that can be reached by x Axis
            await machine.goto({
                X: {
                    position: minX,
                    speed: PulsesPerTick(legacyParameters.x.speed),
                    acceleration: PulsesPerTickSquared(legacyParameters.x.acceleration),
                }
            })
            //
            const PRIMEIRA = 0
            const ULTIMA = impressoes.length-1
            const primeiraMensagem = impressoes[PRIMEIRA]
            const ultimaMensagem = impressoes[ULTIMA]
            const numeroDeMensagens = impressoes.length
            const velocidadeDeImpressao = PulsesPerTick(matriz.printVelocity)
            const rampa = Pulses(640)
            await PrintLine({ 
                primeiraMensagem, 
                ultimaMensagem, 
                velocidadeDeImpressao, 
                rampa, 
                numeroDeMensagens, 
                xControler: machine.axis.X
            })
            // return carrige of the x to the begining position
            await machine.goto({
                X: {
                    position: minX,
                    speed: PulsesPerTick(legacyParameters.x.speed),
                    acceleration: PulsesPerTickSquared(legacyParameters.x.acceleration),
                }
            })  
            return
                    
        }

        //prepare y position
        await machine.goto({
            Y: {
                position: yPos,
                speed: PulsesPerTick(legacyParameters.y.speed),
                acceleration: PulsesPerTickSquared(legacyParameters.y.acceleration),
            }
        })
        
        //do the line
        if (printer==='printerWhite') {
            // the white ink requires two print pass to obtain adequate color contrast
            await fazLinhaXUmaVezInteira(impressoesX)
            await fazLinhaXUmaVezInteira(impressoesX)    
        } else /*printer==='printerBlack'*/ {
            // black ink just one print pass
            await fazLinhaXUmaVezInteira(impressoesX)
        }
        return

    }

    const doAllYLinesIncludingItsXLine = async (matriz: Matriz): Promise<void> => {

        // esta funcao é importante, ela compensa a falta de ortogonalidade entre a mecanica do eixo X e Y, 
        // possivelmente será necessário uma funcao desta por gaveta
        const compensateLackOfAxisXYOrtogonality = (yPos: Milimeter, xsPos: Matriz['impressoesX']): Matriz['impressoesX'] => {
            // x=+1.20mm em y=+420mm
            const x_ = 1.20//1.84
            const y_ = 420//420
            const yPosInMM = yPos.value
            
            const deltaInMM = Milimeter((yPosInMM)*(x_/y_))
            const newXs = xsPos.map( x => Milimeter(x.value+deltaInMM.value))
            return newXs
        }

        console.log('=========== [Iniciando Trabalho:] ===========')
        console.table(matriz)

        const impressoesX = matriz.impressoesX
       
        // executa linhas
        const fazTodasAsLinhas = linhasY.map( yPos => async () => {
            const ajusted_impressoesX = compensateLackOfAxisXYOrtogonality(yPos, impressoesX)
            await doASingleXLine(yPos,ajusted_impressoesX)
        })
        await executeInSequence(fazTodasAsLinhas)

        //
        console.log('Trabalho finalizado')

    }

    const moveDownZAxis = async () => {
        // release Z
        const matrixRegistryZLevel_InPulses = machine.axis.Z.__convertMilimetersToPulse(zLevel).value
        const zLevelInPulses = Pulses(legacyParameters.minZ+matrixRegistryZLevel_InPulses)
        await machine.goto({
            Z: {
                position: zLevelInPulses,
                speed: PulsesPerTick(legacyParameters.z.speed),
                acceleration: PulsesPerTickSquared(legacyParameters.z.acceleration),
            }
        })
    }

    const moveUpZAxis = async () => {
        await machine.goto({
            Z: {
                position: Pulses(legacyParameters.minZ),
                speed: PulsesPerTick(legacyParameters.z.speed),
                acceleration: PulsesPerTickSquared(legacyParameters.z.acceleration),
            }
        })
    }


    // program printers
    await programMessage(printer, remoteFieldId, msg)
    // desce Z
    await moveDownZAxis()
    // performa toda a matriz
    await doAllYLinesIncludingItsXLine(matriz)
    // sobe Z
    await moveUpZAxis()
}


// TODO: Implement the drawer (1 or 2) work concept

// TODO: Develop and extract the concept of "batch work". Perfom same job multiples times (?!?!) (Maybe this comment should be ignore and deleted in the future!)
//      Maybe you expose the concept to the CLI with the intention to provide an "Excetion-Mode" for
//      the Machine
