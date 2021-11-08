import { 
    listSerialPorts,
    isSerialPortEmulatedWithCom0Com,
} from "./list-serial-ports"

describe('list-serial-ports', () => {
    
    //NOTE: com0com is a free software to emulate serial port.
    //      it's not necessary to have this software instaled, but if you have this
    //      test will check it. Maybe this test be removed in future, because it
    //      may rise false alarm when other developers without com0com instaled
    //      run the test in his machine.
    //NOTE: The com0com is just a loopback at windows layer, see: http://com0com.sourceforge.net/
    it('can list two serial ports emulated with com0com', async () => {

        // prepare
        const portsList = await listSerialPorts()
        const onlyEmulatedPorts = portsList.filter( port => isSerialPortEmulatedWithCom0Com(port))
        const expected = 2 // expect two loopback emulated ports
        // act
        const actual = onlyEmulatedPorts.length
        // check
        expect(actual).toEqual(expected);
    })

    //NOTE: Even when you have any serial port instaled, the call to the function
    //      to list serial ports should not throw an error, but instead just return
    //      an empty array.
    it('the call to listSerialPorts do not raise any expeption', async () => {

        try {
            await listSerialPorts()
            expect(true).toBe(true)
        } catch (err) {
            expect(true).toBe(false)
        }
    })

})