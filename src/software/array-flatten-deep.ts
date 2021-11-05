

export function flattenDeep<T,U>(array: readonly T[]): readonly U[] {
    const isArray = (value: unknown): value is ReadonlyArray<unknown> =>
        Object.prototype.toString.call(value) === '[object Array]'

    const ret: Array<U> = [] 
    const traverse = <A,B>(arr: any , output: any): ReadonlyArray<B> =>
        [...arr].map( elem => 
            isArray(elem)
                ? traverse(elem, output)
                : output.push(elem)
            )
    // tslint:disable-next-line: no-expression-statement
    traverse(array, ret)
    return ret;
  }     