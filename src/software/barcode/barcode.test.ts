import { reduce, flatten, map, pipe} from 'rambda'
import { Maybe } from '../adts/maybe'
import { BarCode } from './barcode-core'
import { parseBarCode } from "./barcode-parser"

type TestCase = { input: string, output: BarCode}
const runTest = (testCases: readonly TestCase[]):void => {
    const expected = testCases.map( x => x.output)
    //act
    const result = testCases.map( data => parseBarCode(data.input)) 
    //check
    const actual = reduce<Maybe<BarCode>,BarCode[]>((acc,cur) => { 
        const value = cur.unsafeRun()
        return value.hasValue ? [...acc,value.value] : [...acc]
    }, [], result)
    expect(actual).toEqual(expected)
}

describe('basic tests', () => {
    it('Can parse valid well formed values', async () => {
        //prepare
        const validValues: readonly TestCase[] = [
            { input: 'M#123-abc', output: { messageText: "abc", partNumber: "123", raw: 'M#123-abc' }},
            { input: 'M#ffffff-ggggg', output: { messageText: "ggggg", partNumber: "ffffff", raw: 'M#ffffff-ggggg' }},
            { input: 'M#Ana-Ana', output: { messageText: "Ana", partNumber: "Ana", raw: 'M#Ana-Ana' }},
        ]
        runTest(validValues)
    })

    it('Can trim spaces before and after input', async () => {
        //prepare
        const wellFormedInput: string = 'M#123-abc'
        const output: BarCode = {
            partNumber: '123',
            messageText: 'abc',
            raw: wellFormedInput,
        }
        const validValues: readonly TestCase[] = [
            { input: ` ${wellFormedInput}`, output },
            { input: `  ${wellFormedInput}`, output },
            { input: `                      ${wellFormedInput}`, output }, //tab left
            { input: `                                     ${wellFormedInput}`, output }, // tab+space left
            { input: ` ${wellFormedInput} `, output },
            { input: `  ${wellFormedInput}  `, output },
            { input: `                      ${wellFormedInput}                      `, output }, //tab 
            { input: `                                     ${wellFormedInput}                                     `, output }, // tab+space 
            { input: `${wellFormedInput} `, output },
            { input: `${wellFormedInput}  `, output },
            { input: `${wellFormedInput}                      `, output },
            { input: `${wellFormedInput}                                     `, output },
        ]
        runTest(validValues)
    })

    it('Can fail on ill-formed input', async () => {
        //TODO: To be implemented
    })


})