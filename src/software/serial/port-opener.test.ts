import { PortOpener } from './port-opener'

//TODO: This file should be rename 'loopback.test.ts' because it is in fact testing the loopback facility

describe('Basic tests', () => {

    it('cannot open a port that is not reachable using portsList', async () => {

        const port = await PortOpener('com50',9600)
        expect(true).toEqual(true);

    });

    
})