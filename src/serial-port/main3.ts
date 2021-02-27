import { readKeyboardAsync } from "./read-keyboard-async"
import { GetBarCodeFromSignal } from './parse-barcode'
import { makeMovimentKit } from "./machine-controler"
import { performMatrizByItsMsg } from "./matriz-router"



const main3 = () => {

    const input = () => readKeyboardAsync()
        .tap( k => console.log(`${k.sequence}`) )

    console.log('iniciando varredura de teclado...')

    GetBarCodeFromSignal(input)
        .unsafeRun( maybeBarCode => {

            maybeBarCode.forEach( barCode => {

                console.log(`Identificado bar-code:`, barCode)
                console.log(`localizando programacao correspondente`)
                
                const msg = barCode.messageText
                const partNumber = barCode.partNumber
                console.log(`Iniciando realizacao do trabalho`)
                makeMovimentKit()
                    .then( movimentKit => {
                        performMatrizByItsMsg(msg as unknown as any, movimentKit)
                    })  
            })

        })

}

main3();