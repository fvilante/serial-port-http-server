import { PortOpener } from ".."
import { delay } from "../../core/delay"

// tipos de erro da serial (teste pratico dos efeitos):
//  "Access denied" -- "Error: Opening com50: Access denied." (quando a porta ja esta em uso por outro aplicativo)
// "File not found" -- "Error: Opening com90: File not found" (quando o numero da porta serial nao existe)
// "Port is not open" -- "Error: Port is not open." (se voce tentar fechar uma porta aberta duas vezes ao invees de apenas uma)
// enquanto a porta nao for fechada port.close(), o programa nao termina. (ja tentei o port.removeAllListeners mas o program continua halt)
//      quando voce configura um port.on('data', handler), dai o recurso fica pendurado, e o programa nao encerra enquanto nao houver o port.close()
//      na pesquisa nao consegui uma forma de "fechar a porta" quando nao tiver mais ninguém ouvindo.

// A FORMA CORRETA DE OPERAR A PORTA
/*
    Eu nao consegui desalocar o listener do 'onData' event a não ser chamando o metodo close() da porta concreta
    Porem eu acredito que abrir e fechar a porta, com segurança deva envolver adicionar algumas dezenas ou centenas 
    de milisegundos de clearance.

    Para evitar estes delays o ideal é minimizar a frequencia de abertura e fechamento da porta, o que significa
    que deve se fazer uma funcao wrapper que gerenciar a abertura de fechamento da porta.

    por outro lado se a porta nao estiver fechada, o processo shell nao termina, o que significa que
    este wrapper deve garantir o fechamento de uma porta que esteja aberta em um tempo adequado.

    seguindo estes principios, é possivel fazer uma manipulacao profissional da porta.

*/ 

/*
    
    GRAVAR DEPOIS DE FECHAR A PORTA (.write after .close)

    Depois de fechada a porta, se voce tentar gravar, a gracao nao produz efeito e nem joga erro, e nem
    chama o callback de erro do serial concreto (ie: concretePort.write(data, err => {....})), ou seja
    fica um "erro" silencioso.

    Porem acontece algo estranho, pois a sequencia natural do programa nao continua, se este "erro" acontecer
    dentro de uma promise, a sequencia da promisse nao é continuada.


    DICA

    Nao esqueca de dar await apos o write ou close ou open
*/



const main = async () => {
    const readerHandler = (data: readonly number[]) => {
        console.log('recebido algo', data)
    }
    try {
        const source = await PortOpener('com4',9600)
        const target = await PortOpener('com5',9600)
        
        target.onData(readerHandler )
        //source.onError( e => {
        //    console.log(`error on source, details: ${e}`)
        //})
        await source.write([1,2,3,4,5,6,7])


        await delay(1000)

        await source.write([7,7,7])
        
        await delay(1000)
        //target.__unsafeGetConcreteDriver().removeAllListeners()
        
        await source.write([6,6,6,6,6,6])
        await source.close()
        await target.close()
        
        await delay(1000)
    

        



    } catch (err) {
        console.log('Nao deu pra abrir a porta')
        console.log('detalhes: ', err)
    }
   
    
}

main().then( () => console.log('fim'))