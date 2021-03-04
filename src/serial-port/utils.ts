

// TO BE DONE: as vezes queremos campos nao emptys, por exemplo.
//  strings nao vazias (job->barcode) NonEmpty<string>, ou arrays nao vazias
//  NonEmpty<readonly number[]>, ou coisas do tipo


// fix: make it a generator structure for performance
// inclusive-exclusive]
// fix: BUG -> IT DOES NOT WORKING WITH NON INTEGER 'STEP' (EX: Range(1,3,0.1) enter infinite loop)
// fix: test if ini is negativa and end is postive works well
export const Range = (ini: number, end: number, step: number = 1): readonly number[] => {
    const i = Math.floor(ini)
    const e = Math.floor(end)
    const s = Math.floor(step)
    let res: readonly number[] = []
    if (ini<=end) {
        for(let k=i; k<e ; k=k+s) {
            res = [...res, k]
        }
    } else {
        //decrescent counting (step is negative and ini>end)
        for(let k=i; k>e ; k=k+s) {
            res = [...res, k]
        }
    }
    
    return res
}



export const groupBy = <T, K>(list: readonly T[], getKey: (item: T) => K):Map<K, readonly T[]> => {
    const map = new Map<K, T[]>();
    list.forEach( item => {
        const key = getKey(item);
        const collection = map.get(key);
        if (collection===undefined) {
            map.set(key, [item]);
        } else {
            collection.push(item);
        }
    });
    return map
    //return Array.from(map.values());
}

export const now = () => new Date().getTime()


// helper
//window is inclusive bound in both sides
export const isInsideRange = (x: number, range: readonly [lowerBoundInclusive: number, upperBoundInclusive: number]) => {
    const lowerBound = range[0]
    const upperBound = range[1]
    const isInsideRange_ = ((x>=lowerBound) && (x<=upperBound)) 
    return isInsideRange_
        ? true
        : false
}


// when you want to map an object (as you do with an Array)
export const mapObject =<T, K extends keyof T> (obj:T, forEach: (value: T[K], key: K ) => void): void => {
    const keys = Object.keys(obj) as (keyof T)[]
    keys.forEach( (key, index) => {
        const value = obj[key]
        forEach(value as T[K],key as K)
    })
}
