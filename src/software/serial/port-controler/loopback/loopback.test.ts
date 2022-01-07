import { portOpener } from '../../port-opener'
import { LoopBackPortA_Path, LoopBackPortB_Path } from './loopback';

//TODO: This file should be rename 'loopback.test.ts' because it is in fact testing the loopback facility

describe('Using internal loopback serial port emulator', () => {

    const portA = LoopBackPortA_Path
    const portB = LoopBackPortB_Path

    it('can open port A', async () => {
        const portOpened = await portOpener({ path: portA, baudRate: 9600 })
        const expected = "PortOpened"
        const actual = portOpened.kind
        expect(expected).toEqual(actual);
        await portOpened.close()
    });

    it('can open port B', async () => {
        const portOpened = await portOpener({ path: portB, baudRate: 9600 })
        const expected = "PortOpened"
        const actual = portOpened.kind
        expect(expected).toEqual(actual);
        await portOpened.close()
    });

    it('can sent data to port B and receive it into port A', async () => {
        // prepare
        const expected = [1,2,3,4,5]
        const portAOpened = await portOpener({ path: portA, baudRate: 9600 })
        const portBOpened = await portOpener({ path: portB, baudRate: 9600 })
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
        const portAOpened_inv = await portOpener({ path: portB, baudRate: 9600 })
        const portBOpened_inv = await portOpener({ path: portA, baudRate: 9600 })
        // act
        portBOpened_inv.onData( actual => {
            // check
            expect(expected).toEqual(actual);
        })
        await portAOpened_inv.write(expected)
    })

    it('can sent data to port B and receive it into port A, then stop to listen on port A', async () => {
        // prepare
        const expected = [1,2,3,4,5]
        const portAOpened = await portOpener({ path: portA, baudRate: 9600 })
        const portBOpened = await portOpener({ path: portB, baudRate: 9600 })
        // act
        let buffer: readonly number[] = []
        const f = (data: readonly number[]) => {
            buffer = [...buffer, ...data]
        }
        portBOpened.onData(f)
        await portAOpened.write(expected)
        expect(buffer).toEqual(expected)
        await portAOpened.write(expected)
        expect(buffer).toEqual([...expected,...expected])
        await portAOpened.write(expected)
        expect(buffer).toEqual([...expected,...expected,...expected])
        portBOpened.removeAllDataListeners()
        await portAOpened.write(expected)
        expect(buffer).toEqual([...expected,...expected,...expected])

    })
})