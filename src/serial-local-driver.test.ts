import { BaudRate, PortOpened, SerialDriverConstructor } from './serial-local-driver'

const com0com_Ports = ['COM4', 'COM5']  as const// see notes in test below (com0com is a windows serial port emulator)
const [COM_A, COM_B] = com0com_Ports

describe('Using the real hardware effects', () => {

    it('can list serial ports (depends on com0com be installed)', () => {

        // NOTE: this will work only if you have the program com0com installed on your machine
        //       else your this test will fail. The com0com is just a loopback at windows layer
        //       see: http://com0com.sourceforge.net/
        // NOTE2: In future would be better to make the Driver have an internal loopback for 
        //        make it possible to list serials without have to install any auxiliary system. 
        const expected = [
            {                                    
                "locationId": "CNCA1",                    
                "manufacturer": "Vyacheslav Frolov",      
                "path": COM_A, //"COM4",                           
                "pnpId": "COM0COM\\PORT\\CNCA1",          
                "productId": undefined,                   
                "serialNumber": undefined,                
                "uid": "COM4",                            
                "vendorId": undefined,                    
            },                                          
            {                                    
                "locationId": "CNCB1",                    
                "manufacturer": "Vyacheslav Frolov",      
                "path": COM_B, //"COM5",                           
                "pnpId": "COM0COM\\PORT\\CNCB1",          
                "productId": undefined,                   
                "serialNumber": undefined,                
                "uid": "COM5",                            
                "vendorId": undefined,                    
            },                                          
        ]



        const driver = SerialDriverConstructor()
        return driver.listPorts().then( ports => {
            const actual = ports
            expect(expected).toEqual(actual);
        })
    
    });


    it('can open serial port (depends on com0com be installed)', async () => {

        const driver = SerialDriverConstructor()
        const ports = await driver.listPorts()
        const portOpened = await driver.open(ports[0].uid, 9600)

        const expected = "PortOpened"
        const actual = portOpened.kind
        expect(expected).toEqual(actual);

        await portOpened.close()
    
    });


    it('can open two independent loop-backed ports and send data bidirectionally (depends on com0com be installed)', async () => {

        const piece =[1,2,3,4,5,4,3,2,1]
        const driver = SerialDriverConstructor()
        const x = await driver.listPorts().then( ports => ports.map( port => driver.open(port.uid, 9600)))
        const [port1, port2] = await Promise.all(x)
        // write port1 -> read port2
        const loopback1 = await new Promise<readonly number[]>( resolve => port1.write(piece).then( () => port2.onData( data => resolve(data))) )
        expect(loopback1).toEqual(piece);
        // other way around
        const loopback2 = await new Promise<readonly number[]>( resolve => port2.write(piece).then( () => port1.onData( data => resolve(data))) )
        expect(loopback2).toEqual(piece);

        await port1.close()
        await port2.close()
    
    });

 
})

describe('Using the real hardware effects', () => {

    it('send and receive a valid frame to CMPP connected on channel 0', async (done) => {

        // prepare
        const portPath = 'com29'
        const portBaudRate: BaudRate = 9600
        const validFrame: readonly number[] =  [ 27, 2, 0, 80, 0, 0, 27, 3, 171 ]
        const expectedResponse: readonly number[] = [ 27, 6, 0, 80, 98, 2, 27, 3, 67 ]
        let buf: readonly number[]=[]
        const driver = SerialDriverConstructor()
        const portOpened = await driver.open(portPath, portBaudRate)
        setTimeout(() => {
            portOpened.close().finally(() => {
                expect(buf).toStrictEqual(expectedResponse)
                done()
            })
        },2000)
        portOpened.write(validFrame)
        portOpened.onData( data => {
            buf = [...buf, ...data]
        })
        

    });
})