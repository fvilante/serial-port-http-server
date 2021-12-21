import { delay } from "./core/delay"
import { AxisControler } from "./axis-controler"
import { Milimeter } from "./axis-controler"
import { Printers } from "./global-env/global"
import { AxisKit, MovimentKit } from "./machine-controler"
import { getMatrizesConhecidas, Matriz, MatrizesConhecidasKeys } from "./matrix-reader/matrizes-conhecidas"
import { programMessage } from "./printer/program-message"
import { executeInSequence, repeatPromiseWithInterval } from "./core/promise-utils"

//  Responsible to create and execute the routing for perform the printing
//  work over the Matriz


// ----------

// Fix: reduce number of parameters extracting it to types
export const ImprimeLinhaSomenteNoAvancoEInterpolando = async (
    primeiraMensagem: Milimeter, 
    ultimaMensagem: Milimeter, 
    velocidadeDeImpressaoStepsPerSecond: number, 
    rampaInSteps: number,
    numeroDeMensagens: number, 
    xControler: AxisControler
    ): Promise<void> => {

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

    //console.log(`POSINI=${POSINI}`)
    //console.log(`POSFIN=${POSFIN}`)

    await x.goToAbsolutePosition(safePOSFIM, (v,a) =>[velocidadeDeImpressaoStepsPerSecond,acAv] )
    await x.goToAbsolutePosition(safePOSINI, (v,a) => [velRet,acRet])
    await x._clearPrintingMessages() //FIX: should be unnecessary

    return

}


export const performMatriz = async (matriz: Matriz, axisKit: AxisKit): Promise<void> => {
        
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
        const fazLinhaXUmaVezInteira = async (axisKit: AxisKit, impressoes: Matriz['impressoesX']):Promise<void> => {

            const [minX, maxX] = x._getAbsolutePositionRange()
            await x.goToAbsolutePosition(minX)
            const PRIMEIRA = 0
            const ULTIMA = impressoes.length-1
            const positionFirstMessage = impressoes[PRIMEIRA]
            const positionLastMessage = impressoes[ULTIMA]
            const numberOfMessages = impressoes.length
            const velocidadeDeImpressaoStepsPerSecond = matriz.printVelocity
            const rampa = 640
            await ImprimeLinhaSomenteNoAvancoEInterpolando(
                positionFirstMessage, 
                positionLastMessage, 
                velocidadeDeImpressaoStepsPerSecond,
                rampa,
                numberOfMessages,
                x)
            await x.goToAbsolutePosition(minX)            
            return
                    
        }

        
        const fazLinhaXPreta = async (axisKit: AxisKit, impressoes: Matriz['impressoesX']):Promise<void> => {
            await fazLinhaXUmaVezInteira(axisKit, impressoes)
        }
        
        const fazLinhaXBranca = async (axisKit: AxisKit, impressoes: Matriz['impressoesX']):Promise<void> => {
            await fazLinhaXUmaVezInteira(axisKit, impressoes)
            await fazLinhaXUmaVezInteira(axisKit, impressoes)          
        }

        const printAtAParticularYanXLinInAnyColor = async (printer: Printers, modelo: Matriz['impressoesX']): Promise<void> => {
            if (printer==='printerWhite') {
                await fazLinhaXBranca(axisKit,modelo)
            } else {
                // printer==='printerBlack'
                await fazLinhaXPreta(axisKit, modelo)
            }
            return
        }

        //position y
        await y.goToAbsolutePosition(yPos)
        //do the line
        //const iInPulses = convertImpressoesMM2Pulse(impressoesX)
        await printAtAParticularYanXLinInAnyColor(printer,impressoesX)

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

// helper
export const performMatrizByItsMsg = async (matrizMessage: MatrizesConhecidasKeys, movimentKit: MovimentKit): Promise<void> => {
    const matriz = getMatrizesConhecidas()[matrizMessage]()
    return performMatriz(matriz, movimentKit)
}

// drawer work concept

type Drawer = 'Drawer1' | 'Drawer2'
export type DrawerWork = MatrizesConhecidasKeys[]

const doSingleDrawerWork = async (drawer: Drawer, matrizes: readonly MatrizesConhecidasKeys[], movimentKit: MovimentKit): Promise<void> => {
    const {x,y,z,m} = movimentKit
    
    await m.safelyReferenceSystemIfNecessary()
    const allMatrizesForSingleDrawer = matrizes.map( matriz => () => {
        return performMatrizByItsMsg(matriz, movimentKit)
    })
    await executeInSequence(allMatrizesForSingleDrawer)

}

// batch work concept
// Fix: Develop and extract the concept of "batch"
//      Maybe you expose the concept to the CLI with the intention to provide an "Excetion-Mode" for
//      the Machine

export type Batch = DrawerWork[]
export const doBatchWork = (batch: Batch, intervalMS: number, repetition: number, movimentKit: MovimentKit) => {
    const arr = batch.map( drawerWork => async () => {
        return await doSingleDrawerWork('Drawer1',drawerWork, movimentKit)
            .then( async () => { 
                console.log(`contando tempo... ${intervalMS}ms`)
                await delay(intervalMS) 
                console.log(`tempo esgotado.`)
            })
    })
    const oneBatch = () => executeInSequence(arr)
    const run = () => repeatPromiseWithInterval(
        oneBatch,
        repetition,
        intervalMS,
    )
    return run()
}
