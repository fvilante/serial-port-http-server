import { delay } from "../utils/delay"
import { Milimeter, Step } from "./axis-position"
import { Address, Printers } from "./global"
import { getMatrizesConhecidas, Matriz, MatrizesConhecidasKeys } from "./matrizes-conhecidas"
import { makeMovimentKit, MovimentKit } from "./machine-controler"
import { executeInSequence, repeatPromiseWithInterval } from "./promise-utils"
import { sendPrinter2 } from "./send-receive-printer"

type ImprimeParPrintingParameters = {
    x0: number // pulses
    x1: number
    rampa: number
    velAv: number, // pulses
    acAv: number, // pulses
    velRet: number,
    acRet: number,
}

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


const programMessage = async (printer: Printers,remoteFieldId: number, msg: string): Promise<[remoteFieldId: number, msg: string]> => {
    const printerToEnable = printer
    const printerToDisable:Printers = printer === 'printerBlack' ? 'printerWhite' : 'printerBlack'
    const e = Address['Printers'][printerToEnable]
    const d = Address['Printers'][printerToDisable]
    const emptyMessage = ''
    await sendPrinter2(e.portName, e.baudRate)(remoteFieldId,msg)
    //await sendPrinter2(d.portName, d.baudRate)(remoteFieldId,emptyMessage)
    await delay(500) // FIX: this delay May be unecessary
    return [remoteFieldId, msg]
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

            const defaults: ImprimeParPrintingParameters = {
                x0: 0,
                x1: 0,
                acAv: 3000,
                acRet: 3000,
                rampa: 640,
                velAv: 1700,
                velRet: 2300, 
            }

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

type Drawer = 'Drawer1' | 'Drawer2'

const doSingleDrawerWork = async (drawer: Drawer, matrizes: readonly MatrizesConhecidasKeys[], movimentKit: MovimentKit): Promise<void> => {
    const {x,y,z,m} = movimentKit
    
    await m.safelyReferenceSystemIfNecessary()
    const allMatrizesForSingleDrawer = matrizes.map( matriz => () => {
        return performMatrizByItsMsg(matriz, movimentKit)
    })
    await executeInSequence(allMatrizesForSingleDrawer)

}

type DrawerWork = MatrizesConhecidasKeys[]
type Batch = DrawerWork[]
const doBatchWork = (batch: Batch, intervalMS: number, repetition: number, movimentKit: MovimentKit) => {
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



const main2 = async () => {
    console.log('Iniciado')
    console.log('Obtendo kit de movimento...')
    const movimentKit = await makeMovimentKit()
    const {x,y,z,m} = movimentKit
    const [minX, maxX] = x._getAbsolutePositionRange()
    const [minY, maxY] = y._getAbsolutePositionRange()
    const [minZ, maxZ] = y._getAbsolutePositionRange()

   
    const repeticoesDeLote = 10
    const tempoDeAbastecimento = 20*1000
    const P3: DrawerWork = ['P3'] //['P3'] ['25401'] //['2559371', 'M1']
    const Termo371: DrawerWork = ['2559371', 'M1']
    const Termo370: DrawerWork = ['2559370', 'M1']
    const T125: DrawerWork = ['T125']
    const lote: Batch = [ ['P3'], ['V120'] ]
    
    doBatchWork(lote, tempoDeAbastecimento, repeticoesDeLote, movimentKit)

}

main2()