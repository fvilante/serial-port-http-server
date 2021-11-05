import readline from 'readline'
import { Push } from './adts/push-stream'

export type KeyEvent = {
    sequence: string,   // utf-8 etc
    name: string,       // key without shift or alt or control
    ctrl: boolean,
    meta: boolean, // alt
    shift: false,
}

// Represents a stream of all keystrokes pressed (ctrl+c stops the stream and finish the proccess)
export const readKeyboardAsync = (): Push<KeyEvent> => Push( yield_ => {

    readline.emitKeypressEvents(process.stdin);
    process.stdin.setRawMode(true);

    process.stdin.on('keypress', (str , key) => {
        //ctrl-c ( end of text )
        if ( key.sequence === '\u0003' ) {
            process.exit();
        } else {
            yield_(key)
        }

    })

})


