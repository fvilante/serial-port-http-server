/*

import { Result } from "./result";

*/


/** Try execute an unsafeEffect and catches the error into the left side of either
 * Note: Eager evaluation
 */
/*
export const Try = <A>(LazyUnsafeEffect: () => A): Result<Error,A> => {

    try { 
        return Result.Value( LazyUnsafeEffect() ) 
    } catch(e) {
        // tslint:disable: no-if-statement
        if(e instanceof Error) {
            // properly handle Error e
            return Result.Error(e) 
        }
        else if(typeof e === 'string' || e instanceof String) {
            // properly handle e or...stop using libraries that throw naked strings
            return Result.Error(new Error(String(e))) 
        }
        else if(typeof e === 'number' || e instanceof Number) {
            // properly handle e or...stop using libraries that throw naked numbers
            return Result.Error(new Error(String(e)))
        }
        else if(typeof e === 'boolean' || e instanceof Boolean) {
            // properly handle e or...stop using libraries that throw naked booleans
            return Result.Error(new Error(String(e)))
        }
        else {
            // if we can't figure out what what we are dealing with then
            // probably cannot recover...therefore, rethrow
            // Note to Self: Rethink my life choices and choose better libraries to use.
            return Result.Error(new Error(String(e)))
        }
        // tslint:enable: no-if-statement
    }

}


// informal test

const Test = () => {

    type AnyResult = Result<any,any>

    const LetsThrow = () => {
        throw new Error(`I've been throwed an error!`)
        return 2
    }

    const NeverThrow = () => {
        return `hello world`
    }

    const a = Try(LetsThrow) // Ok a is type: Result<Error, number>
    const b = Try(NeverThrow)  // ok b is type: Result<Error, string>

    const showResult = <T extends AnyResult>(data: T):string => {
        return data.match(
            err => `Peguei o erro: "${err.message}"`,
            val => `Valor chegou: "${val}"`
        )
    }

    console.log(showResult(a))
    console.log(showResult(b))
    /**
     *  OK --> Outputs are:
     *  Peguei o erro: "I've been throwed an error!"
        Valor chegou: "hello world"
     */

//}


// tslint:disable-next-line: no-expression-statement
//Test()
