import readline from 'readline'


export type KeyboardEvent = {
    sequence: string,   // utf-8 etc
    name: string,       // key without shift or alt or control
    ctrl: boolean,
    meta: boolean, // alt
    shift: false,
}


export type KeyboardEventEmitter = (consumer: (f: KeyboardEvent) => void) => void
// Represents a stream of all keystrokes pressed (ctrl+c stops the stream and finish the proccess)
export const keyboardEventEmiter:KeyboardEventEmitter = (consumer: (_:KeyboardEvent) => void):void => {
    readline.emitKeypressEvents(process.stdin);
    process.stdin.setRawMode(true);

    process.stdin.on('keypress', (str , key) => {
        //ctrl-c ( end of text )
        if ( key.sequence === '\u0003' ) {
            console.log('Finalizando programa... ok!')
            process.exit();
        } else {
            consumer(key)
        }

    })
}


