import { FrameInterpreted } from ".."
import { ACK, ESC, ETX, NACK, STX } from "../core-types"
import { InterpretIncomming } from "./interpreter-refactored"


const correctMasterFrame = [0x1B, 0x02, 0x01, 0x87, 0x3E, 0x3F, 0x1B, 0x03, 0xF6,]
const correctMasterFrameInterpreted: FrameInterpreted = {
    firstEsc: [ESC],
    startByte: [STX],
    dirChan: [0x01],
    waddr: [0x87],
    dataLow: [0x3E],
    dataHigh: [0x3F],
    lastEsc: [ESC],
    etx: [ETX],
    checkSum: [0xF6],
    expectedChecksum: 0xF6,
}

const correctSlaveFrame = [0x1B, 0x06, 0x01, 0x87, 0x01, 0x86, 0x1B, 0x03, 0xE8,]
const correctSlaveFrameInterpreted: FrameInterpreted = {
    firstEsc: [ESC],
    startByte: [ACK],
    dirChan: [0x01],
    waddr: [0x87],
    dataLow: [0x01],
    dataHigh: [0x86],
    lastEsc: [ESC],
    etx: [ETX],
    checkSum: [0xE8],
    expectedChecksum: 0xE8,
}

describe('basic tests', () => {

    it('can parse a correct master frame', async () => {
        //prepare
        const probe = correctMasterFrame
        const probeInterpreted = correctMasterFrameInterpreted
        const parser = InterpretIncomming
        const parse = parser(
            //frameinterpreted
            event => {
                const { frameInterpreted, rawInput} = event
                //check
                expect(frameInterpreted).toStrictEqual(probeInterpreted)
                expect(rawInput).toStrictEqual(probe)
            },
            //onError
            event => {

            },
            //onStateChange
            event => {
                
            }
        )

        //act
        probe.forEach( byte => parse(byte))
    })

    it('can parse three correct master frames', async () => {
        //prepare
        let count = 0
        const probe = [...correctMasterFrame,...correctMasterFrame, ...correctMasterFrame]
        const probeInterpreted = correctMasterFrameInterpreted
        const parser = InterpretIncomming
        const parse = parser(
            //frameinterpreted
            event => {
                const { frameInterpreted, rawInput} = event
                //check
                expect(frameInterpreted).toStrictEqual(correctMasterFrameInterpreted)
                count++
            },
            //onError
            event => {

            },
            //onStateChange
            event => {
                
            }
        )

        //act
        probe.forEach( byte => parse(byte))
        expect(count).toEqual(3) 
            
    })

    it('can parse a correct slave frame', async () => {
        //prepare
        const probe = correctSlaveFrame
        const probeInterpreted = correctSlaveFrameInterpreted
        const parser = InterpretIncomming
        const parse = parser(
            //frameinterpreted
            event => {
                const {frameInterpreted, rawInput} = event
                //check
                expect(frameInterpreted).toStrictEqual(probeInterpreted)
                expect(rawInput).toStrictEqual(probe)
            },
            //onError
            event => {

            },
            //onStateChange
            event => {
                
            }
        )

        //act
        probe.forEach( byte => parse(byte))
    })
})