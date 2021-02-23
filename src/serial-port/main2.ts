import { delay } from "../utils/delay"
import { Milimeter } from "./axis-position"
import { Address, Printers } from "./global"
import { ImpressoesX } from "./imprime-matriz"
import { getKnownJobs, Job__, KnownJobsKeys } from "./known-jobs"
import { makeMovimentKit, MovimentKit } from "./machine-controler"
import { executeInSequence, repeatPromiseWithInterval } from "./promise-utils"
import { Range } from "./utils"
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

const ImprimePar = async (p: ImprimeParPrintingParameters, movimentKit: MovimentKit): Promise<void> => {
        
    const {x,y,z,m} = movimentKit
    const {x0,x1,rampa,velAv, acAv, velRet, acRet} = p

    await x._setPrintMessages({
        numeroDeMensagensNoAvanco: 2,
        numeroDeMensagensNoRetorno: 0,
        posicaoDaPrimeiraMensagemNoAvanco: x0,
        posicaoDaUltimaMensagemNoAvanco: x1,
        posicaoDaPrimeiraMensagemNoRetorno: 500,
        posicaoDaUltimaMensagemNoRetorno: 500,
    })

    const [minX, maxX] = x._getAbsolutePositionRange()

    const POSFIN = x1+rampa
    const POSINI = x0-rampa
    const safePOSINI = POSINI < minX ? minX : POSINI
    const safePOSFIM = POSFIN > maxX ? maxX : POSFIN

    await x.goToAbsolutePosition(safePOSFIM, (v,a) =>[velAv,acAv] )
    await x.goToAbsolutePosition(safePOSINI, (v,a) => [velRet,acRet])
    //await x._clearPrintingMessages() //FIX: should be unnecessary

    return
}

const ImprimeLinhaInterpolando = async (xi: number, xf: number, qtde: number, movimentKit: MovimentKit): Promise<void> => {

    const defaults: ImprimeParPrintingParameters = {
        x0: 0,
        x1: 0,
        acAv: 6000,
        acRet: 3000,
        rampa: 640,
        velAv: 1700,
        velRet: 2300, 
    }

    const { acAv, velAv, acRet, velRet, rampa } = defaults

    const {x,y,z,m} = movimentKit

    await x._setPrintMessages({
        numeroDeMensagensNoAvanco: qtde,
        posicaoDaPrimeiraMensagemNoAvanco: xi,
        posicaoDaUltimaMensagemNoAvanco: xf,
        numeroDeMensagensNoRetorno: 0,
        posicaoDaPrimeiraMensagemNoRetorno: 500,
        posicaoDaUltimaMensagemNoRetorno: 500,
    })

    const [minX, maxX] = x._getAbsolutePositionRange()

    const POSFIN = xf+rampa
    const POSINI = xi-rampa
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
    await sendPrinter2(d.portName, d.baudRate)(remoteFieldId,emptyMessage)
    await delay(500) // FIX: this delay May be unecessary
    return [remoteFieldId, msg]
}


const performJob = async (job: Job__, movimentKit: MovimentKit): Promise<void> => {
        
    const {
        printer,
        remoteFieldId,
        msg,
        zLevel,
        linhasY,
    } = job

    const {x,y,z,m} = movimentKit
    const [minZ, maxZ] = z._getAbsolutePositionRange()

    const doASingleXLine = async (yPos: Milimeter, impressoesX: ImpressoesX, movimentKit: MovimentKit): Promise<void> => {

        const {x,y,z,m} = movimentKit

        // Fix: Velocity must not be a constant
        const fazLinhaXUmaVezInteira = async (movimentKit: MovimentKit, impressoes: ImpressoesX):Promise<void> => {

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

            const p1 = {...defaults, x0: impressoes[0][0], x1: impressoes[0][1]}
            const p2 = {...defaults, x0: impressoes[1][0], x1: impressoes[1][1]}
            const p3 = {...defaults, x0: impressoes[2][0], x1: impressoes[2][1]}
            
            await x.goToAbsolutePosition(minX)
            const positionFirstMessage = p1.x0
            const positionLastMessage = p3.x1
            await ImprimeLinhaInterpolando(positionFirstMessage, positionLastMessage, 6, movimentKit)
            //await ImprimePar(p1, movimentKit )
            //await ImprimePar(p2, movimentKit )
            //await ImprimePar(p3, movimentKit )
            await x.goToAbsolutePosition(minX)
                
            return
                    
        }

        
        const fazLinhaXPreta = async (movimentKit: MovimentKit, impressoes: ImpressoesX):Promise<void> => {
            await fazLinhaXUmaVezInteira(movimentKit, impressoes)
        }
        
        const fazLinhaXBranca = async (movimentKit: MovimentKit, impressoes: ImpressoesX):Promise<void> => {
            await fazLinhaXUmaVezInteira(movimentKit, impressoes)
            await fazLinhaXUmaVezInteira(movimentKit, impressoes)          
        }

        const printAtAParticularYanXLinInAnyColor = async (printer: Printers, modelo: ImpressoesX): Promise<void> => {
            if (printer==='printerWhite') {
                await fazLinhaXBranca(movimentKit,modelo)
            } else {
                // printer==='printerBlack'
                await fazLinhaXPreta(movimentKit, modelo)
            }
            return
        }

        const convertImpressoesMM2Pulse = (iMM: ImpressoesX): ImpressoesX => {
            const iPulses = iMM.map( par => par.map( i => x._convertMilimeterToPulseIfNecessary(Milimeter(i)))) as unknown as ImpressoesX
            return iPulses 
        }

        //position y
        await y.goToAbsolutePosition(yPos)
        //do the line
        const iInPulses = convertImpressoesMM2Pulse(impressoesX)
        await printAtAParticularYanXLinInAnyColor(printer,iInPulses)

    }

    const doAllYLinesIncludingItsXLine = async (job: Job__): Promise<void> => {

        // esta funcao é importante, ela compensa a falta de ortogonalidade entre a mecanica do eixo X e Y, 
        // possivelmente será necessário uma funcao desta por gaveta
        const compensateLackOfAxisXYOrtogonality = (yPos: Milimeter, xsPos: ImpressoesX):ImpressoesX => {
            // x=+1.20mm em y=+420mm
            const x_ = 1.20//1.84
            const y_ = 420//420
            const yPosInMM = yPos.value
            
            const deltaInMM = (yPosInMM)*(x_/y_)
            const newXs = xsPos.map( p => p.map( x => x+deltaInMM)) as unknown as ImpressoesX
            return newXs
        }

        const moveCoordinatesToDrawer1Or2 = (yPos: Milimeter, xsPos: ImpressoesX):ImpressoesX => {
            // x=-1.84mm em y=+420mm
            const x_ = 1.84+0.5
            const y_ = 420
            const yPosInMM = yPos.value
            
            const deltaInMM = (yPosInMM)*(x_/y_)
            const newXs = xsPos.map( p => p.map( x => x+deltaInMM)) as unknown as ImpressoesX
            return newXs
        }

        console.log('=========== [Iniciando Trabalho:] ===========')
        console.table(job)

        const impressoesX = job.impressoesX // number in milimeter --> FIX: Cast to milimeter not to number
       
        // executa linhas
        const possYmm = linhasY.map( x => Milimeter(x))
        const fazTodasAsLinhas = possYmm.map( yPos => async () => {
            const ajusted_impressoesX = compensateLackOfAxisXYOrtogonality(yPos, impressoesX)
            await doASingleXLine(yPos,ajusted_impressoesX, movimentKit)
        })
        await executeInSequence(fazTodasAsLinhas)

        //
        console.log('Trabalho finalizado')

    }


    // preogram printers
    await programMessage(printer, remoteFieldId, msg)
    // release Z 
    await z._moveRelative(Milimeter(zLevel))
    //await executeManyJobsWithTimeDelay(jobs,(1.5*60));
    await doAllYLinesIncludingItsXLine(job)
    // sobe Z
    await z.goToAbsolutePosition(minZ);

}

// helper
const performJobByItsName = async (jobName: KnownJobsKeys, movimentKit: MovimentKit): Promise<void> => {
    const job = getKnownJobs()[jobName]()
    return performJob(job, movimentKit)
}

type Drawer = 'Drawer1' | 'Drawer2'

const doDrawerSingleWork = async (drawer: Drawer, jobs: readonly KnownJobsKeys[], movimentKit: MovimentKit): Promise<void> => {
    const {x,y,z,m} = movimentKit
    
    await m.safelyReferenceSystemIfNecessary()
    const allJobsForSingleDrawer = jobs.map( job => () => {
        return performJobByItsName(job, movimentKit)
    })
    await executeInSequence(allJobsForSingleDrawer)

}



const main2 = async () => {
    console.log('Iniciado')
    console.log('Obtendo kit de movimento...')
    const movimentKit = await makeMovimentKit()
    const {x,y,z,m} = movimentKit
    const [minX, maxX] = x._getAbsolutePositionRange()
    const [minY, maxY] = y._getAbsolutePositionRange()
    const [minZ, maxZ] = y._getAbsolutePositionRange()

   
    const repeticoes = 10
    const tempoDeAbastecimento = 1.5*60*1000
    const drawerWork: readonly KnownJobsKeys[] = ['E44.A3']
    const doDrawerSingleWork_ = () => doDrawerSingleWork('Drawer1',drawerWork, movimentKit)

    console.log(`===========================================================================`)
    console.log(`Iniciando batch: tempoDeAbastecimento (em segundos)= ${tempoDeAbastecimento}, lote (em num. de gavetas)=${repeticoes}`)
    await repeatPromiseWithInterval(doDrawerSingleWork_ , repeticoes, tempoDeAbastecimento)
    console.log(`Fim da producao`)
    console.log(`===========================================================================`)
}

main2()