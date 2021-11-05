import { readKeyboardAsync } from "./read-keyboard-async"
import { BarCode, GetBarCodeFromSignal } from './parse-barcode'
import { makeMovimentKit, MovimentKit } from "./machine-controler"
import { performMatriz, performMatrizByItsMsg } from "./matriz-router"
import { fetchMatrizByBarcodeRaw } from "./matriz-cadastro-geral-reader"
import { createTerminal } from 'terminal-kit'
import { Matriz } from "./matrizes-conhecidas"
import { delay } from "./utils/delay"

const term = createTerminal()

// helper
const performMatrizByItsBarCode = async (barCodeRaw: BarCode['raw'], movimentKit: MovimentKit): Promise<void> => {
    const matrizMatches = await fetchMatrizByBarcodeRaw(barCodeRaw)
    const matriz = await desambiguateSingleBarCodeMultipleRegistries(matrizMatches)
    return performMatriz(matriz, movimentKit)
}

const desambiguateSingleBarCodeMultipleRegistries = async (ms: readonly Matriz[]): Promise<Matriz> => 
    new Promise( async (resolve, reject) => {
        const length = ms.length
        if(length===1) {
            // has one item
            resolve(ms[0])
        } else if(length>1) {
            // has many items
            const opts = ms.map( (m, index) => `${index+1}) PN=${m.partNumber} / MSG=${m.msg} (${m.printer} / @${m.remoteFieldId})`)
            term.singleColumnMenu(opts, (err, response) => {
                const index = response.selectedIndex
                const choosed = ms[index]
                resolve(choosed)
            })
        } else {
            // FIX: We should show to user something like this : 'The nearest registry I found is this: ....'
            // has no item
            const err = 'A matriz lida nao esta cadastrada, o programa sera terminado.'
            console.log(err)
            await delay(5000)
            reject(err)
        }
     })
        
    

const main3 = () => {
   
    const input = () => readKeyboardAsync()
        .tap( k => console.log(`${k.sequence}`) )

    console.log('PROGRAMA INICIADO.')
    console.log('Pronto para ler o barcode (voce também pode digitar manualmente o barcode a pressionar a tecla <Enter> em seguida)...')

    GetBarCodeFromSignal(input)
        .unsafeRun( maybeBarCode => {

            maybeBarCode.forEach( barCode => {

                console.log(`Identificado bar-code:`, barCode)
                console.log(`localizando programacao correspondente`)
                
                const msg = barCode.messageText
                const partNumber = barCode.partNumber
                console.log(`Iniciando realizacao do trabalho`)
                makeMovimentKit()
                    .then( async movimentKit => {
                        const barCodeRaw = barCode.raw.trim()
                        await performMatrizByItsBarCode(barCodeRaw, movimentKit)
                    })  
            })

        })

}

main3();