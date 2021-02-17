import { delay } from "../utils/delay"
import { setParam_ } from "./cmpp-memmap-layer"
import { fetchCMPPStatusL } from "./get-cmpp-status"
import { getPosicaoAtual } from "./get-pos-atual"
import { Address, Axis } from "./global"
import { Driver } from "./mapa_de_memoria"
import { ExecuteInParalel, executeInSequence, WaitUntilTrue } from "./promise-utils"


const { portName:portNameX, baudRate:baudRateX, channel:channelX} = Address[`Axis`]['XAxis']
const X = setParam_(portNameX,baudRateX,channelX)(Driver)

const { portName:portNameY, baudRate:baudRateY, channel:channelY} = Address[`Axis`]['YAxis']
const Y = setParam_(portNameY,baudRateY,channelY)(Driver)

const { portName:portNameZ, baudRate:baudRateZ, channel:channelZ} = Address[`Axis`]['ZAxis']
const Z = setParam_(portNameZ,baudRateZ,channelZ)(Driver)


export const mili2PulseX = (mm: number): number => {
    const pulsePerMm = (3000-1000)/312.5
    return Math.round(mm * pulsePerMm)
}

export const mili2PulseY = (mm: number): number => {
    const _31_4 = mili2PulseX(70)
    const ratio = mm/31.4
    return mili2PulseX(70*ratio)
}

export const mili2PulseZ = (mm: number): number => {
    return mili2PulseX(mm)
}


export const AguardaAtePosicaoAtualSerIgualA = (axis: Axis, posicao: number, janela: number, timeout: number):Promise<void> => new Promise( (resolve, reject) => {

    const { portName, baudRate, channel} = Address[`Axis`][axis]
    //janela is inclusive bound
    const upperBound = posicao+janela // inclusive
    const lowerBound = posicao-janela // inclusive
    const isInsideInInterval = (posAtual: number) => 
        ((posAtual<=upperBound) && (posAtual>=lowerBound) ) 
            ? true
            : false
        
    return WaitUntilTrue(
        () => getPosicaoAtual(portName, baudRate, channel),
        pa => isInsideInInterval(pa),
        600,
        timeout,
    ).then( () => resolve()) // just to ignore the return value

})

export const buscaRef = (axis: Axis, velRef: number): Promise<void> => {

    const { portName, baudRate, channel} = Address[`Axis`][axis]
    const Axis = setParam_(portName,baudRate,channel)(Driver)

    const arr = [
        //() => Z('Posicao final', 100),
        () => Axis('Reducao do nivel de corrente em repouso', false),
        () => Axis('Velocidade de referencia', velRef),
        
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
    return executeInSequence(arr).then( () => {})
    /*setTimeout( () => { 

        setInterval( () => executeInSequence(arr), 1000)
    }, 10000)*/
   
}

export const StartNoEixo = (axis: Axis): Promise<void> => {
    const { portName, baudRate, channel} = Address[`Axis`][axis]
    const Axis = setParam_(portName,baudRate,channel)(Driver)
    return Axis('Start serial', true)
}

export const ReferenciaEixoSeNecessario = (axis: Axis, velref: number): Promise<void> => new Promise( (resolve, reject) => {

    const { portName, baudRate, channel} = Address[`Axis`][axis]

    const timeout = 60000


    const getStatusL = () =>  fetchCMPPStatusL(portName, baudRate, channel)

    getStatusL()
        .then( statusL => {
            const referenciado = statusL.referenciado
            const referenciando = statusL.referenciando // fix: to be done !

            if (referenciado===false && referenciando===false) {
                buscaRef(axis,velref)
                    .then( () => {
                        WaitUntilTrue(
                            getStatusL,
                            (statusL => statusL.referenciado === true),
                            1000,
                            timeout,
                        )
                            .then( () => {
                                resolve()
                            })
                    })
               
                
            } else if (referenciado===false && referenciando===true) { 
                WaitUntilTrue(
                    getStatusL,
                    (statusL => statusL.referenciado === true),
                    1000,
                    timeout,
                ).then( () => {
                        resolve()
                    })
            } else { // fix: check if it is "referenciando".
                resolve()
            }
        })
})


// Inicializacao da maquina garante estas posicoes iniciais configuradas
export const PosicaoInicialX = 630
export const PosicaoInicialY = 630
export const PosicaoInicialZ = 630

export const InicializaMaquina = (): Promise<void> => new Promise( (resolve, reject) => {

    const programaInicialX = [
        () => X('Posicao inicial', PosicaoInicialX),
        () => X('Posicao final', PosicaoInicialX + mili2PulseX(30)), //4500
        () => X('Velocidade de avanco', 1000),
        () => X('Velocidade de retorno', 1000),
        () => X('Aceleracao de avanco', 3000),
        () => X('Aceleracao de retorno', 3000),
        () => X('Numero de mensagem no avanco',0),
        () => X('Numero de mensagem no retorno',0),
        () => X('Start automatico no avanco ligado', false),
        () => X('Start automatico no retorno ligado', true),
    ]


    const programaInicialY = [
        () => Y('Posicao inicial', PosicaoInicialY),
        () => Y('Posicao final', PosicaoInicialY+mili2PulseX(30)),
        () => Y('Velocidade de avanco', 1000),
        () => Y('Velocidade de retorno', 1000),
        () => Y('Aceleracao de avanco', 3000),
        () => Y('Aceleracao de retorno', 3000),
        () => Y('Numero de mensagem no avanco',0),
        () => Y('Numero de mensagem no retorno',0),
        () => Y('Start automatico no avanco ligado', false),
        () => Y('Start automatico no retorno ligado', true),
    ] as const

   

    const programaInicialZ = [
        () => Z('Posicao inicial', PosicaoInicialZ),
        () => Z('Posicao final', PosicaoInicialZ+50),
        () => Z('Velocidade de avanco', 500), //200
        () => Z('Velocidade de retorno', 500), //300
        () => Z('Aceleracao de avanco', 500),
        () => Z('Aceleracao de retorno', 1500),
        () => Z('Reducao do nivel de corrente em repouso', false),
        //() => Z('Start automatico no avanco ligado', true),
        () => Z('Start automatico no retorno ligado', true),
    ] as const

    const referenciaZ = [
        () => Z('Start externo habilitado', false),
        () => Z('Entrada de start entre eixo habilitado', false),
        () => Z('Reducao do nivel de corrente em repouso', false),
        () => Z('Zero Index habilitado p/ protecao', false),
        () => ReferenciaEixoSeNecessario('ZAxis',250),
    ] as const

    const referenciaXY = [
        () => Z('Start externo habilitado', false),
        () => Z('Entrada de start entre eixo habilitado', false),
        () => Z('Reducao do nivel de corrente em repouso', true),
        () => Z('Zero Index habilitado p/ protecao', true),
        () => ReferenciaEixoSeNecessario('XAxis',500),
        () => ReferenciaEixoSeNecessario('YAxis',500),
    ] as const

    const warmUpZ = [
        // warup up Z
        () => StartNoEixo('ZAxis'), 
        () => delay(1000),
        () => AguardaAtePosicaoAtualSerIgualA('ZAxis', PosicaoInicialZ, 2, 30000),
        () => Z('Start automatico no retorno ligado', false),
    ] as const

    const warmUpX = [
        // warup up X
        () => StartNoEixo('XAxis'),
        () => delay(2000),
        () => AguardaAtePosicaoAtualSerIgualA('XAxis', PosicaoInicialX, 2, 40000),
        () => X('Start automatico no retorno ligado', false)
    ] as const 
 
    const warmUpY = [
        // warup up Y
        () => StartNoEixo('YAxis'),
        () => delay(2000),
        () => AguardaAtePosicaoAtualSerIgualA('YAxis', PosicaoInicialY, 2, 40000),
        () => Y('Start automatico no retorno ligado', false)
    ] as const

    
    const carregaProgramaInicialDosEixos = [

        () => ExecuteInParalel([
            () => executeInSequence(programaInicialX),
            () => executeInSequence(programaInicialY),
            () => executeInSequence(programaInicialZ),
        ]),

        () => executeInSequence(referenciaZ),
        () => ExecuteInParalel(referenciaXY),
        () => ExecuteInParalel([
            () => executeInSequence(warmUpX),
            () => executeInSequence(warmUpY),
            () => executeInSequence(warmUpZ),
        ])
    ] as const

    

    executeInSequence(carregaProgramaInicialDosEixos)
    .then( data => resolve())

   
})


export const Referencia_3Eixos = ():Promise<void> => {
    return new Promise( (resolve, reject) => {

        console.log("Referenciando 3 eixos da maquina...")
        InicializaMaquina()
            .then( () => {
                console.log('Referencia X,Y,Z realizada com sucesso.');
                resolve()
            })


    })
}

//Referencia_3Eixos()
