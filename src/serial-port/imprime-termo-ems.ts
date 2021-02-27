
// rotina feita rapidamente para imprimir termo pequena EMS232 e similares
// NOTA: É necessário enviar o texto manualmente a rotina nao envia o texto

import { Milimeter } from "./axis-position"
import { makeMovimentKit } from "./machine-controler"
import { executeInSequence } from "./promise-utils"
import { Range } from "./utils"

const ImprimeTermoRetratilEMS = async ():Promise<void> => {

    console.log('Iniciado')
    console.log('Obtendo kit de movimento...')
    const movimentKit = await makeMovimentKit()
    const {x,y,z,m} = movimentKit
    const [minX, maxX] = x._getAbsolutePositionRange()
    const [minY, maxY] = y._getAbsolutePositionRange()
    const [minZ, maxZ] = y._getAbsolutePositionRange()

    const passoMM = Milimeter(18.31)
    const velImp = 1700
    const acAv = 6000
    const acRet = 4000
    const velRet = 2300
    const rampa = Milimeter(20+60)
    
    const imprimeUmaNaPosicaoIndicada = async(x0: Milimeter): Promise<void> => {
        const xoInPulse = x._convertMilimeterToPulseIfNecessary(x0)
    
        await x._setPrintMessages({
            numeroDeMensagensNoAvanco: 1,
            posicaoDaPrimeiraMensagemNoAvanco: xoInPulse,
            posicaoDaUltimaMensagemNoAvanco: xoInPulse,
            numeroDeMensagensNoRetorno: 0,
            posicaoDaPrimeiraMensagemNoRetorno: 500,
            posicaoDaUltimaMensagemNoRetorno: 500,
        })


        const PF = Milimeter(x0.value+rampa.value)
        const PI = Milimeter(x0.value-rampa.value)
        const PI_ = x._isSafePosition(x._convertMilimeterToPulseIfNecessary(PI)) ? PI : x._convertAbsolutePulsesToMilimeter(minX)
        await x.goToAbsolutePosition(PF, () => [velImp,acAv])
        //await x.goToAbsolutePosition(minX)
        await x.goToAbsolutePosition(PI_, () => [velRet,acRet])
    }

    const Y_POS = Milimeter(400-84-1+(70*1))
    const X_INI = Milimeter(250-104)

    await m.safelyReferenceSystemIfNecessary()
    await y.goToAbsolutePosition(Y_POS)
    await x.goToAbsolutePosition(minX)


    await imprimeUmaNaPosicaoIndicada(X_INI)

    // primeira passada
    const arr1 = Range(0,20,1).map( n => async () => {
        console.log(`Impressao n=${n}`)
        await imprimeUmaNaPosicaoIndicada(Milimeter(X_INI.value+(passoMM.value*n)))
    })

    // segunda passada
    await executeInSequence(arr1)
    const arr2 = Range(0,20,1).map( n => async () => {
        console.log(`Impressao n=${n}`)
        await imprimeUmaNaPosicaoIndicada(Milimeter(X_INI.value+(passoMM.value*n)))
    })
    await executeInSequence(arr2)

}

console.log('1')
ImprimeTermoRetratilEMS()
