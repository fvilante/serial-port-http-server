import { executeInSequence, setParam_ } from './cmpp-memmap-layer'
import { fetchCMPPStatusL, StatusLCasted} from './get-cmpp-status'
import { getPosicaoAtual } from './get-pos-atual'
import { Address, Axis } from './global'
import { Driver } from './mapa_de_memoria'

// RECEBE PARAMETROS DE ENTRADA DO CICLO DO USUARIO

// REFERENCIA:

// verifica se eixo Z esta referenciado,
// se nao inicia referencia
// e envia programa basico padrao

// verifica se eixo X esta referenciado,
// se nao inicia referencia
// e envia programa basico padrao
// NOTA: O eixo X nao deve referenciar enquanto o eixo Z nao estiver totalmente referenciado (isto evita colisoes)

// Programa padrao contem:

// PROGRAMA PADRAO
//  Placa X
//  - Primeiro desce eixo Z ate posicao de impressao
//  - Depois dá start no eixo X para iniciar impressao
//  - Ao termino da impressao levanta cabeçote
//  - start automatico no retorno ligado
//  - veloc e accelerac de retorno rapida (vou imprimir apenas no avanco)
//  Placa Z
//  - vel e accel compativel com a inercia (rapido pra subir, devagar pra descer)
//  - Sem start automatico
//  - Desce até a posicao de impressao
//  - Sobe quando terminar a impressao

// PARAMETROS DE ENTRADA DO CICLO DO USUARIO
// Le parametros de entrada do programa:
//  - pos inicial, - pos final
//  - primeira msg no av, ultima msg no av.
//  - numero de msg no av
//  Talvez:
//  - velocidade av, aceleracao av,
//  Também:
//  - Cor da tinta
//  - Selecao da msg
//  - texto a imprimir


// EXECUCAO DE CICLO
//  Envia parametro de entrada para as placas
//  Envia start para eixo X e eixo Z

const WaitUntilDone = <A>(effect: () => Promise<A>, condition: (_:A) => boolean, poolingInterval: number /*milisecs*/, timeout: number ):Promise<A> => 
    new Promise( (resolve, reject) => { 

        let timerout: NodeJS.Timeout | undefined = undefined
        let pooling: NodeJS.Timeout | undefined = undefined
        timerout = setTimeout( () => { 
            if (pooling!==undefined) clearTimeout(pooling)
            reject(`Timeout in function 'WaitUntilDone' after '${timeout} milisecs'. Condition was not satisfied before timeout.`)
        }, timeout)

        const pool = () => {
            effect()
                .then( a => {
                    if(condition(a)===true) {
                        if (timerout!==undefined) clearTimeout(timerout)
                        resolve(a);
                    } else {
                        pooling = setTimeout(pool, poolingInterval)
                    }
                })
        }
        pool();      
})


export const buscaRef = (axis: Axis): Promise<void> => {

    const { portName, baudRate, channel} = Address[`Axis`][axis]
    const Axis = setParam_(portName,baudRate,channel)(Driver)

    const arr = [
        //() => Z('Posicao final', 100),
        () => Axis('Reducao do nivel de corrente em repouso', false),
        () => Axis('Velocidade de referencia', 150),
        
        //() => Z('Aceleracao de referencia',5000),
        
        
        // Eixo Z por ser vertical precisa ter uma forca adicional, caso contrario a inercia pode fazer ele perder a referencia e desligar o motor (devido a perda da janela) isto fará o cabeçote despencar.
        //() => Z('Reducao do nivel de corrente em repouso', false),
        // perde a referencia
        () => Axis('Pausa serial', false),
        () => delay(1500),
        //() => Z('Modo manual serial', false), // bit de desliga o motor
        

        // busca a referencia
        //() => setParam('Pausa serial', true),
        //() => setParam('Modo manual serial', false), // bit de desliga o motor
        () => Axis('Start serial', true),
    ]
    return executeInSequence(arr)
    /*setTimeout( () => { 

        setInterval( () => executeInSequence(arr), 1000)
    }, 10000)*/
   
}

const ReferenciaEixoSeNecessario = (axis: Axis): Promise<void> => new Promise( (resolve, reject) => {

    const { portName, baudRate, channel} = Address[`Axis`][axis]

    const timeout = 60000


    const getStatusL = () =>  fetchCMPPStatusL(portName, baudRate, channel)

    getStatusL()
        .then( statusL => {
            const referenciado = statusL.referenciado
            const referenciando = statusL.referenciando // fix: to be done !

            if (referenciado===false) {
                buscaRef(axis)
                    .then( () => {
                        WaitUntilDone(
                            getStatusL,
                            (statusL => statusL.referenciado === true),
                            1000,
                            timeout,
                        )
                            .then( () => {
                                resolve()
                            })
                    })
               
                
            } else { // fix: check if it is "referenciando".
                resolve()
            }
        })
})

const ReferenciaXeYSeNecessario = ():Promise<void> => new Promise( (resolve, reject) => {
    ReferenciaEixoSeNecessario('ZAxis')
    .then( () => {
        console.log('Z esta referenciado')
        ReferenciaEixoSeNecessario('XAxis')
        .then( () => {
            console.log('X e Y estao referenciado')
            console.log('fim da referencia')
            resolve();
        })
    })
})

export const StartNoEixo = (axis: Axis): Promise<void> => {
    const { portName, baudRate, channel} = Address[`Axis`][axis]
    const Axis = setParam_(portName,baudRate,channel)(Driver)
    return Axis('Start serial', true)
}


const AguardaAtePosicaoAtualSerIgualA = (axis: Axis, posicao: number, janela: number, timeout: number):Promise<void> => new Promise( (resolve, reject) => {

    const { portName, baudRate, channel} = Address[`Axis`][axis]
    //janela is inclusive bound
    const upperBound = posicao+janela // inclusive
    const lowerBound = posicao-janela // inclusive
    const isInsideInInterval = (posAtual: number) => 
        ((posAtual<=upperBound) && (posAtual>=lowerBound) ) 
            ? true
            : false
        
    return WaitUntilDone(
        () => getPosicaoAtual(portName, baudRate, channel),
        pa => isInsideInInterval(pa),
        1000,
        timeout,
    ).then( () => resolve()) // just to ignore the return value

})


const preparaZ = ():Promise<void> => new Promise( (resolve, reject) => {

    const { portName, baudRate, channel} = Address[`Axis`]['ZAxis']
    const Z = setParam_(portName,baudRate,channel)(Driver)

    const PosicaoInicial = 750

    const arr = [
        () => Z('Posicao inicial', PosicaoInicial),
        () => Z('Posicao final', 1000),
        () => Z('Velocidade de avanco', 200),
        () => Z('Velocidade de retorno', 300),
        () => Z('Aceleracao de avanco', 500),
        () => Z('Aceleracao de retorno', 1500),
        () => Z('Reducao do nivel de corrente em repouso', false),
        //() => Z('Start automatico no avanco ligado', true),
        () => Z('Start automatico no retorno ligado', true),
        () => StartNoEixo('ZAxis'), 
        () => delay(1000),
        () => AguardaAtePosicaoAtualSerIgualA('ZAxis', PosicaoInicial, 2, 30000),
        () => Z('Start automatico no retorno ligado', false)
    ]
    return executeInSequence(arr)
        .then( () => {
            console.log("Eixo Z esta pronto");
            resolve();
        })
      
})

const delay = (ms: number): Promise<void> => {
    return new Promise( (resolve, reject) => {
        setTimeout( () => resolve(), ms)
    })
}

const preparaX = ():Promise<void> => new Promise( (resolve, reject) => {

    const { portName, baudRate, channel} = Address[`Axis`]['XAxis']
    const X = setParam_(portName,baudRate,channel)(Driver)

    const PosicaoInicial = 650

    const arr = [
        () => X('Posicao inicial', PosicaoInicial),
        () => X('Posicao final', 4500),
        () => X('Velocidade de avanco', 1000),
        () => X('Velocidade de retorno', 3000),
        () => X('Aceleracao de avanco', 6000),
        () => X('Aceleracao de retorno', 5000),
        () => X('Numero de mensagem no avanco',0),
        () => X('Numero de mensagem no retorno',0),
        () => X('Start automatico no avanco ligado', false),
        () => X('Start automatico no retorno ligado', true),
        () => StartNoEixo('XAxis'),
        () => delay(2000),
        () => AguardaAtePosicaoAtualSerIgualA('XAxis', PosicaoInicial, 2, 40000),
        //() => X('Start automatico no retorno ligado', false)
    ]
    return executeInSequence(arr)
        .then( () => {
            console.log("Eixo X esta pronto");
            resolve();
        })
      
})

export const InicializaMaquina = (): Promise<void> => new Promise( (resolve, reject) => {

    ReferenciaXeYSeNecessario()
    .then( () => {
        console.log('preparando Z')
        preparaZ()
        .then( () => {
            console.log('preparando X')
            preparaX()
            .then( () => {
                console.log('X e Z preparados')
                resolve();
            })
        })
    })

})

type ProgramaImpressao = {
    PFY: number
    PPIA: number
    PUMA: number
    NMA: number
}

const EnviaProgramaDeImpressaoBranca = (p: ProgramaImpressao):Promise<void> => new Promise( (resolve, reject) => {

    console.log('iniciando ciclo de impressao')

    const { PFY, PPIA, PUMA, NMA } = p

    const { portName: portNameX, baudRate: baudRateX, channel: channelX} = Address[`Axis`]['XAxis']
    const X = setParam_(portNameX,baudRateX,channelX)(Driver)

    const { portName, baudRate, channel} = Address[`Axis`]['ZAxis']
    const Z = setParam_(portName,baudRate,channel)(Driver)

    const PosicaoInicial = 650

    const arr = [
        () => Z('Posicao final', PFY),

        () => StartNoEixo('ZAxis'),
        () => delay(2000),
        () => AguardaAtePosicaoAtualSerIgualA('ZAxis', PFY, 5, 30000),
        () => X('Posicao da primeira impressao no avanco', PPIA),
        () => X('Posicao da ultima mensagem no avanco', PUMA),
        () => X('Numero de mensagem no avanco',NMA),
        () => X('Velocidade de avanco', 2000),
        () => X('Velocidade de retorno', 5000),
        () => X('Aceleracao de retorno', 5000),

        () => StartNoEixo('XAxis'),
        () => delay(2000),
        () => AguardaAtePosicaoAtualSerIgualA('XAxis', PosicaoInicial, 2, 40000),
        () => StartNoEixo('XAxis'),
        () => delay(2000),
        () => AguardaAtePosicaoAtualSerIgualA('XAxis', PosicaoInicial, 2, 40000),
        () => StartNoEixo('ZAxis'),
        //() => X('Start automatico no retorno ligado', false)
    ]
    return executeInSequence(arr)
        .then( () => {
            console.log("Ciclo de impressao concluido");
            resolve();
        })
      
})

const test1 = () => {    
    InicializaMaquina()
    .then(() => {
        EnviaProgramaDeImpressaoBranca({
            PFY: 1300,
            NMA: 5,
            PPIA: 1000,
            PUMA: 3000,
        }).then( () => {
            console.log('Fim da primeira impressao')
        })
    })
}

const mili2Pulse = (mm: number): number => {
    const pulsePerMm = (3000-1000)/312.5
    return Math.floor(mm * pulsePerMm)
}

//falta selecionar a mensagem @3 e texto "P3", o resto tá ok
const ImprimeTermoretratilP3Branca = () => new Promise<void>( (resolve, reject) => {    


    EnviaProgramaDeImpressaoBranca({
        PFY: 1300- mili2Pulse(20),
        NMA: 6,
        PPIA: 1000-mili2Pulse(5),
        PUMA: 3000+ mili2Pulse(40)-mili2Pulse(2)-mili2Pulse(4),
    }).then( () => {
        console.log('Fim da primeira impressao')
        resolve();
    })

})

//falta selecionar a mensagem @3 e texto "2559371 M1", o resto tá ok
//este eh um termo retratil de 2 linhas
// este é a linha 1
const ImprimeTermoretratil_2559371_M1_linha1 = () => new Promise<void>( (resolve, reject) => {    

    EnviaProgramaDeImpressaoBranca({
        PFY: 1300- mili2Pulse(20),
        NMA: 4,
        PPIA: 1000-mili2Pulse(5+20-26+14),
        PUMA: 2000 + mili2Pulse(170+26), 
    }).then( () => {
        console.log('Fim da primeira impressao')
        resolve();
    })

})

// este é a linha 2
// o delta da linha 1 pra linha 2 é 11.70 mm
// texto 'M1' @3, e o alinhamento é o abaixo. 
const ImprimeTermoretratil_2559371_M1_linha2 = () => new Promise<void>( (resolve, reject) => {    

    EnviaProgramaDeImpressaoBranca({
        PFY: 1300- mili2Pulse(20),
        NMA: 2,
        PPIA: 1000-mili2Pulse(5)+mili2Pulse(8),
        PUMA: 3000+mili2Pulse(40+8+7+2)-mili2Pulse(2)-mili2Pulse(4),
    }).then( () => {
        console.log('Fim da primeira impressao')
        resolve();
    })

})


// conector: texto: "E44.B2", @3, tinta branca
const ImprimeConector_E44B2_Tinta_Branca = () => new Promise<void>( (resolve, reject) => {    

    EnviaProgramaDeImpressaoBranca({
        PFY: 1300- 300,
        NMA: 6,
        PPIA: 1000-mili2Pulse(14)+mili2Pulse(3),
        PUMA: 3000+mili2Pulse(25)-mili2Pulse(2),
    }).then( () => {
        console.log('Fim da primeira impressao')
        resolve();
    })

})

const interval = 32000-8000

const arr = [
    () => ImprimeConector_E44B2_Tinta_Branca(),
    //() => delay(interval),
]

//InicializaMaquina();

executeInSequence(arr)




