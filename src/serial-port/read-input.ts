import readline from 'readline'
import { now } from './utils'
import { Push } from './push-stream'

type KeyEvent_ = {
    timePoint: number,
    sequence: string,   // utf-8 etc
    name: string,       // key without shif or alt or control
    ctrl: boolean,
    meta: boolean, // alt
    shift: false,
}

const startReadingBarCode = (): Push<KeyEvent_> => Push( yield_ => {

    readline.emitKeypressEvents(process.stdin);
    process.stdin.setRawMode(true);
    
    process.stdin.on('keypress', (str , key) => {
        const timePoint: number = now()
        const str_: string = str
        const key_: KeyEvent_ = {...key, timePoint}
    
        if ( key_.sequence === '\u0003' ) {
            process.exit();
        } else {
            yield_(key_)
        }

    })

})

const Test1 = () => {
    const initialTimePoint = now()
    const r = startReadingBarCode()
        //.map( event => event.name)
        .filter( ev => ev.name==='return')
        //.tap0( ev => console.log(`timePoint1 ${ev.timePoint}`,ev))
        .scan( (acc,cur) => {
            const [lastDelta_, lastTimePoint] = acc
            const currentTimePoint = cur.timePoint
            const deltaTime = (currentTimePoint - lastTimePoint)
            return [deltaTime, currentTimePoint]
        }, [0,initialTimePoint])
        .tap0( delta => console.log(`time between return keystroke = ${delta} msecs`))
        .unsafeRun( ev => undefined)
}
console.log('vai',now() - now())

Test1()


