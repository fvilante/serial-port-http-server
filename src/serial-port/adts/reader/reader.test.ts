import { Future_ } from '../future'
import {Reader, Reader_} from './reader'

describe('basic tests', () => {

    it('Can read a simple enviroment from sync constructor', async () => {
        //prepare
        type Info = number
        const probe: Info = 7
        let buf: Info[] = []
        type Enviroment = {logger: (_:Info) => void}
        const enviroment: Enviroment = { logger: n => buf.push(n)}
        const expected = [probe, probe]
        const effect =  (env:Enviroment) => {env.logger(probe); env.logger(probe);}
        //act
        const action = Reader_.fromSync(effect) //log 2 times
        //check
        await action.unsafeRun(enviroment).async()
        expect(buf).toEqual(expected)
    })

    it('Can read a simple enviroment from async constructor', async () => {
         //prepare
         type Info = number
         const probe: Info = 7
         let buf: Info[] = []
         type Enviroment = {logger: (_:Info) => void}
         const enviroment: Enviroment = { logger: n => buf.push(n)}
         const expected = [probe, probe]
         const effect =  (env:Enviroment) => Future_.fromThunk(() => {
            env.logger(probe); 
            env.logger(probe);
        })
         //act
         const action = Reader_.fromAsync(effect) //log 2 times
         //check
        await action.unsafeRun(enviroment).async()
        expect(buf).toEqual(expected);
        //done()
    })

    it('Can unsafe run direct to a cosumer function', async (done) => {
        //prepare
        type Info = number
        const probe: Info = 7
        let buf: Info[] = []
        type Enviroment = {logger: (_:Info) => void}
        const enviroment: Enviroment = { logger: n => buf.push(n)}
        const expected = [probe, probe]
        const effect =  (env:Enviroment) => Future_.fromThunk(() => {
            env.logger(probe); 
            env.logger(probe);
        })
        //act
        const action = Reader_.fromAsync(effect) //log 2 times
        //check
        action.unsafeRunF(enviroment, () => {
            expect(buf).toEqual(expected);
            done()
        })
        
   })

   it('Can map simple sync function', async (done) => {
        //prepare
        type Info = 7
        const probe: Info = 7 
        let buf: Info[] = []
        type Enviroment = {inc: (_:Info) => void}
        const enviroment: Enviroment = { inc: n => n+1}
        const expected = 8
        const reader = Reader_.fromSync<Enviroment,Info>( env => probe)
        //act
        const action = reader.map((num, env) => env.inc(num))
        //check
        action.unsafeRunF(enviroment, actual => {
            expect(actual).toEqual(expected);
            done()
        })
    
    })

    it('Can contramap', async (done) => {
        //prepare
        type Info = 7
        const probe: Info = 7 
        let buf: Info[] = []
        type Enviroment = {send: (_:Info) => void}
        type PrimaryEnv = Enviroment & { sendAny: (info: string) => void}
        const enviroment: Enviroment = { send: info => buf.push(info) }
        const primaryEnv: PrimaryEnv =  { ...enviroment, sendAny: data => { throw new Error(data) }}
        const reader = Reader_.fromSync<Enviroment,Info>( env => probe)
        //act
        const action = reader.contramap((x: PrimaryEnv) => ({send: x.send})) //log 2 times
        //check
        action.unsafeRunF(primaryEnv, actual => {
            expect(actual).toEqual(probe);
            done()
        })
    
    })

    it('Can provide an enviroment', async () => {
        //prepare
        type Info = number
        const probe: Info = 7
        let buf: Info[] = []
        type Enviroment = {logger: (_:Info) => void}
        const enviroment: Enviroment = { logger: n => buf.push(n)}
        const expected = [probe, probe]
        const effect =  (env:Enviroment) => {env.logger(probe); env.logger(probe);}
        const reader = Reader_.fromSync(effect) //log 2 times
        //act
        const action = reader.provide(enviroment).map( () => probe)
        //check
        await action.unsafeRun().async()
        expect(buf).toEqual(expected)
    })
})