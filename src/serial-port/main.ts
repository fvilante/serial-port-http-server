
import { delay } from "../utils/delay"
import { ExecuteInParalel, executeInSequence } from "./promise-utils"
import { mili2PulseX, PosicaoInicialX } from "./referencia_eixos"
import { getKnownJobs, ImpressoesX, Job__, KnownJobsKeys } from "./known-jobs"
import { AxisControler } from "./axis-controler"
import { MovimentKit, makeMovimentKit } from './machine-controler'
import { Milimeter } from "./axis-position"
import { Address, Printers } from "./global"
import { sendPrinter2 } from "./send-receive-printer"
import { Range } from "./utils"


// ================================================================
//      Tests
// ================================================================

const Test7F = {
    // move para coordenada calculando vetorialmente 
    //a componente dos eixos que realizarao o deslocamento
}



const Test9 = async () => {

    // ------------ intro -------------------------

    const movimentKit = await makeMovimentKit()
    const {x,y,z,m} = movimentKit

    const [minX, maxX] = x._getAbsolutePositionRange()
    const [minY, maxY] = y._getAbsolutePositionRange()
    const [minZ, maxZ] = y._getAbsolutePositionRange()

    // ------------------- work -------------------

    const _getCurrentPositionInMilimeters = async (axis: AxisControler): Promise<Milimeter> =>{
        const curPos = await axis.getCurrentAbsolutePosition()
        const curPosMM = axis._convertAbsolutePulsesToMilimeter(curPos)
        return curPosMM
    }

    // relative movement

    const _moveRelative = async (axis: AxisControler, pos: Milimeter):Promise<Milimeter> => {
        await axis._moveRelative(pos) // safe move
        const curPosMM = await _getCurrentPositionInMilimeters(axis)
       
        return curPosMM
    }

    const _moveRelativeXY = async (xPos: Milimeter, yPos: Milimeter):Promise<[x: Milimeter, y: Milimeter]> => {
        const arr = await ExecuteInParalel([
            () => _moveRelative(x, xPos),
            () => _moveRelative(y, yPos),
        ] as const) 
        const [xPosMM,yPosMM] = arr as [x: Milimeter, y: Milimeter]
        console.log(`current XY absolute position: x=${xPosMM.value}mm, y=${yPosMM.value}mm`)
        return [xPosMM,yPosMM]
    }

    const _moveRelativeZ = async (zPos: Milimeter):Promise<Milimeter> => {
        const curZPos = await _moveRelative(z, zPos)
        console.log(`current Z absolute position: z=${curZPos.value}mm`)
        return curZPos 
    }

    // absolute movement

    const _moveAbsolute = async (axis: AxisControler, pos: Milimeter):Promise<Milimeter> => {
        const posInPulse = axis._convertMilimeterToPulseIfNecessary(pos)
        const isValidPos =  axis._isSafePosition(posInPulse)
        if(isValidPos) {
            await axis.goToAbsolutePosition(pos) // safe move
        } 
        const curPosMM = await _getCurrentPositionInMilimeters(axis)
        return curPosMM
    }

    const _moveAbsoluteXY = async (xPos: Milimeter, yPos: Milimeter):Promise<[x: Milimeter, y: Milimeter]> => {
        const arr = await ExecuteInParalel([
            () => _moveAbsolute(x, xPos),
            () => _moveAbsolute(y, yPos),
        ] as const) 
        const [xPosMM,yPosMM] = arr as [x: Milimeter, y: Milimeter]
        console.log(`current XY absolute position: x=${xPosMM.value}mm, y=${yPosMM.value}mm`)
        return [xPosMM,yPosMM]
    }

    const _moveAbsoluteZ = async (zPos: Milimeter):Promise<Milimeter> => {
        const curZPos = await _moveAbsolute(z, zPos)
        console.log(`current Z absolute position: z=${curZPos.value}mm`)
        return curZPos 
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

  

    // helper aliases

    const moveRelativeXY = (xPosMM: number, yPosMM:number) => _moveRelativeXY(Milimeter(xPosMM),Milimeter(yPosMM))
    const moveRelativeZ = (zPosMM: number) => _moveRelativeZ(Milimeter(zPosMM))

    const moveAbsoluteXY = (xPosMM: number, yPosMM:number) => _moveAbsoluteXY(Milimeter(xPosMM),Milimeter(yPosMM))
    const moveAbsoluteZ = (zPosMM: number) => _moveAbsoluteZ(Milimeter(zPosMM))

    //

    // --------------- routine / work / job -------------------

    //await x._forceLooseReference()
    //await y._forceLooseReference()
    await m.safelyReferenceSystemIfNecessary()


    const performJob = async (job: Job__): Promise<void> => {
        
        const {
            printer,
            remoteFieldId,
            msg,
            zLevel,
            linhasY,
        } = job

        const performYLine = async (yPos: Milimeter, impressoesX: ImpressoesX): Promise<void> => {

            const fazLinhaXPreta = async (movimentKit: MovimentKit, impressoes: ImpressoesX):Promise<void> => {

                console.log('fazLinhaPreta')
                const {x,y,z,m} = movimentKit
                    
                const rampa = mili2PulseX(100)
                const PMA = PosicaoInicialX+mili2PulseX(100)
                const UMA = PosicaoInicialX+mili2PulseX(170)
                const PI = PosicaoInicialX
                const PF = UMA + rampa
                const NMA = 2
                const velAv = 1700
                const acAv = 3000
                const velRet = 2300
                const acRet = 3000
            
                const ImprimePar = async (x0: number, x1: number, rampa: number): Promise<void> => {
            
                    await x._setPrintMessages({
                        numeroDeMensagensNoAvanco: NMA,
                        numeroDeMensagensNoRetorno: 0,
                        posicaoDaPrimeiraMensagemNoAvanco: x0,
                        posicaoDaUltimaMensagemNoAvanco: x1,
                        posicaoDaPrimeiraMensagemNoRetorno: 500,
                        posicaoDaUltimaMensagemNoRetorno: 500,
                    })
                
                    const [minX, maxX] = x._getAbsolutePositionRange()
            
                    const POSFIM = x1+x._convertMilimeterToPulseIfNecessary(Milimeter(rampa))
            
                    await x.goToAbsolutePosition(x1+rampa, (v,a) =>[velAv,acAv] )
                    await x.goToAbsolutePosition(minX, (v,a) => [velRet,acRet])
                    //await x._clearPrintingMessages() //FIX: should be unnecessary
            
                    return
                }

                const imprimeTodaLinha = async (printPositionsInPulses: ImpressoesX):Promise<void> => {
            
                    const rampa = 500 // pulses (v=2000, ac=5000,rampa=20)
                    const messageLength = 1500
                    const pma = printPositionsInPulses[0][0]
                    const uma = printPositionsInPulses[1][1]
                    const pIni = pma-rampa
                    const pEnd = uma+(messageLength+rampa)

                    console.log(`pma=${pma}, uma=${uma},pIni=${pIni}, pEnd=${pEnd}`)

                    await x._setPrintMessages({
                        numeroDeMensagensNoAvanco: 6,
                        numeroDeMensagensNoRetorno: 0,
                        posicaoDaPrimeiraMensagemNoAvanco: pma,
                        posicaoDaUltimaMensagemNoAvanco: uma,
                        posicaoDaPrimeiraMensagemNoRetorno: 500, //any number
                        posicaoDaUltimaMensagemNoRetorno: 500,  // any
                    })
                    await x.goToAbsolutePosition(pEnd, (v,a) =>[velAv,acAv] )
                    await x.goToAbsolutePosition(pIni, (v,a) => [velRet,acRet])
                } 
            
                
                await ImprimePar(impressoes[0][0],impressoes[0][1], rampa )
                await ImprimePar(impressoes[1][0],impressoes[1][1], rampa )
                await ImprimePar(impressoes[2][0],impressoes[2][1], rampa )
                    
                /*
                await imprimeTodaLinha(impressoes)
                */
                return
                        
            }

            const fazLinhaXBranca = async (movimentKit: MovimentKit, impressoes: ImpressoesX):Promise<void> => {
                console.log('fazLinhaBranca')
                await fazLinhaXPreta(movimentKit, impressoes)
                await fazLinhaXPreta(movimentKit, impressoes)
                    
            }

            const executeLinePrintings = async (printer: Printers, modelo: ImpressoesX): Promise<void> => {
                if (printer==='printerWhite') {
                    console.log('1')
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
             await executeLinePrintings(printer,iInPulses)

        }
        

        const doTheJob = async (job: Job__): Promise<void> => {

            console.log('=========== [Iniciando Trabajo:] ===========')
            console.table(job)

            const impressoesX = job.impressoesX

            // program printer
            
            await programMessage(printer, remoteFieldId, msg)
            
            // executa linhas
            const possYmm = linhasY.map( x => Milimeter(x))
            const fazTodasAsLinhas = possYmm.map( yPos => async () => {
                await performYLine(yPos,impressoesX)
            })
            await executeInSequence(fazTodasAsLinhas)

            //
            console.log('Trabalho finalizado')

        }

        const executeManyJobsWithTimeDelay = async (jobs: readonly Job__[], timeDelayInSecs: number): Promise<void> => {
            const getJobByName = getKnownJobs()
            const arr = jobs.map( job => async () => {
                await doTheJob(job);
                await delay(timeDelayInSecs*1000)

            })
        }

        // release Z 
        await z._moveRelative(Milimeter(zLevel))
        //await executeManyJobsWithTimeDelay(jobs,(1.5*60));
        await doTheJob(job)
        // sobe Z
        await z.goToAbsolutePosition(minZ);


    }

    const performJobByItsName = async (jobName: KnownJobsKeys): Promise<void> => {
        const job = getKnownJobs()[jobName]()
        return performJob(job)
        
    }


    // Faz termo M1-255937
    //await performJob(getTermo2559370Job());
    //await performJob(getTermoM1Job());
    
    //await m.safelyReferenceSystemIfNecessary()
    //await m.parkSafelyIfItisPossible()
    //throw new Error('haha')


    await m.safelyReferenceSystemIfNecessary()
    
    const arr = Range(0,10,1).map( gavetada => async () => {
        await performJobByItsName('E44.B6') //Fix: Job in milimeters must be correct typed as milimeter instead of number
        await delay(1.5*60*1000)
    })
    await executeInSequence(arr)
    
    //await y._forceLooseReference()
    //await m.safelyReferenceSystemIfNecessary()
    //await y.goToAbsolutePosition(Milimeter(100+200+10+26))
    //await x.goToAbsolutePosition(Milimeter(100+55))
}

const Test10 = async ():Promise<void> => {
    // achar posicao da garagem e janela de manutencao


    const movimentKit = await makeMovimentKit()
    const {x,y,z,m} = movimentKit

    const [minX, maxX] = x._getAbsolutePositionRange()
    const [minY, maxY] = y._getAbsolutePositionRange()
    const [minZ, maxZ] = y._getAbsolutePositionRange()

    // ----

    await m.safelyReferenceSystemIfNecessary()
    
    // posicao da garagem
    await x.goToAbsolutePosition(maxX)
    await y.goToAbsolutePosition(minY)
    await z.goToAbsolutePosition(minZ+100+150+50+50+25+30+20+15+5)
    await z._forceLooseReference()
    await x._forceLooseReference()
    await y._forceLooseReference()

    await m.safelyReferenceSystemIfNecessary()

    // posicao do servico no cabecote
    await x.goToAbsolutePosition((maxX/2)+minX-300-200+50+15+5)
    await y.goToAbsolutePosition((maxY/2)+minY)
    await x._forceLooseReference()
    await y._forceLooseReference()

}

const Test11 = async (): Promise<void> => {

    return

}

Test9();
