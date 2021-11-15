import { PortOpener } from './port-opener'
import { LoopBackPortA_Path, LoopBackPortB_Path } from './loopback';

describe('Using internal loopback serial port emulator', () => {

    const portA = LoopBackPortA_Path
    const portB = LoopBackPortB_Path

    it('can open port A', async () => {
        const portOpened = await PortOpener(portA, 9600)
        const expected = "PortOpened"
        const actual = portOpened.kind
        expect(expected).toEqual(actual);
        await portOpened.close()
    });

    it('can open port B', async () => {
        const portOpened = await PortOpener(portB, 9600)
        const expected = "PortOpened"
        const actual = portOpened.kind
        expect(expected).toEqual(actual);
        await portOpened.close()
    });

    it('can sent data to port B and receive it into port A', async () => {
        // prepare
        const expected = [1,2,3,4,5]
        const portAOpened = await PortOpener(portA, 9600)
        const portBOpened = await PortOpener(portB, 9600)
        // act
        portBOpened.onData( actual => {
            // check
            expect(expected).toEqual(actual);
        })
        await portAOpened.write(expected)
    })

    it('can sent data to port A and receive it into port B', async () => {
        // prepare
        const expected = [1,2,3,4,5]
        const portAOpened_inv = await PortOpener(portB, 9600)
        const portBOpened_inv = await PortOpener(portA, 9600)
        // act
        portBOpened_inv.onData( actual => {
            // check
            expect(expected).toEqual(actual);
        })
        await portAOpened_inv.write(expected)
    })
})