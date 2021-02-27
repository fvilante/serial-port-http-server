import { Milimeter } from "./axis-position"
import { Printers } from "./global"
import { makeMovimentKit } from "./machine-controler"
import { Range } from "./utils"




const imprimeTermoEMS232 = async () => {

    console.log('Obtendo kit de movimento...')
    const movimentKit = await makeMovimentKit()
    const {x,y,z,m} = movimentKit
    const [minX, maxX] = x._getAbsolutePositionRange()
    const [minY, maxY] = y._getAbsolutePositionRange()
    const [minZ, maxZ] = z._getAbsolutePositionRange()


    // represents colinear points
    const _3a_coluna_GAVETA1 = Milimeter(400-84-1-1.5-1)
    const _3a_coluna_GAVETA2 = Milimeter(200+130-2.5-3.27)

    const primeiraImpressao_Gaveta1 = Milimeter(150)
    const primeiraImpressao_Gaveta2 = Milimeter(750)

    const __fazLinha = async (yPos: Milimeter, primeiraImpressao: Milimeter, passoX: Milimeter, numeroDeImpressoes: number) => {
        const msg = 'XXXX' // manually programmed message
        const remoteFieldId = 1 // manually programmed message
        const printVelocity = 1700
        const passes = 2
        const printer: Printers = 'printerWhite'

        await m.safePrintYZColinearAndEquallySpacedPoints({
            y: yPos,
            z: Milimeter(0), // fix: not implemented
            xs: Range(0,numeroDeImpressoes,1).map( n => Milimeter(primeiraImpressao.value+(passoX.value*n)))
         }, {
            msg,
            passes,
            printVelocity,
            printer,
            remoteFieldId,
        })
    }

    const fazLinha = async (yPos: Milimeter) => {
        const xPrimeira = primeiraImpressao_Gaveta1
        const passoX = Milimeter(18*2)
        const numeroDeImpressoes = 10
        await __fazLinha(yPos, xPrimeira, passoX , numeroDeImpressoes)
        await __fazLinha(yPos, Milimeter(xPrimeira.value+(passoX.value/2)), passoX, numeroDeImpressoes)
    }

    const fazMatrizGaveta1 = async () => {
        const yPos = _3a_coluna_GAVETA1 //(52-7)+0
        const passoY = Milimeter(70)
        //await fazLinha(Milimeter(yPos.value+(70*-4)))
        await fazLinha(Milimeter(yPos.value+(passoY.value*-3)))
        await fazLinha(Milimeter(yPos.value+(passoY.value*-2)))
        await fazLinha(Milimeter(yPos.value+(passoY.value*-1)))
        await fazLinha(Milimeter(yPos.value+(passoY.value*0)))
        await fazLinha(Milimeter(yPos.value+(passoY.value*1)))
        await fazLinha(Milimeter(yPos.value+(passoY.value*2)))
    }

    await fazMatrizGaveta1()

}


const imprimeTermoGrosso = async () => {

    console.log('Obtendo kit de movimento...')
    const movimentKit = await makeMovimentKit()
    const {x,y,z,m} = movimentKit
    const [minX, maxX] = x._getAbsolutePositionRange()
    const [minY, maxY] = y._getAbsolutePositionRange()
    const [minZ, maxZ] = z._getAbsolutePositionRange()


    // represents colinear points
    const _3a_coluna_GAVETA1 = Milimeter(452)
    const _3a_coluna_GAVETA2 = Milimeter(200+130-2.5-3.27)

    const primeiraImpressao_Gaveta1 = Milimeter(150)
    const primeiraImpressao_Gaveta2 = Milimeter(750)

    const __fazLinha = async (yPos: Milimeter, primeiraImpressao: Milimeter, passoX: Milimeter, numeroDeImpressoes: number) => {
        const msg = 'XXXX' // manually programmed message
        const remoteFieldId = 1 // manually programmed message
        const printVelocity = 1700
        const passes = 2
        const printer: Printers = 'printerWhite'

        await m.safePrintYZColinearAndEquallySpacedPoints({
            y: yPos,
            z: Milimeter(0), // fix: not implemented
            xs: Range(0,numeroDeImpressoes,1).map( n => Milimeter(primeiraImpressao.value+(passoX.value*n)))
         }, {
            msg,
            passes,
            printVelocity,
            printer,
            remoteFieldId,
        })
    }

    const fazLinha = async (yPos: Milimeter) => {
        const xPrimeira = primeiraImpressao_Gaveta1
        const passoX = Milimeter(49*2)
        const numeroDeImpressoes = 8
        await __fazLinha(yPos, xPrimeira, passoX , numeroDeImpressoes)
        await __fazLinha(yPos, Milimeter(xPrimeira.value+(passoX.value/2)), passoX, numeroDeImpressoes)
    }

    const fazMatrizGaveta1 = async () => {
        const yPos = _3a_coluna_GAVETA1 //(52-7)+0
        const passoY = Milimeter(70)
        //await fazLinha(Milimeter(yPos.value+(70*-4)))
        //await fazLinha(Milimeter(yPos.value+(passoY.value*-3)))
        //await fazLinha(Milimeter(yPos.value+(passoY.value*-2)))
        //await fazLinha(Milimeter(yPos.value+(passoY.value*-1)))
        await fazLinha(Milimeter(yPos.value+(passoY.value*0)))
        //await fazLinha(Milimeter(yPos.value+(passoY.value*1)))
        //await fazLinha(Milimeter(yPos.value+(passoY.value*2)))
    }

    await fazLinha(_3a_coluna_GAVETA1)

    //await fazMatrizGaveta1()

    //const terceiraLinha = Milimeter(352)
    //const primeiraImpressao = Milimeter(160)
    //await y.goToAbsolutePosition(terceiraLinha)
    //await x.goToAbsolutePosition(primeiraImpressao)
    //console.table(await m._getCurrentAbsolutePosition())
}

imprimeTermoEMS232()