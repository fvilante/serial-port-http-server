import { PortOpener } from ".."

// tipos de erro da serial (teste pratico dos efeitos):
//  "Access denied" -- "Error: Opening com50: Access denied." (quando a porta ja esta em uso por outro aplicativo)
// "File not found" -- "Error: Opening com90: File not found" (quando o numero da porta serial nao existe)
// "Port is not open" -- "Error: Port is not open." (se voce tentar fechar uma porta aberta duas vezes ao invees de apenas uma)
// enquanto a porta nao for fechada port.close(), o programa nao termina. (ja tentei o port.removeAllListeners mas o program continua halt)
//      quando voce configura um port.on('data', handler), dai o recurso fica pendurado, e o programa nao encerra enquanto nao houver o port.close()
//      na pesquisa nao consegui uma forma de "fechar a porta" quando nao tiver mais ninguém ouvindo.

const main = async () => {
    const readerHandler = (data: readonly number[]) => {
        console.log('recebido algo')
    }
    try {
        const port = await PortOpener('com50',9600)
        port.write([0,0,0,0,0,0,0])
        port.onData(readerHandler )
        setTimeout( () => {
            console.log('rodou o timer')
            //port.removeOnDataListener(readerHandler)
            //.resume()
            const serial = port.__unsafeGetConcreteDriver()
            serial.removeAllListeners()
            //port.close()
        }, 3000)
    } catch (err) {
        console.log('Nao deu pra abrir a porta')
        console.log('detalhes: ', err)
    }
   
    
}

main().then( () => console.log('fim'))