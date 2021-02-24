import { Milimeter } from "./axis-position"
import { makeMovimentKit } from "./machine-controler"
import { Batch, DrawerWork, doBatchWork } from "./matriz-router"

const devicesAutoTest = async () => {}

const main2 = async () => {
    console.log('Iniciado')
    console.log('Obtendo kit de movimento...')
    const movimentKit = await makeMovimentKit()
    const {x,y,z,m} = movimentKit
    const [minX, maxX] = x._getAbsolutePositionRange()
    const [minY, maxY] = y._getAbsolutePositionRange()
    const [minZ, maxZ] = y._getAbsolutePositionRange()

   
    const repeticoesDeLote = 10
    const tempoDeAbastecimento = 20*1000
    const P3: DrawerWork = ['P3'] //['P3'] ['25401'] //['2559371', 'M1']
    const Termo371: DrawerWork = ['2559371', 'M1']
    const Termo370: DrawerWork = ['2559370', 'M1']
    const T125: DrawerWork = ['T125']
    const lote: Batch = [ ['P3'], ['V120'] ]
    
    x._forceLooseReference()
    y._forceLooseReference()
    y.doReferenceIfNecessary()
    y.goToAbsolutePosition(Milimeter(500))
    

    //doBatchWork(lote, tempoDeAbastecimento, repeticoesDeLote, movimentKit)

}

main2()