import { BarCode } from './barcode-core'
import { parseBarCode } from './barcode-stream'


type TestCase = { input: string, output: BarCode}
const runTest = (testCases: readonly TestCase[]):void => {
    const expected = testCases.map( x => x.output)
    //act
    const actual = testCases.map( data => parseBarCode(data.input)) 
    //check
    expect(actual).toEqual(expected)
}

describe('basic tests', () => {
    it('Can parse valid well formed values', async () => {
        //prepare
        const validValues: readonly TestCase[] = [
            { input: 'M#123-abc', output: { kind: 'BarCode', data: 'M#123-abc'} },
            { input: '123-abc', output: { kind: 'BarCode', data: '123-abc'} },
            { input: '123abc', output: { kind: 'BarCode', data: '123abc'} },
            { input: 'AnythingCanBeABarCode', output: { kind: 'BarCode', data: 'AnythingCanBeABarCode'} },
            
        ]
        runTest(validValues)
    })

    it('Can trim spaces before and after input', async () => {
        //prepare
        const wellFormedInput: string = '___AnythingCanBeABarCode____'
        const output: BarCode = {
            kind: 'BarCode',
            data: wellFormedInput,
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

})