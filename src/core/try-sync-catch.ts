

import { Result, Result_ } from "../adts/result";



/** Try execute an unsafeEffect and catches the error into the left side of either
 * Note: Eager evaluation
 */
export const TrySync = <A>(LazyUnsafeEffect: () => A): Result<A,Error> => {

    try { 
        return Result_.Ok( LazyUnsafeEffect() ) 
    } catch(e) {

        if(e instanceof Error) {
            // properly handle Error e
            return Result_.Error(e) 
        }
        else if(typeof e === 'string' || e instanceof String) {
            // properly handle e or...stop using libraries that throw naked strings
            return Result_.Error(new Error(String(e))) 
        }
        else if(typeof e === 'number' || e instanceof Number) {
            // properly handle e or...stop using libraries that throw naked numbers
            return Result_.Error(new Error(String(e)))
        }
        else if(typeof e === 'boolean' || e instanceof Boolean) {
            // properly handle e or...stop using libraries that throw naked booleans
            return Result_.Error(new Error(String(e)))
        }
        else {
            // if we can't figure out what what we are dealing with then
            // probably cannot recover...therefore, rethrow
            // Note to Self: Rethink my life choices and choose better libraries to use.
            return Result_.Error(new Error(String(e)))
        }
      
    }

}


// informal test

//TODO: Extract this test to an appropriate file
const Test = () => {

    type AnyResult = Result<any,any>

    const LetsThrow = () => {
        throw new Error(`I've been throwed an error!`)
        return 2
    }

    const NeverThrow = () => {
        return `hello world`
    }

    const a = TrySync(LetsThrow) // Ok a is type: Result<number, Error>
    const b = TrySync(NeverThrow)  // ok b is type: Result<string,Error>

    //TODO: implement test

}

//Test()
