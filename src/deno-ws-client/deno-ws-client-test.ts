// ATTENTION:   to run this test first start the node-js websocket mock typing: 
//              npx ts-node ts-node-ws-server.ts
//  TODO        1) make the above step automatic
//              2) test also the ping - pong and receive a close from the server 

import { assert, fail, assertEquals } from "https://deno.land/std/testing/asserts.ts";
import { exists, existsSync } from "https://deno.land/std@0.67.0/fs/exists.ts";
import { exec, IExecResponse, OutputMode } from "https://deno.land/x/exec@0.0.5/mod.ts"
import { delay } from '../utils/delay.ts'

import { WSClientConstructor, WSClientConfig } from './deno-ws-client.ts'

const m = (_case: string) => `deno-ws-client -> ${_case} -> `

const wsServerFile = 'ts-node-ws-server.ts'
const pathToNpx = '../../node_modules/npx/index.js'
const childNodeProcessTimeout = 15000 //depend of the speed of your computer you should make this value higher. (60s should be enough for slower PC's)
const shellRunTsNode =`node ${pathToNpx} ts-node ${wsServerFile}` //shell command to run wsServerFile


//


//const scenario: Scenario = 

Deno.test(m(`typescript node ws-server file='${wsServerFile}' exists`), async () => {
    const expected = await exists(`./${wsServerFile}`)
    const actual = true
    assertEquals(actual,expected)
})

/*
Deno.test({
    sanitizeOps: false,
    sanitizeResources: false,
    name: m(`Can run node simple ws server`), 
    fn: async () => {

            const status = await new Promise<IExecResponse>( (resolve, reject) => {
                const status = Promise.race([TimeOut(), StartServer()]).then( res => {
                    if (res===undefined) 
                        reject(`Unexpected error!`)
                    else {
                        if (res.status.success==false) {
                            reject(`Error on attempt to run child Process of command '${shellRunTsNode}', here the error code '${res.status.code}' and here is the stdout/stderr result: '${res.output}'`)
                        } else {
                            resolve(res)
                        }
                    }
                })
            })
            
            const expected = true
            const actual = status.status.success
            assertEquals(actual,expected)
        },
})*/

/**
Deno.test({
    sanitizeOps: false,
    sanitizeResources: false,
    name: m(`Can use deno ws client to communicate with simple deno ws server`), 
    fn: async () => {

        const serverRunner = () => new Promise<IExecResponse>( (resolve, reject) => {
            console.log(`DENO: Starting server`)
            const status = Promise.race([TimeOut(), StartServer()]).then( res => {
                if (res===undefined) 
                    reject(`Unexpected error!`)
                else {
                    if (res.status.success==false) {
                        reject(`Error on attempt to run child Process of command '${shellRunTsNode}', here the error code '${res.status.code}' and here is the stdout/stderr result: '${res.output}'`)
                    } else {
                        resolve(res)
                    }
                }
            })
        })
        


        // ------------------------------------------
        // Client code
        // ------------------------------------------

        console.log()
        console.log('---------------------------------------')
        console.log(`LOG: Client test has been started.`)
        console.log('---------------------------------------')
    
        // onconnect send a pingSignal
        const config: WSClientConfig = {
            endPoint:  'ws:127.0.0.1:8080',
            onError: (err) => console.error(`Erro ${err}`),
            receptionHandlers: {
                OnData: (data) => console.log(`EVENT OnData: '${data}'`),
                CloseEvent: (endPoint, ev) => console.log(`EVENT CloseEvent: endPoint: ${endPoint}, code: '${ev.code}', reasson: '${ev.reason}'`),
                onConnect: (endpoint, sock) => {
                    console.log(`EVENT onConnect: connected: '${endpoint}', isClosed?: '${sock.isClosed}'`);
                    //send
                    console.log('LOG: Pinging...')
                    sock.ping();
                },
                PingEvent: (ev, sock) => console.log(`ping event: '${ev}', sock.isClosed?:${sock.isClosed}`) ,
                PongEvent: (ev, sock) => {
                    console.log(`Event PongEvent: ev: '${ev}', sock.isClosed?: ${sock.isClosed}`)
                    //console.log('LOG: Pong!')
    
                    sock.close().then( () => {
                        console.log(`LOG: socket has closed`)
                    }).catch( reason => 
                        console.error(`LOG: error on closing socket: ${reason}`)
                    )
                }
            }
        }
    
        console.log(`LOG: trying to connect to '${config.endPoint}' ...`)
        const client = WSClientConstructor(config)
        const clientRunner = () => client.connectToServer().finally( () => {
            console.log()
            console.log('------------------------------------------')
            console.log('LOG: DONE - test finished. Good job team!')
            console.log('------------------------------------------')
        })
    


        // ------------------------------------------

        const allTasks = () => new Promise<void>( async (resolve, reject) => {
            await Promise.race([serverRunner(), clientRunner()]).then( res => {
                if (res===undefined)
                    resolve(undefined)
                else {
                    if (res.status.success==false) {
                        reject(`Error on attempt to run child Process of command '${shellRunTsNode}', here the error code '${res.status.code}' and here is the stdout/stderr result: '${res.output}'`)
                    } else {
                        resolve(undefined)
                    }
                }
            })
        })

        await allTasks()
                            

        const expected = true
        const actual =  true //status===undefined? undefined : status.status.success
        assertEquals(actual,expected)

    },
})
*/

const log = (text?: string) => { /*console.log(text)*/ }

Deno.test({
    sanitizeOps: false,
    sanitizeResources: false,
    name: m(`Comunicate with the websocket server, simply check if it is working`), 
    fn: async () => {
        log()
        log('---------------------------------------')
        log(`LOG: Client test has been started.`)
        log('---------------------------------------')

        const endPoint = 'ws:127.0.0.1:8080' as const

        type TestCase = {
            hasConnected: boolean
            //hasBeenPinged: boolean // not implemented
            hasPonged: boolean     
            hasReceivedSomethinbg: boolean
            //hasClosed: boolean    // not implemented
            notHasError: boolean
        }

        let probe: TestCase = {
            hasConnected: false,
            hasPonged: false,
            hasReceivedSomethinbg: false,
            notHasError: true,
        }
        // onconnect send a pingSignal
        const config: WSClientConfig = {
            endPoint,
            onError: (err) => { 
                console.error(`Erro ${err}`);
                probe = { ...probe, notHasError: false }
            },
            receptionHandlers: {
                OnData: (data, sock) => { 
                    log(`EVENT OnData: '${data}'`);
                    probe = { ...probe, hasReceivedSomethinbg: true }
                    sock.send(`Data sent from the client`)
                },
                CloseEvent: (endPoint, ev) => {
                    log(`EVENT CloseEvent: endPoint: ${endPoint}, code: '${ev.code}', reasson: '${ev.reason}'`);
                    
                },
                onConnect: (endpoint, sock) => {
                    log(`EVENT onConnect: connected: '${endpoint}', isClosed?: '${sock.isClosed}'`);
                    probe = { ...probe, hasConnected: true}
                    //send
                    log('LOG: Pinging...')
                    sock.ping();
                    //program the the close command
                    //delay(1500).then( () => sock.close())
                },
                PingEvent: (ev, sock) => {
                    log(`ping event: '${ev}', sock.isClosed?:${sock.isClosed}`); 
                },
                PongEvent: (ev, sock) => {
                    log(`Event PongEvent: ev: '${ev}', sock.isClosed?: ${sock.isClosed}`)
                    //console.log('LOG: Pong!')
                    probe = { ...probe, hasPonged: true }
                    /*sock.close().then( () => {
                        log(`LOG: socket has closed`)
                    }).catch( reason => 
                        log(`LOG: error on closing socket: ${reason}`)
                    )*/
                }
            }
        }

        log(`LOG: trying to connect to '${config.endPoint}' ...`)
        const client = WSClientConstructor(config)
        await client.connectToServer().finally( () => {
            log()
            log('------------------------------------------')
            log('LOG: DONE - test finished. Good job team!')
            log('------------------------------------------')
        })

        log(String(probe))

        const expected: TestCase = {
            hasConnected: true,
            hasPonged: true,
            hasReceivedSomethinbg: true,
            notHasError: true,
        }
        const actual = probe
        assertEquals(actual,expected,"This test implies that a concrete mock ws-server is running on localhost")
    }
})


