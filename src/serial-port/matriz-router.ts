import { delay } from "../utils/delay"
import { Milimeter } from "./axis-position"
import { Printers } from "./global"
import { MovimentKit } from "./machine-controler"
import { getMatrizesConhecidas, Matriz, MatrizesConhecidasKeys } from "./matrizes-conhecidas"
import { programMessage } from "./program-message"
import { executeInSequence, repeatPromiseWithInterval } from "./promise-utils"

//  Responsible to create and execute the routing for perform the printing
//  work over the Matriz


// ----------


const ImprimeLinhaSomenteNoAvancoEInterpolando = async (xi: Milimeter, xf: Milimeter, qtde: number, movimentKit: MovimentKit): Promise<void> => {

    const defaults = { // in pulses
        acAv: 6000,
        acRet: 3000,
        rampa: 640,
        velAv: 1700,
        velRet: 2300, 
    }

    const { acAv, velAv, acRet, velRet, rampa } = defaults

    const {x,y,z,m} = movimentKit

    const xi_InPulses = x._convertMilimeterToPulseIfNecessary(xi)
    const xf_InPulses = x._convertMilimeterToPulseIfNecessary(xf)

    await x._setPrintMessages({
        numeroDeMensagensNoAvanco: qtde,
        posicaoDaPrimeiraMensagemNoAvanco: xi_InPulses,
        posicaoDaUltimaMensagemNoAvanco: xf_InPulses,
        numeroDeMensagensNoRetorno: 0,
        posicaoDaPrimeiraMensagemNoRetorno: 500,
        posicaoDaUltimaMensagemNoRetorno: 500,
    })

    const [minX, maxX] = x._getAbsolutePositionRange()

    const POSINI = xi_InPulses-rampa
    const POSFIN = xf_InPulses+rampa
    const safePOSINI = POSINI < minX ? minX : POSINI
    const safePOSFIM = POSFIN > maxX ? maxX : POSFIN

    console.log(`POSINI=${POSINI}`)
    console.log(`POSFIN=${POSFIN}`)

    await x.goToAbsolutePosition(safePOSFIM, (v,a) =>[velAv,acAv] )
    await x.goToAbsolutePosition(safePOSINI, (v,a) => [velRet,acRet])
    await x._clearPrintingMessages() //FIX: should be unnecessary

    return

}


const performMatriz = async (matriz: Matriz, movimentKit: MovimentKit): Promise<void> => {
        
    const {
        printer,
        remoteFieldId,
        msg,
        zLevel,
        linhasY,
    } = matriz

    const {x,y,z,m} = movimentKit
    const [minZ, maxZ] = z._getAbsolutePositionRange()

    const doASingleXLine = async (yPos: Milimeter, impressoesX: Matriz['impressoesX'], movimentKit: MovimentKit): Promise<void> => {

        const {x,y,z,m} = movimentKit

        // Fix: Velocity must not be a constant
        const fazLinhaXUmaVezInteira = async (movimentKit: MovimentKit, impressoes: Matriz['impressoesX']):Promise<void> => {

            const [minX, maxX] = x._getAbsolutePositionRange()
            
            await x.goToAbsolutePosition(minX)
            const PRIMEIRA = 0
            const ULTIMA = impressoes.length-1
            const positionFirstMessage = impressoes[PRIMEIRA]
            const positionLastMessage = impressoes[ULTIMA]
            const numberOfMessages = impressoes.length
            await ImprimeLinhaSomenteNoAvancoEInterpolando(positionFirstMessage, positionLastMessage, numberOfMessages, movimentKit)
            await x.goToAbsolutePosition(minX)
                
            return
                    
        }

        
        const fazLinhaXPreta = async (movimentKit: MovimentKit, impressoes: Matriz['impressoesX']):Promise<void> => {
            await fazLinhaXUmaVezInteira(movimentKit, impressoes)
        }
        
        const fazLinhaXBranca = async (movimentKit: MovimentKit, impressoes: Matriz['impressoesX']):Promise<void> => {
            await fazLinhaXUmaVezInteira(movimentKit, impressoes)
            await fazLinhaXUmaVezInteira(movimentKit, impressoes)          
        }

        const printAtAParticularYanXLinInAnyColor = async (printer: Printers, modelo: Matriz['impressoesX']): Promise<void> => {
            if (printer==='printerWhite') {
                await fazLinhaXBranca(movimentKit,modelo)
            } else {
                // printer==='printerBlack'
                await fazLinhaXPreta(movimentKit, modelo)
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
            await doASingleXLine(yPos,ajusted_impressoesX, movimentKit)
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
const performMatrizByItsMsg = async (matrizMessage: MatrizesConhecidasKeys, movimentKit: MovimentKit): Promise<void> => {
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
                await delay(intervalMS) 
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
