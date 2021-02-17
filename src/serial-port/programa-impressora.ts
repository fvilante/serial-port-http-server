import { executeInSequence } from './promise-utils'
import { Address, Printers} from './global'
import { ExecuteInParalel } from './promise-utils'
import { sendPrinter } from './send-receive-printer'


// programa uma impressora com o texto,
// e a impressora que nao vai imprimir é programada com espaço em branco
// pois o sinal de impressao é emitido para as duas impressoras simultaneamente
export const ProgramaImpressora = (
    printer: Printers,
    remoteFieldIndex: number, text: string
    ): Promise<void> =>  {

        const printerEnabled = printer
        const printerDisabled: Printers = printerEnabled === 'printerBlack' ? 'printerWhite' : 'printerBlack'
        
        const addrEnabled = Address['Printers'][printer]
        const { portName, baudRate } = addrEnabled

        const addrDisabled = Address['Printers'][printerDisabled]
        const { portName: portNameD, baudRate: baudRateD } = addrDisabled

        const EnabledPrinter = sendPrinter(portName, baudRate)
        const DisablePrinter = sendPrinter(portNameD, baudRateD)

        //console.log('------------')
        //console.log(portName)
        //console.log(portNameD)

        const paralel = [
            () => EnabledPrinter(remoteFieldIndex,text),
            () => DisablePrinter(remoteFieldIndex,''),
        ] as const

        return ExecuteInParalel(paralel)
    
}

//ProgramaImpressora('printerWhite',2,'T202')