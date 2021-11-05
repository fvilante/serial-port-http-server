import { delay } from "./utils/delay";
import { Range } from "./utils";

// helper
type UnPromisifyArray<T extends readonly (() => Promise<unknown>)[]> = {
    readonly [K in keyof T]: T[K] extends () => Promise<infer U> ? U : never
}

// ========== [ execute in sequence ] =================


type ExecuteInSequenceResponse<T extends readonly (() => Promise<unknown>)[]> = 
    UnPromisifyArray<T> extends readonly void[] ? void : UnPromisifyArray<T>  


export const executeInSequence = <A extends readonly (() => Promise<unknown>)[]>(arr: A, forEach?: (value: UnPromisifyArray<A>[number]) => void ): Promise<ExecuteInSequenceResponse<A>> => { 
    let i: number = 0;
    let res: readonly unknown[] = []
    return new Promise<ExecuteInSequenceResponse<A>>( (resolve, reject) =>  {

        const executeNextAndWait = () => {
            arr[i]()
            .then( data => {
                if (forEach!==undefined) forEach(data as UnPromisifyArray<A>[number])
                res = [...res, data];
                //console.log(`Promisse respondida com data=${data}`)
                i++;
                if(i<arr.length) {
                    executeNextAndWait();
                } else {
                    resolve( (res as ExecuteInSequenceResponse<A>)); //finished
                }            
            })
            .catch( err => {
                reject(err)
            })
        }
        executeNextAndWait();
        
    })
}

const Test1 = () => {

    const arr = [
        () => new Promise<number>( resolve => resolve(10)),
        () => new Promise<'hi'>( resolve => resolve('hi')),
        () => new Promise<66>( resolve => resolve(66)),
        () => new Promise<'juca'>( resolve => resolve('juca')),
    ] as const
    console.log('inicio do test')

    executeInSequence(arr, value => console.log('Partial value=', value))
        .then( res => {
            console.log('resolvido')
            console.table(res)
        })


}

// ========== [ execute in parallel ] =================

export type ExecuteInParalelResponse<T extends readonly (() => Promise<unknown>)[]> = 
    UnPromisifyArray<T> extends readonly void[] ? void : UnPromisifyArray<T>[number][]  

type X = [() => Promise<void>, () => Promise<number>,() => Promise<void>]
type Y = ExecuteInParalelResponse<X>


//FIX: If argument is a tuple, response should be a tuple as well, but it is returning a array
export const ExecuteInParalel = <A extends readonly (() => Promise<unknown>)[]>(arr: A): Promise<ExecuteInParalelResponse<A>> => { 
    let i = 0
    let res: readonly unknown[] = []
    return new Promise<ExecuteInParalelResponse<A>>( (resolve, reject) => {
        arr.map( currentPromise => 
            currentPromise()
            .then( data => {
                res = [...res, data];
                i++;
                if (i===arr.length) {
                    resolve(res as ExecuteInParalelResponse<A>)
                } else {
                    //todo: define a timeout
                }

            })
            .catch( (err) => {
                reject(err)
            })
        )
    })
}

const Test2 = () => {
    
    const arr = [
        () => new Promise<number>( resolve => setTimeout( () => resolve(10), 3000)),
        () => new Promise<'hi'>( resolve => setTimeout( () => resolve('hi'), 2000)),
        () => new Promise<66>( resolve => setTimeout( () => resolve(66), 1000)),
        () => new Promise<'juca'>( resolve => setTimeout( () => resolve('juca'), 500)),
    ] as const
    console.log('inicio do test')

    ExecuteInParalel(arr)
        .then( res => {
            console.log('resolvido')
            console.table(res)
        })

}


// ========== [ WaitUntilTrue - monitor effects until it attends some pre-requisits or timeout ] =================

export const WaitUntilTrueFastPooling = async <A>(effect: () => Promise<A>, condition: (_:A) => boolean, timeout: number ):Promise<A> => {
    let tid: number | undefined = undefined
    let r:A | undefined = undefined
    const runEffect = async () => {
        r = await effect()
        return r
    } 

    return new Promise( async (resolve, reject) => { 

        tid = setTimeout( () => {
            reject('WaitUntil has timedout')
        }, timeout) as unknown as number
        // pool as fast as possible
        try {
            while(condition(await runEffect())!==true) { 
                // fast pooling loop
            }
        } catch (err) {
            reject(err)
        }
        
        // condition satisfied

        clearTimeout(tid)
        resolve(r as unknown as A)
    
    })
}


export const WaitUntilTrue = async <A>(effect: () => Promise<A>, condition: (_:A) => boolean, poolingInterval: number /*set to min interval*/ , timeout: number ):Promise<A> => {
   
    return new Promise( (resolve, reject) => { 

        let timerout: number | undefined = undefined
        let pooling: number | undefined = undefined
        timerout = setTimeout( () => { 
            if (pooling!==undefined) clearTimeout(pooling)
            reject(`Timeout in function 'WaitUntilDone' after '${timeout} milisecs'. Condition was not satisfied before timeout.`)
        }, timeout) as unknown as number

        const pool = () => {
            effect()
                .then( a => {
                    if(condition(a)===true) {
                        if (timerout!==undefined) clearTimeout(timerout)
                        resolve(a);
                    } else {
                        pooling = setTimeout(pool, poolingInterval) as unknown as number
                    }
                })
        }
        pool();      
    })
}


//Test1();


export const repeatPromiseWithInterval = async <A>(p: () => Promise<A>, timesToRepeat: number, intervalMilisecs: number) => {
    const repetitions = Range(0,timesToRepeat,1).map( nTime => async () => {
        const r = await p()
        await delay(intervalMilisecs)
        return r
    })
    const r = await executeInSequence(repetitions)
    return r
}