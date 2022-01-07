import { getLoopBackEmulatedSerialPort } from "../loopback/loopback";
import { portOpener_CB, PortSpec } from "../main/port-opener-cb";

describe('Basic tests', () => {

    it('cannot open a port that is not reachable using portsList', async () => {
        //prepare
        const NONEXISTENT_PORT = 'foobar-com666'
        const spec: PortSpec = {
            path: NONEXISTENT_PORT,
            baudRate: 9600,
        }
        const expectedError = "File not found"
        //act
        portOpener_CB(spec, {
            onSuccess: () => {
                expect(true).toEqual(false);
            },
            onError: (error, spec_) => {
                expect(spec_).toEqual(spec);
                expect(error.kind).toEqual(expectedError)
            }
        })
        //check
        

    });

    it('Error when trying to open an already open and unclosed port', async () => {
        // TODO: To implement
    })

    
})