

// set up a cmpp communication with a specified port and channel, and do some actions as
// moveTo, findLastPosition, reference, forceLooseReference, etc.

import { getAxisControler } from "../../axis-controler";
import { X_AxisStarterKit } from "../../axis-starter-kit";
import { executeInSequence } from "../../core/promise-utils";
import { Range } from "../../core/utils";

const axis = getAxisControler(X_AxisStarterKit)

const run = async () => {
    const init = async () => {    
        await axis._forceLooseReference()
        await axis.doReferenceIfNecessary() 
    }
    
    
    const path = async () => {
    
        const core = [500,300,150,50,-800,300]
        const pos = [...core, ...core.map( p => p*4),...core.map( p => p*3)]
    
        
        const vai = pos.map( p => async () => axis._moveRelative(p))
        const vem = pos.map( p => async () => axis._moveRelative(p*(-1)))
        console.log(`*********** INDO`)
        await executeInSequence(vai)
        console.log(`*********** INDO - Finalizado`)
        console.log(`*********** Voltando`)
        await executeInSequence(vem)
        console.log(`*********** Voltando - Finalizado`)
        
        await axis.goToAbsolutePosition(650)
        console.log('Fim do run')
    }
    
    console.log('INICIO DO PROGRAMA')
    
    
    const loop = Range(1,200,1).map( times => async () => {
        console.log(`*********** RUNING NUMBER: ${times} ********************`)
        await path()
    })
    
    await init()
    executeInSequence(loop).then(x => console.log('-> Final de tudo com certeza') )
} 

run();