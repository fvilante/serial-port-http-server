import { 
    listSerialPorts,
    isSerialPortLoopBackForTest as isSerialPortLoopBack,
} from "./list-serial-ports"


const Helper_ListPorts_or_Throw = async () => await listSerialPorts().fmap( r => r.orDie()).async()

describe('list-serial-ports', () => {
    
    it('can list two loop-back emulated serial ports', async () => {

        // prepare
        const portsList = await Helper_ListPorts_or_Throw()
        const onlyLoopbackEmulatedPorts = portsList.filter( port => isSerialPortLoopBack(port))
        const expected = 2 // expect two loopback emulated ports
        // act
        const actual = onlyLoopbackEmulatedPorts.length
        // check
        expect(actual).toEqual(expected);
    })

    //NOTE: Even when you have any serial port instaled, the call to the function
    //      to list serial ports should not throw an error, but instead just return
    //      an empty array.
    it('the call to listSerialPorts do not raise any expeption', async () => {

        try {
            await Helper_ListPorts_or_Throw()
            expect(true).toBe(true)
        } catch (err) {
            expect(true).toBe(false)
        }
    })

})