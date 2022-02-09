import { AxisControler } from "./axis-controler"
import { Milimeter } from "./cmpp/physical-dimensions/milimeter"
import { AxisKit } from "./main/main3"
import { Matriz } from "./matriz/matriz"
import { programMessage } from "./printer/program-message"
import { executeInSequence } from "./core/promise-utils"

//  Responsible to create and execute the routing for perform the printing
//  work over the Matriz


// ----------

type PrintLineArgument = { 
    primeiraMensagem: Milimeter; 
    ultimaMensagem: Milimeter; 
    velocidadeDeImpressaoStepsPerSecond: number; 
    rampaInSteps: number; 
    numeroDeMensagens: number; 
    xControler: AxisControler 
}   

// TODO: reduce number of parameters extracting it to types
// NOTE: Algorithm => Imprime Linha Somente No Avanco E Interpolando
export const PrintLine = async ( arg: PrintLineArgument ): Promise<void> => {
    const { primeiraMensagem, ultimaMensagem, velocidadeDeImpressaoStepsPerSecond, rampaInSteps, numeroDeMensagens, xControler } = arg
    const defaults = { // in pulses
        acAv: 6000,
        acRet: 3000,
        // rampa: 640, // in steps
        //velAv: 1700, // Fix: remove thsi, because we are getting this by parameter
        velRet: 2300, 
    }

    const { acAv, /*velAv,*/ acRet, velRet,/*rampa*/ } = defaults

    const x = xControler

    const xi_InPulses = x._convertMilimeterToPulseIfNecessary(primeiraMensagem)
    const xf_InPulses = x._convertMilimeterToPulseIfNecessary(ultimaMensagem)

    await x._setPrintMessages({
        numeroDeMensagensNoAvanco: numeroDeMensagens,
        posicaoDaPrimeiraMensagemNoAvanco: xi_InPulses,
        posicaoDaUltimaMensagemNoAvanco: xf_InPulses,
        numeroDeMensagensNoRetorno: 0,
        posicaoDaPrimeiraMensagemNoRetorno: 500,
        posicaoDaUltimaMensagemNoRetorno: 500,
    })

    const [minX, maxX] = x._getAbsolutePositionRange()

    const POSINI = xi_InPulses-rampaInSteps
    const POSFIN = xf_InPulses+rampaInSteps
    const safePOSINI = POSINI < minX ? minX : POSINI
    const safePOSFIM = POSFIN > maxX ? maxX : POSFIN

    await x.goToAbsolutePosition(safePOSFIM, (v,a) =>[velocidadeDeImpressaoStepsPerSecond,acAv] )
    await x.goToAbsolutePosition(safePOSINI, (v,a) => [velRet,acRet])
    await x._clearPrintingMessages() //FIX: should be unnecessary

    return

}


export const startRouting = async (matriz: Matriz, axisKit: AxisKit): Promise<void> => {
        
    const {
        printer,
        remoteFieldId,
        msg,
        zLevel,
        linhasY,
    } = matriz

    const {x,y,z} = axisKit
    const [minZ, maxZ] = z._getAbsolutePositionRange()

    const doASingleXLine = async (yPos: Milimeter, impressoesX: Matriz['impressoesX'], axisKit: AxisKit): Promise<void> => {

        const {x,y,z} = axisKit

        // Fix: Velocity must not be a constant
        const fazLinhaXUmaVezInteira = async (impressoes: Matriz['impressoesX']):Promise<void> => {

            const [minX, maxX] = x._getAbsolutePositionRange()
            await x.goToAbsolutePosition(minX)
            const PRIMEIRA = 0
            const ULTIMA = impressoes.length-1
            const positionFirstMessage = impressoes[PRIMEIRA]
            const positionLastMessage = impressoes[ULTIMA]
            const numberOfMessages = impressoes.length
            const velocidadeDeImpressaoStepsPerSecond = matriz.printVelocity
            const rampa = 640
            await PrintLine(
                { primeiraMensagem: positionFirstMessage, ultimaMensagem: positionLastMessage, velocidadeDeImpressaoStepsPerSecond, rampaInSteps: rampa, numeroDeMensagens: numberOfMessages, xControler: x })
            await x.goToAbsolutePosition(minX)            
            return
                    
        }

        //prepare y position
        await y.goToAbsolutePosition(yPos)
        //do the line
        if (printer==='printerWhite') {
            // white ink requires two print pass to obtain adequate color contrast
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
            await doASingleXLine(yPos,ajusted_impressoesX, axisKit)
        })
        await executeInSequence(fazTodasAsLinhas)

        //
        console.log('Trabalho finalizado')

    }


    // program printers
    await programMessage(printer, remoteFieldId, msg)
    // release Z
    const zLevelInPulses = minZ+z._convertMilimeterToPulseIfNecessary(zLevel)
    await z.goToAbsolutePosition(zLevelInPulses);
    await doAllYLinesIncludingItsXLine(matriz)
    // sobe Z
    await z.goToAbsolutePosition(minZ);

}


// TODO: Implement the drawer (1 or 2) work concept

// TODO: Develop and extract the concept of "batch work". Perfom same job multiples times (?!?!) (Maybe this comment should be ignore and deleted in the future!)
//      Maybe you expose the concept to the CLI with the intention to provide an "Excetion-Mode" for
//      the Machine
