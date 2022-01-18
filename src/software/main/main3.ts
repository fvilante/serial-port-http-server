import { keyboardEventEmiter, KeyboardEventEmitter } from "../keyboard/read-keyboard-async"
import { BarCode, GetBarCodeFromSignal } from '../barcode-reader/parse-barcode'
import { makeMovimentKit, MovimentKit } from "../machine-controler"
import { performMatriz } from "../matriz-router"
import { fetchMatrizByBarcodeRaw } from "../matrix-reader/matriz-cadastro-geral-reader"
import { Matriz } from "../matrix-reader/matrizes-conhecidas"
import { delay } from "../core/delay"



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
            //TODO: make an alternative to below code, de dependency (npm terminal) was removed.
            /*term.singleColumnMenu(opts, (err, response) => {
                const index = response.selectedIndex
                const choosed = ms[index]
                resolve(choosed)
            })*/
        } else {
            // FIX: We should show to user something like this : 'The nearest registry I found is this: ....'
            // has no item
            const err = 'A matriz lida nao esta cadastrada, o programa sera terminado.'
            console.log(err)
            await delay(5000)
            reject(err)
        }
     })
        

const showKeyStrokesOnScreen = (f: KeyboardEventEmitter): KeyboardEventEmitter => {
    type Args =  Parameters<typeof f>
    type Response = ReturnType<typeof f>
    return (...args: Args):Response => {
        const consumer = args[0]
        const keyboardEventEmiter = f
        keyboardEventEmiter( keyboardEvent => {
            const { sequence } = keyboardEvent
            console.log(sequence)
            consumer(keyboardEvent)
        })

    } 
}


const main3 = () => {

    const keyboardEventEmiter__ = showKeyStrokesOnScreen(keyboardEventEmiter)
    
    console.log('-------------------------')
    console.log('PROGRAMA INICIADO')
    console.log('-------------------------')
    console.log()
    console.log('Para iniciar a impressao da matriz execute uma das duas operações abaixo:')
    console.log()
    console.log('NOTA: Para finalizar o programa, a qualquer momento, pressione as teclas "ctrl+c" 3 vezes consecutivas.')
    console.log()
    console.log('1) Leia o barcode com o leitor de codigo de barras, ou;')
    console.log('2) Digite o codigo de barras manualmente e em seguida pressione a tecla <enter>.')
    console.log('-')

    //TODO: Improve the method of keyboard reading from user, because if it hits 'backspace' key, for example, they will not capture the matrix register 

    GetBarCodeFromSignal(keyboardEventEmiter__)
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