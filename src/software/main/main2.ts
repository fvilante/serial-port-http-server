import { makeMovimentKit } from "../machine-controler"
import { Batch, DrawerWork, doBatchWork } from "../matriz-router"


const devicesAutoTest = async () => {}

const main2 = async () => {
    console.log('Iniciado')
    console.log('Obtendo kit de movimento...')
    const movimentKit = await makeMovimentKit()
    const {x,y,z,m} = movimentKit
    const [minX, maxX] = x._getAbsolutePositionRange()
    const [minY, maxY] = y._getAbsolutePositionRange()
    const [minZ, maxZ] = z._getAbsolutePositionRange()

   
    const repeticoesDeLote = 10
    const tempoDeAbastecimento = 1.5*(60)*1000
    const P3: DrawerWork = ['P3'] //['P3'] ['25401'] //['2559371', 'M1']
    const Termo371: DrawerWork = ['2559371', 'M1']
    const Termo370: DrawerWork = ['2559370', 'M1']
    const T125: DrawerWork = ['T125']
    const T199: Batch = [ ['T199'] ]
    const E44B5: Batch = [ ['E44.B5'] ]
    const E44B6: Batch = [ ['E44.B6'] ]
    
    //await m.safelyReferenceSystemIfNecessary()
    //await m.safeMoveAbsoluteAndParalelXY(Milimeter(250),Milimeter(250))
    //await m.safeMoveAbsoluteAndParalelXY(Milimeter(250*2),Milimeter(250*2))
    //await m.safeMoveAbsoluteAndParalelXY(Milimeter(250/2),Milimeter(250*2))
    //await m.safeMoveAbsoluteAndParalelXY(Milimeter(700),Milimeter(250/2))
    //await m.safeMoveAbsoluteAndParalelXY(Milimeter(300),Milimeter(450))
    //await m.safeMoveAbsoluteAndParalelXY(Milimeter(700),Milimeter(450))
    //await m.safeMoveAbsoluteAndParalelXY(Milimeter(300),Milimeter(500))
    //await m.safeMoveAbsoluteAndParalelXY(Milimeter(700),Milimeter(450))
    //await m.safeMoveAbsoluteAndParalelXY(Milimeter(250),Milimeter(10000))
    //await m.goToGarageifItIsPossible()
    
    //x._forceLooseReference()
    //y._forceLooseReference()


    //console.table(await m._getCurrentAbsolutePosition())

    
    //await m.safeMoveAbsoluteAndParalelXY(Milimeter(550),Milimeter(200))
    

    await doBatchWork(E44B6, tempoDeAbastecimento, repeticoesDeLote, movimentKit)
    //await m.goToMaintenanceFrontDoingAllPossible()

    //const [minX] = x._getAbsolutePositionRange()


}

main2()