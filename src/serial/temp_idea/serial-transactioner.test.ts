import { Bytes } from "../../core/byte"
import { PortSpec } from "../core/port-spec"
import { getLoopBackEmulatedSerialPort, LoopBackPortA_Path, LoopBackPortB_Path } from "../port-controler/loopback/loopback"
import { contramapTransactioner, makeSerialTransactioner, mapTransactioner, scanTransactioner } from "./serial-transactioner"


describe('basic tests', () => {

    const portA: PortSpec = {path: 'loopback_a', baudRate: 9600}
    const portB: PortSpec = {path: 'loopback_b', baudRate: 9600}

    it('can run a simple transactioner constructed from a opened serial port', async () => {
        //prepare
        const expected = [1,2,3] as const
        const [source, dest] = getLoopBackEmulatedSerialPort(portA,portB)
        const transactionerA = makeSerialTransactioner(source)
        const transactionerB = makeSerialTransactioner(dest)
        //act
        transactionerB.onData( data => {
            //check
            expect(data).toEqual(expected)
        })
        await transactionerA.write(expected)
    })

    it('can run map a transactioner', async () => {
        //prepare
        type Output = readonly number[]
        const probe:Bytes = [1,2,3] as const
        const operation = (n: number):number => n+1
        const f = (a: Bytes):Output => [...a].map(operation) 
        const expected = [...probe].map(operation)
        const [source, dest] = getLoopBackEmulatedSerialPort(portA,portB)
        //act
        const transactionerA = makeSerialTransactioner(source)
        const transactionerB = makeSerialTransactioner(dest)
        const mappedB = mapTransactioner(transactionerB, f)
        mappedB.onData( data => {
            //check
            expect(data).toEqual(expected)
        })
        await transactionerA.write(probe)
    })

    it('can run map a transactioner', async () => {
        //prepare
        type Input = readonly number[]
        const probe: Input = [1,2,3] as const
        const operation = (n: number):number => n-1
        const f = (a: Input):Bytes => a.map(operation) 
        const expected = [...probe].map(operation) 
        const [source, dest] = getLoopBackEmulatedSerialPort(portA,portB)
        //act
        const transactionerA = makeSerialTransactioner(source)
        const transactionerB = makeSerialTransactioner(dest)
        const contraMappedA = contramapTransactioner(transactionerA, f)
        transactionerB.onData( data => {
            //check
            expect(data).toEqual(expected)
        })
        await contraMappedA.write(probe)
    })

    it('can scan the output of a transactioner', async () => {
        //prepare
        type Output = number
        const input:Bytes = [1,2,3,4,5] as const
        const initialValue: Output = 0
        const expectedOutput: Output = [...input].reduce( (acc,cur) => acc+cur, initialValue)
        const f = (acc: number, cur: Bytes):number => acc+[...cur].reduce( (acc,cur) => acc+cur, initialValue) 
        const [source, dest] = getLoopBackEmulatedSerialPort(portA,portB)
        //act
        const transactionerA = makeSerialTransactioner(source)
        const transactionerB = makeSerialTransactioner(dest)
        const mappedB = scanTransactioner(transactionerB, f, initialValue)
        mappedB.onData( data => {
            //check
            expect(data).toEqual(expectedOutput)
        })
        await transactionerA.write(input)
    })


})

