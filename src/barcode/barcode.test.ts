import { Barcode } from './Barcode-core'
import { parseBarcode } from './Barcode-stream'


type TestCase = { input: string, output: Barcode}
const runTest = (testCases: readonly TestCase[]):void => {
    const expected = testCases.map( x => x.output)
    //act
    const actual = testCases.map( data => parseBarcode(data.input)) 
    //check
    expect(actual).toEqual(expected)
}

describe('basic tests', () => {
    it('Can parse valid well formed values', async () => {
        //prepare
        const validValues: readonly TestCase[] = [
            { input: 'M#123-abc', output: { kind: 'Barcode', data: 'M#123-abc'} },
            { input: '123-abc', output: { kind: 'Barcode', data: '123-abc'} },
            { input: '123abc', output: { kind: 'Barcode', data: '123abc'} },
            { input: 'AnythingCanBeABarcode', output: { kind: 'Barcode', data: 'AnythingCanBeABarcode'} },
            
        ]
        runTest(validValues)
    })

    it('Can trim spaces before and after input', async () => {
        //prepare
        const wellFormedInput: string = '___AnythingCanBeABarcode____'
        const output: Barcode = {
            kind: 'Barcode',
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