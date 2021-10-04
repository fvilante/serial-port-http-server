import  { isArrayDeepEqual } from './utils'

describe('Basic tests', () => {

    describe('isArrayDeepEqual', () => {

        it('two single simple flatten array', () => {
            const as = [1,2,3] as const
            const bs = [1,2,3] as const
            const cs1 = [1,2] 
            const cs2 = [1,2,[3]]
            const f = (a:number,b:number) => a===b
            const g = (a:number,b:number | number[]) => a===b
            const actual1 = isArrayDeepEqual(as,bs,f)
            const actual2 = isArrayDeepEqual(bs,as,f)
            const actual3 = isArrayDeepEqual(bs,bs,f)
            const actual4 = isArrayDeepEqual(as,as,f)
            const actual5 = isArrayDeepEqual(as,cs1,f)
            const actual6 = isArrayDeepEqual(bs,cs2,g)
            expect(actual1).toBe(true)
            expect(actual2).toBe(true)
            expect(actual3).toBe(true)
            expect(actual4).toBe(true)
            expect(actual5).toBe(false)
            expect(actual6).toBe(false)
            
    
        })
    })
})