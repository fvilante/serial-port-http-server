import { keyboardEventEmiter, KeyboardEventEmitter } from "../keyboard/read-keyboard-async"
import { Barcode } from "../barcode/barcode-core"
import { makeBarcodeStream } from '../barcode/barcode-stream'
import { makeMovimentKit, MovimentKit } from "../machine-controler"
import { performMatriz } from "../matriz-router"
import { fetchMatrizByBarcodeRaw } from "../matrix-reader/matriz-cadastro-geral-reader"
import { Matriz } from "../matrix-reader/matrizes-conhecidas"
import { delay } from "../core/delay"


// helper
const performMatriz_ = async (barcode: Barcode, movimentKit: MovimentKit): Promise<void> => {
    const matrizMatches = await fetchMatrizByBarcodeRaw(barcode)
    const matriz = await throwIfNotJustOneMatrizWasFound__(matrizMatches)
    return performMatriz(matriz, movimentKit)
}

const throwIfNotJustOneMatrizWasFound__ = async (ms: readonly Matriz[]): Promise<Matriz> => 
    new Promise( async (resolve, reject) => {
        const length = ms.length
        if(length===1) {
            // has one item
            resolve(ms[0])
        } else if(length>1) {
            // has many items
            const err = 'Existe mais de uma matriz cadastrada para o mesmo codigo de barras. O programa será encerrado.'
            console.log(err)
            await delay(5000)
            reject(err)
            
        } else {
            const err = 'A matriz lida nao esta cadastrada, o programa será encerrado.'
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

const printHeadText = () => {
    console.log('-------------------------')
    console.log('PROGRAMA INICIADO')
    console.log('-------------------------')
    console.log()
    console.log('Para iniciar a impressao da matriz execute uma das duas operações abaixo:')
    console.log()
    console.log('NOTA: Para finalizar o programa, a qualquer momento, pressione as teclas "ctrl+c" 3 vezes consecutivas.')
    console.log()
    console.log('1) Leia o barcode com o leitor de codigo de barras, ou;')
    console.log('2) Digite o codigo de barras manualmente e em seguida pressione a tecla <enter>. O texto digitado deve estar exatamente igual ao campo cadastrado no cadastro geral. (OBS: Nao utilize as teclas "setas direcionais", "backspace", durante a edição)')
    console.log('-')
}

const main3 = () => {
    const keyboardEventEmiter__ = showKeyStrokesOnScreen(keyboardEventEmiter)
    printHeadText();
    //TODO: Improve the method of keyboard reading from user, because if it hits 'backspace' key, for example, they will not capture the matrix register 
    makeBarcodeStream(keyboardEventEmiter__)
        .unsafeRun( barCode => {
            console.log(`Identificado bar-code:`, barCode)
            console.log(`localizando programacao correspondente`)
            console.log(`Iniciando realizacao do trabalho`)
            makeMovimentKit()
                .then( async movimentKit => {
                    await performMatriz_(barCode, movimentKit)
                })  
        })
}

main3();