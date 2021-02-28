import readline from 'readline'
import { Push } from './adts/push-stream'

export type KeyEvent = {
    sequence: string,   // utf-8 etc
    name: string,       // key without shif or alt or control
    ctrl: boolean,
    meta: boolean, // alt
    shift: false,
}


export const readKeyboardAsync = (): Push<KeyEvent> => Push( yield_ => {

    readline.emitKeypressEvents(process.stdin);
    process.stdin.setRawMode(true);

    process.stdin.on('keypress', (str , key) => {
        if ( key.sequence === '\u0003' ) {
            process.exit();
        } else {
            yield_(key)
        }

    })

})


