import { Reduce_ } from "../adts/reduce"
import { Milimeter } from "../milimeter"
import { Matriz, Matriz2, Matriz3 } from "./matriz"
import { Range } from '../core/utils'



// convert equidistant sequence of 1Dpositions into a {position, step, quantity} format
const equidistantConverter = (source: readonly Milimeter[]): {firstPosition: Milimeter, step: Milimeter, quantity: number} => {

    type State = {
        lastAbsPosition: Milimeter
        steps: readonly Milimeter[]
    }

    const initialState: State = { 
        lastAbsPosition: source[0],
        steps: []
    }

    const [,...source_] = source

    const reducer = (state: State, value: Milimeter) => {
        const currentAbsolutePosition = value.value
        const lastAbsolutePosition = state.lastAbsPosition.value
        const step = currentAbsolutePosition - lastAbsolutePosition
        //console.log(`current=${currentAbsolutePosition}, last=${lastAbsolutePosition}, step=${step}`)
        const _step = Milimeter(step)
        return { lastAbsPosition: value, steps: [...state.steps, _step] }
    } 

    const steps = Reduce_.fromArray(source_, initialState, reducer).unsafeRun().steps

    const getStepsDiff = (steps: readonly Milimeter[]): readonly Milimeter[] => {
        const first = steps[0]
        const diffs = steps.map( x => Milimeter(x.value - first.value))
        return diffs
    }

    const tolerance = Milimeter(0.01)

    const isDiffAccetable = getStepsDiff(steps).every( x =>x.value <= tolerance.value) 
    //console.log('diff',getStepsDiff(steps))

    //console.log('all steps ->', steps)
    const step = steps[0]

    if (isDiffAccetable===false) {
        throw new Error('O step deve ser equidistante')
    }
    

    const firstPosition = source[0]
    const quantity = source.length
    return { firstPosition, step, quantity}

    

}


export const matrizConverter_3_1 = (ref: Matriz3): Matriz => {
    const { 
        partNumber,
        barCode,
        printer,
        msg,
        passes,
        remoteFieldId,
        printVelocity,
        zLevel: zLevel_,
        //
        xPos, xQuantity, xStep,
        yPos, yQuantity, yStep,
    } = ref

    const firstX = xPos
    const stepX = xStep
    const posicaoYDaLinha0NoFundoDaGaveta = yPos
    const stepY = yStep

    const impressoesX_ = (): Matriz['impressoesX']  => Range(0,xQuantity).map( col => {
        return Milimeter(firstX+(stepX*(col)))
    })
    
    const linhasY_ = (): Matriz['linhasY'] => Range(0,yQuantity).map( lin => {
        return Milimeter(posicaoYDaLinha0NoFundoDaGaveta+(stepY*(lin)))
    })

    return {
        partNumber,
        barCode,
        printer,
        msg,
        passes,
        remoteFieldId,
        printVelocity,
        impressoesX: impressoesX_(),
        linhasY: linhasY_(),
        zLevel: Milimeter(zLevel_)  
    }
} 



const matrizConverter_1_2 = (ref: Matriz): Matriz2 => {
    const { 
        impressoesX,
        linhasY,
        partNumber,
        barCode,
        printer,
        msg,
        passes,
        remoteFieldId,
        printVelocity,
        zLevel,
    } = ref

    const { firstPosition: xPos, step: xStep, quantity: xQuantity } = equidistantConverter(impressoesX)
    const { firstPosition: yPos, step: yStep, quantity: yQuantity } = equidistantConverter(linhasY)

    return {
        partNumber,
        barCode,
        printer,
        msg,
        passes,
        remoteFieldId,
        printVelocity,
        zLevel,
        xPos, xStep, xQuantity,
        yPos, yStep, yQuantity,   
    }
} 





const matrizConverter_2_3 = (ref: Matriz2): Matriz3 => {
    const {
        zLevel,
        xPos, xStep,
        yPos, yStep,
    } = ref

    const precision = 2

    const zLevel_ = Number(zLevel.value.toFixed(precision))
    const xPos_ =  Number(xPos.value.toFixed(precision))
    const xStep_ =  Number(xStep.value.toFixed(precision))
    const yPos_ =  Number(yPos.value.toFixed(precision))
    const yStep_ =  Number(yStep.value.toFixed(precision))
    
    return {
        ...ref,
        zLevel: zLevel_,
        xPos: xPos_,
        xStep: xStep_,
        yPos: yPos_,
        yStep: yStep_,
    }
}

export const matrizConverter_3_2 = (ref: Matriz3): Matriz2 => {
    const {
        zLevel,
        xPos, xStep,
        yPos, yStep,
    } = ref

    const zLevel_ = Milimeter(zLevel)
    const xPos_ = Milimeter(xPos) 
    const xStep_ = Milimeter(xStep) 
    const yPos_ = Milimeter(yPos) 
    const yStep_ = Milimeter(yStep) 
    
    return {
        ...ref,
        zLevel: zLevel_,
        xPos: xPos_,
        xStep: xStep_,
        yPos: yPos_,
        yStep: yStep_,
    }
}


// Test --------------------------------------------------------------------

/*
const convertAll = (): readonly Matriz3[] => {
    let res: readonly Matriz3[] = []
    const r = getMatrizesConhecidas()
    mapObject(r, (value, key) => {
        const matriz1 = value()
        const matriz2 = matrizConverter_1_2(matriz1)
        const matriz3 = matrizConverter_2_3(matriz2)
        res = [...res, matriz3]
        //console.log(JSON.stringify(matriz2))
    })
    return res
}


const Test1 = () => {

    const r = convertAll();
    //console.log(r)
    const x = JSON.stringify(r)
    console.log(x)
    
}

Test1()
*/