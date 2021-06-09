import { Push_ } from "../../adts/push-stream"
import { compileCoreFrame, ESC, flattenFrameSerialized, FrameCore } from "./cmpp-datalink-protocol"
import { adaptCmppInterpreterToGenericInterpreter, closeEnviroment, FrameInterpreter, initializeEnviroment, port___, runReader, runTransaction, runTransaction2, runWritter, serializeFrame } from "./syn-conn2.infra"


// FIX: This unit test does naturally projects how the API of CMPP datalink should be
//      I was developing this unit test side-by-side the syn-conn2.infra.ts where
//      the infrastructure of CMPP datalink API is being developed.
//      The tests should be refactored to become more robust, and should be 
//      considered a "live document" and not a static one.
//      I stoped this development for a moment, to make something similar
//      with the Browser run-time front-end. My objective right now (today)
//      is to access data from the typescript-nodejs code universe (adts, etc)
//      in the browser, and render some data in it. As well as try to send back
//      to typescript-nodejs server some information (not today eventually)
//      My intention is to comeback here to finish this datalink API development

const stopTest = (err: unknown):never => {
    throw new Error(String(err)) 
}

describe('basic tests (over real hardware [cmpp pci + comport + CMPP00LG or similar]', () => {

    beforeEach( initializeEnviroment )
    afterEach( closeEnviroment )

    it('can use portOpenedADT to send and receive any data', async (done) => {
        // ==== prepare
        const portOpened = port___ 
        const frame = [ 27, 2, 64, 96, 8, 0, 27, 3, 83 ] as const //valid cmpp frame
        //write
        const w_ = portOpened.write(frame)
        const w = w_.matchResult({
            Error: err => stopTest(err),
            Ok: finished => {},
        })
        //read
        const r_ = portOpened.onData()
        const r = r_.matchResult({
            Error: err => stopTest(err),
            Ok: response => response,
        })
        // ==== act
        w.unsafeRun( () => {
            //console.log('has finished to write: ', frame)
            r.takeFirst().unsafeRun( someData => {
                //==== check
                //console.log('receiving data: ', someData)
                const shouldBeEsc = someData[0] 
                expect(shouldBeEsc).toEqual(ESC)
                done();
            })
        })
        
        
    })

    it('can send a good normal frame and receive something', async (done) => {
        // ==== prepare
        const portOpened = port___
        const frame = [ 27, 2, 64, 96, 8, 0, 27, 3, 83 ] //cmpp frame
        const w_ = portOpened.write(frame)
        const w = runWritter(w_);
        const r_ = portOpened.onData()
        const r = runReader(r_)
        // ==== act
        w.unsafeRun( () => {
            //console.log('has finished to write', frame)
            r.takeFirst().unsafeRun( someData => {
                // ==== check
                //console.log('receiving data', data)
                const shouldBeEsc = someData[0] 
                expect(shouldBeEsc).toEqual(ESC)
                done();
            })
        })
    })

    it('can send a normal frame and receive the time between transmission and reception', async (done) => {
        //prepare
        const conn = port___
        const frame = [ 27, 2, 64, 96, 8, 0, 27, 3, 83 ]
        const w_ = conn.write(frame)
        const w = runWritter(w_);
        const r_ = conn.onData()
        const r = runReader(r_)
        const effect = runTransaction(w,r)
        effect.unsafeRun( info => {
            console.log(info)
            expect(info.timeToReceive).toBeGreaterThan(1) // normally at 9600 takes 28 msecs to get first chunk of cmpp repsonse
            done()
        })
        //act
        //check
    })

    it('can send a normal frame of a cmpp datalink frame ', async (done) => {
        //prepare
        const conn = port___
        const frame: FrameCore = {
            channel: 0,
            direction: 'Solicitacao',
            startByte: 'STX',
            uint16: 0,
            waddr: 0xA0
        }
        const [frame_, frame__] = serializeFrame(frame)
        const w_ = conn.write(frame__)
        const w = runWritter(w_);
        const r_ = conn.onData()
        const r = runReader(r_)
        const effect = runTransaction(w,r)
        effect.unsafeRun( info => {
            console.log(info)
            expect(true).toBe(true)
            done()
        })
        //act
        //check
    })

    it('can interpret a simple frame with an interpreter', async (done) => {
        //prepare
        const frame: FrameCore = {
            channel: 0,
            direction: 'Solicitacao',
            startByte: 'STX',
            uint16: 0,
            waddr: 0xA0
        }
        const [frame_, frame__] = serializeFrame(frame)
        const frame___ = Push_.fromArray(frame__)
        const effect = FrameInterpreter(frame___).FrameInterpreted
        
        effect.unsafeRun( frame => {
            console.log('frame interpreted=',frame)
            expect(true).toBe(true)
            done()
        })
        //act
        //check
    })

    it('can interpret four simple frames in sequence', async (done) => {
        //prepare
        const frame: FrameCore = {
            channel: 0,
            direction: 'Solicitacao',
            startByte: 'STX',
            uint16: 0,
            waddr: 0xA0
        }
        const frames = [frame, frame]
        const [frame_, frame__] = serializeFrame(frame)
        const frame___ = Push_.fromArray([...frame__, ...frame__,...frame__, ...frame__])
        const effect = FrameInterpreter(frame___).FrameInterpreted

        effect.unsafeRun( frame => {
            console.log('frame interpreted=',frame)
            expect(true).toBe(true)
            done()
        })
        //act
        //check
    })

    it('can produced a failed frame and interpret its error', async (done) => {
        //prepare
        const frailedFrame = [ 27, 2, 64, 96, 8, 0, 27, 3, 66 ] // wrong checksum
        const frame___ = Push_.fromArray(frailedFrame)
        const effect = FrameInterpreter(frame___).onError

        effect.unsafeRun( frame => {
            console.log('frame interpreted=',frame)
            expect(true).toBe(true)
            done()
        })
        //act
        //check
    })

    it("can read interpretation states", async (done) => {
        //prepare
        const frailedFrame = [ 27, 2, 64, 96, 8, 0, 27, 3, 83 ] // wrong checksum
        const frame___ = Push_.fromArray(frailedFrame)
        const effect = FrameInterpreter(frame___).onStateChange

        effect.unsafeRun( frame => {
            console.log('frame interpreted=',frame)
            expect(true).toBe(true)
            done()
        })
        //act
        //check
    })


    it('can transact one cmpp frame and measure statistics of the time travel', async (done) => {
        //prepare
        const conn = port___
        const frame: FrameCore = {
            channel: 0,
            direction: 'Solicitacao',
            startByte: 'STX',
            uint16: 0,
            waddr: 0xA0
        }
        const [, frame__] = serializeFrame(frame)
        const w_ = conn.write(frame__)
        const w = runWritter(w_);
        const r_ = conn.onData()
        const r = runReader(r_)
        const interpreter = adaptCmppInterpreterToGenericInterpreter(FrameInterpreter)
        const r__ = Push_.droplet(r)
        const effect = runTransaction2(w,r__,interpreter)
        effect.unsafeRun( r => {
            const a = r.forOk( ([frame,info]) => {
                console.log(info)
                expect(true).toBe(true)
                done()
            })
            
        })
        //act
        //check
    })

    it('can transact three cmpp frame sequentially one after other and measure statistics of the time travel', async (done) => {
        //prepare
        const conn = port___
        const frame1: FrameCore = {
            channel: 0,
            direction: 'Solicitacao',
            startByte: 'STX',
            uint16: 0,
            waddr: 0xA0
        }
        const frame2: FrameCore = {
            channel: 0,
            direction: 'Solicitacao',
            startByte: 'STX',
            uint16: 0,
            waddr: 200
        }
        const frame3: FrameCore = {
            channel: 0,
            direction: 'Solicitacao',
            startByte: 'STX',
            uint16: 0,
            waddr: 13
        }
        const [, frame__1] = serializeFrame(frame1)
        const [, frame__2] = serializeFrame(frame2)
        const [, frame__3] = serializeFrame(frame3)
        const w_ = conn.write([...frame__1,...frame__2,...frame__3])
        const w = runWritter(w_);
        const r_ = conn.onData()
        const r = runReader(r_)
        const interpreter = adaptCmppInterpreterToGenericInterpreter(FrameInterpreter)
        const r__ = Push_.droplet(r)
        const effect = runTransaction2(w,r__,interpreter)
        effect.unsafeRun( r => {
            r.match( {
                Error: err => console.log(err),
                Ok: ([frame,info]) => {
                    console.log(frame)
                    console.log(info)
                    
                    expect(true).toBe(true)
                    done()
                }
            })
            
        })
        //act
        //check
    })

})