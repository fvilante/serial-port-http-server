import { delay } from "../utils/delay"
import { Address, Printers } from "./global"
import { sendPrinter2 } from "./send-receive-printer"

// do the high level communication to two printers


export const programMessage = async (printer: Printers,remoteFieldId: number, msg: string): Promise<[remoteFieldId: number, msg: string]> => {
    const printerToEnable = printer
    const printerToDisable:Printers = printer === 'printerBlack' ? 'printerWhite' : 'printerBlack'
    const e = Address['Printers'][printerToEnable]
    const d = Address['Printers'][printerToDisable]
    const emptyMessage = ''
    //await sendPrinter2(e.portName, e.baudRate)(remoteFieldId,msg)
    //await sendPrinter2(d.portName, d.baudRate)(remoteFieldId,emptyMessage)
    await delay(500) // FIX: this delay May be unecessary
    return [remoteFieldId, msg]
}
