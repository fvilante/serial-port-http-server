
// LIST OF UTILS TO BE DONE
//      - randomNumberBetween(min, max): number

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



type Arr = readonly unknown[];

// partial call
export const partialCall = <T extends Arr, U extends Arr, R>(
    f: (...args: [...T, ...U]) => R,
    ...headArgs: T
  ) => {
    return (...tailArgs: U) => f(...headArgs, ...tailArgs);
  }


  // is array deep equal
  export const isArrayDeepEqual = <U extends readonly unknown[], V extends readonly unknown[]>(as: U, bs: V, isEqual: (a:U[number],b:V[number]) => boolean):boolean => {
    // fast return
    if (as.length!==bs.length) return false
    return as.every( (a,index) => {
        const b = bs[index]
        const aIsArray =  Array.isArray(a)
        const bIsArray =  Array.isArray(b)
        const aAndbAreArrays = aIsArray && bIsArray
        const justOneOfThenIsArray = (aIsArray && !bIsArray) || (!aIsArray && bIsArray)
        if(aAndbAreArrays===true) {
            return isArrayDeepEqual(a as U,b as V, isEqual)
        } else if(justOneOfThenIsArray===true) {
            return false
        } else {
            //none of them are arrays, than compare them
            return isEqual(a,b)
        }
    })
  }

export const averageFromArray = (arr: readonly number[]):number => {
    const [head, ...tail] = arr
    const sum = tail.reduce( (acc,cur) => acc+cur, head)
    const avarage = sum / arr.length
    return avarage
}

  // a timer helper to take interval durations from one line of code to other
  export type Timer__ = {
      reset: () => void 
      lap: () => number
      total: () => number
      //allLaps: () => number
      meanTime: () => number
  }
  export const Timer__ = ():Timer__ => {

    type T = Timer__
    let ts: number[] = [] // timepoint
    let ts_: number[] = []     // elapsed (duration) //FIX: I'm in doubt how should the array initial condition
    const reset: T['reset'] = () => {
        ts = [now()]
        ts_ = []
    }

    const lap: T['lap'] = () => {
        ts = [...ts, now()]
        const elapsed = ts[ts.length-1] - ts[ts.length-2]
        ts_ = [...ts_, elapsed]
        return elapsed
    }

    const total: T['total'] =  () => {
        return now() - ts[0]
    }
/*
    const allLaps: T['allLaps'] = () => {
        return ts.reduce((acc,cur, index)=> {
            if (index === 0) {
                return []
            } else {
                const lap = ts[index] - ts[index-1]
                return [...acc, lap]
            }
        }, [])
    }*/

    const meanTime: T['meanTime'] = () => {
        return averageFromArray(ts_)
    }

    return {
        reset,
        lap,
        total,
        //allLaps,
        meanTime,
    }
  }

