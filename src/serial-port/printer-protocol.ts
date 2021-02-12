
// ===========================================================================================
// Printer Protocol: Lightwave driver for Markem-Image 9232
// ===========================================================================================
//
// 1. Select remote message
// 2. Set the text of the remote message
//
// Note: a. The format of the message is configured directly in the printer.
//       b. Printer returns 21 if NACK or 6 if ACK.
//
//
// ===========================================================================================


const xor = (a: number, b: number): number => a ^ b

// make a frame that will set the text on the current remote field layout
export const mkSetRemoteMessageFrame = (texto: string): readonly number[] => {
    let acc: number = 0
    const cmd = 0x99 // commando da impressora para atualizacao de msg em campo remoto
    const length = [0x00, texto.length+2] // tamanho da string (0 até 0xFFFF) (adicionado de 2 que é o delimitador final e o checksum (acho))
    const delimiter = 0x12 // delimitador de variavel
    const text = texto.split('').map( each => each.charCodeAt(0))
    const frame_ = [cmd, ...length, delimiter, ...text, delimiter,]
    for (const each of frame_) {
        acc = xor(acc, each)
        //console.log(each, each.toString(16), acc.toString(16))
    }
    const checksum = acc
    const frame = [...frame_, checksum]
    return frame
}



// seleciona mensagem de campo remoto, os indexes estao entre 1 a 999
export const mkSelectRemoteMessageFrame = (remoteIndex: number): readonly number[] => {
    let acc: number = 0
    const cmd = 0x98 // Comando para seleção na 9232
    const length = [0x00, 0x02] // Tamanho da string. Compreende a contagem de bytes utilizada a partir do próximo byte (inclusive) até o Checksum (exclusive)
    // pra facilitar vou permitir selectionar entre 0 e 255 campos remotos:
    const selector = [0x00, remoteIndex] // Número da mensagem da biblioteca da impressora. De 1 a 999 na impressora (De 00 01 a 03 E7 em hexadecimal) 00h, 01h
    const frame_ = [cmd, ...length, ...selector]
    for (const each of frame_) {
        acc = xor(acc, each)
        //console.log(each, each.toString(16), acc.toString(16))
    }
    const checksum = acc
    const frame = [...frame_, checksum]
    return frame
}


// informal tests

const Test1 = () => {
    const message = 'V09/14 L14I32F 12:29'
    const frame = mkSetRemoteMessageFrame(message)
    console.log(frame.map( each => each.toString(16)))
    // expected => hex [99 00 16 12 56 30 39 2F 31 34 20 4C 31 34 49 33 32 46 20 31 32 3A 32 39 12 8F]
}

const Test2 = () => {
    console.log(mkSelectRemoteMessageFrame(1).map( c => c.toString(16)))
    // expected ==> hex [ '98', '0', '2', '0', '1', '9b' ]
}
