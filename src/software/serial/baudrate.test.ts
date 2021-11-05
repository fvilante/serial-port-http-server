import { PossibleBaudRates } from './baudrate'

describe('basic tests', () => {

    it('Has minimal necessaries baudRates defineds', () => {
        // prepare
        const necessariesBaudRates = [2400, 9600]
        // act
        const hasNecessaryBaudRates = PossibleBaudRates.some( p => necessariesBaudRates.some(n => n===p)) 
        // test
        expect(hasNecessaryBaudRates).toEqual(true)
    })
})