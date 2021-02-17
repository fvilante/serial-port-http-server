import { delay } from "../utils/delay"
import { setParam_ } from "./cmpp-memmap-layer"
import { MovimentKit, Milimeter} from "./driver-de-eixo"
import { Address } from "./global"
import { Driver } from "./mapa_de_memoria"
import { executeInSequence } from "./promise-utils"
import { PosicaoInicialY, 
    mili2PulseX as miliX, 
    mili2PulseY as miliY,
    mili2PulseZ as miliZ,
    AguardaAtePosicaoAtualSerIgualA, 
    Referencia_3Eixos, PosicaoInicialX, PosicaoInicialZ
} from './referencia_eixos'



const { portName:portNameX, baudRate:baudRateX, channel:channelX} = Address[`Axis`]['XAxis']
const X = setParam_(portNameX,baudRateX,channelX)(Driver)

const { portName:portNameY, baudRate:baudRateY, channel:channelY} = Address[`Axis`]['YAxis']
const Y = setParam_(portNameY,baudRateY,channelY)(Driver)

const { portName:portNameZ, baudRate:baudRateZ, channel:channelZ} = Address[`Axis`]['ZAxis']
const Z = setParam_(portNameZ,baudRateZ,channelZ)(Driver)



const YPassoAPasso = (posicoes: readonly number[]):(() => Promise<void>)[] => {

    const VaiParaProximaLinha = (n: number):Promise<void> => {
        
        return new Promise ((resolve, reject) => {
            const arr = [
                () => Y('Posicao final', posicoes[n]),
                () => Y('Start serial', true),
                () => delay(500),
                () => AguardaAtePosicaoAtualSerIgualA('YAxis', posicoes[n], 20, 15000),
            ]
            executeInSequence(arr).then(() => resolve())
        })
    }

    const retorna = ():Promise<void> => {
        return new Promise ((resolve, reject) => {
            const arr = [
                () => Y('Posicao inicial', PosicaoInicialY),
                () => Y('Start serial', true),
                () => delay(500),
                () => AguardaAtePosicaoAtualSerIgualA('YAxis', PosicaoInicialY, 20, 15000),
            ]
            executeInSequence(arr).then(() => resolve())
        })
    }

    let arr: (() => Promise<void>)[]= [
        () => Y('Posicao inicial', PosicaoInicialY),
    ]
    for (let k=0; k<posicoes.length; k++) {
        arr.push( () => VaiParaProximaLinha(k))
    }

    arr.push( () => retorna() )


    //exemplo
    const arrx = [
        () => VaiParaProximaLinha(0),
        () => VaiParaProximaLinha(1),
        () => VaiParaProximaLinha(2),
        () => VaiParaProximaLinha(3),
        () => VaiParaProximaLinha(4),
        () => VaiParaProximaLinha(5),
        () => VaiParaProximaLinha(6),
        () => retorna(),
    ]

    return arr

}


const passo = miliY(70)
const offset = miliY(20)

const posicoesY = [
    PosicaoInicialY+(passo*0)+offset, //1
    PosicaoInicialY+(passo*1)+offset, //2
    PosicaoInicialY+(passo*2)+offset, //3
    PosicaoInicialY+(passo*3)+offset, //4
    PosicaoInicialY+(passo*4)+offset, //5
    PosicaoInicialY+(passo*5)+offset, //6
    PosicaoInicialY+(passo*6)+offset, //7
]


const FazLinha = ():Promise<void> => new Promise ((resolve, reject) => {

    const passo = miliX(70)
    const offset = miliX(20)

    const impressoes = [
        PosicaoInicialX+(passo*0)+offset, //1
        PosicaoInicialX+(passo*1)+offset, //2
        PosicaoInicialX+(passo*2)+offset, //3
        PosicaoInicialX+(passo*3)+offset, //4
        PosicaoInicialX+(passo*4)+offset, //5
        PosicaoInicialX+(passo*5)+offset, //6
        PosicaoInicialX+(passo*6)+offset, //7
    ]

    const velAv = 1700
    const acAv = 5000

    // setup
    const setup = [
        () => X('Velocidade de avanco', velAv),
        () => X('Aceleracao de retorno', acAv),
        () => X('Velocidade de retorno', 2300),
        () => X('Velocidade de retorno', 5000),
    ]

    const rampa = (velAv^2)/(acAv*2)
   
    const fazPar = (x0: number, x1: number): Promise<void> => {
        return new Promise( (resolve, reject) => {

            const pi = x0-rampa
            const pf = x1+rampa

            const arr = [
                () => X('Posicao inicial', pi),
                () => X('Posicao final', pf),
                () => X('Posicao da primeira impressao no avanco',x0),
                () => X('Posicao da ultima mensagem no avanco',x1),
                () => X('Start serial', true),
                () => delay(500),
                () => AguardaAtePosicaoAtualSerIgualA('XAxis', pf, 2, 15000),
            ]
            executeInSequence(arr).then(() => resolve())

        })
    }

    // 1 par
    const arr = [
        ...setup,
        () => fazPar(PosicaoInicialX+miliX(50), PosicaoInicialX+miliX(100))
    ]
    executeInSequence(arr).then(() => resolve())
    
    

})

export type ImpressoesX = readonly [
    readonly [x0: number, x1: number],
    readonly [x2: number, x3: number],
    readonly [x4: number, x5: number],
]

export const fazLinhaXPreta = async (movimentKit: MovimentKit, impressoes: ImpressoesX):Promise<void> => {

    console.log('fazLinhaPreta')
    const {x,y,z,m} = movimentKit


    const rampa = miliX(100)
    const PMA = PosicaoInicialX+miliX(100)
    const UMA = PosicaoInicialX+miliX(170)
    const PI = PosicaoInicialX
    const PF = UMA + rampa
    const NMA = 2
    const velAv = 1700
    const acAv = 3000
    const velRet = 2300
    const acRet = 3000



    const ImprimePar = async (x0: number, x1: number, rampa: number): Promise<void> => {


        await x._setPrintMessages({
            numeroDeMensagensNoAvanco: NMA,
            numeroDeMensagensNoRetorno: 0,
            posicaoDaPrimeiraMensagemNoAvanco: x0,
            posicaoDaUltimaMensagemNoAvanco: x1,
            posicaoDaPrimeiraMensagemNoRetorno: 500,
            posicaoDaUltimaMensagemNoRetorno: 500,
        })
    
        const [minX, maxX] = x._getAbsolutePositionRange()

        const POSFIM = x1+x._convertMilimeterToPulseIfNecessary(Milimeter(rampa))

        await x.goToAbsolutePosition(x1+rampa, (v,a) =>[velAv,acAv] )
        await x.goToAbsolutePosition(minX, (v,a) => [velRet,acRet])
        //await x._clearPrintingMessages() //FIX: should be unnecessary

        return
    }


    await ImprimePar(impressoes[0][0],impressoes[0][1], rampa )
    await ImprimePar(impressoes[1][0],impressoes[1][1], rampa )
    await ImprimePar(impressoes[2][0],impressoes[2][1], rampa )
        
    return
            
}
    



export const fazLinhaXBranca = async (movimentKit: MovimentKit, impressoes: ImpressoesX):Promise<void> => {
    console.log('fazLinhaBranca')
    await fazLinhaXPreta(movimentKit, impressoes)
    await fazLinhaXPreta(movimentKit, impressoes)
        
}
    

export const E44_A5: ImpressoesX = [
    [PosicaoInicialX+miliX(100-9+9), PosicaoInicialX+miliX(200-40+9+3)],
    [PosicaoInicialX+miliX(100-9+(70*2)+9+4), PosicaoInicialX+miliX(200-40+(70*2)+9+6.3)],
    [PosicaoInicialX+miliX(100-9+(70*4)+2+9+5.5), PosicaoInicialX+miliX(200-40+(70*4)+5+9+5) ],
]

const ec = miliX(67-115) //espaçamento_cabeçote

export const E44_B1: ImpressoesX = [
    [PosicaoInicialX+miliX(100-9+6)+ec, PosicaoInicialX+miliX(200-40)+ec],
    [PosicaoInicialX+miliX(100-9+(70*2))+ec, PosicaoInicialX+miliX(200-40+(70*2))+ec],
    [PosicaoInicialX+miliX(100-9+(70*4)+2)+ec, PosicaoInicialX+miliX(200-40+(70*4)+5)+ec],
]

// este sao 5 impressoes por linha
export const V17: ImpressoesX = [
    [PosicaoInicialX+miliX(100-9+6-22+3)+ec, PosicaoInicialX+miliX(200-40+5-6.5+3)+ec],
    [PosicaoInicialX+miliX(100-9+(70*2)+25-3+3)+ec, PosicaoInicialX+miliX(200-40+(70*2)+52.5-4+3)+ec],
    [PosicaoInicialX+miliX(200-40+(70*4)+5+3)+ec, PosicaoInicialX+miliX(200-40+(70*4)+5+3)+ec],
]

export const V107: ImpressoesX = [
    [PosicaoInicialX+miliX(100-9+6+3.5)+ec, PosicaoInicialX+miliX(200-40+3.5)+ec],
    [PosicaoInicialX+miliX(100-9+(70*2)+1.5)+ec, PosicaoInicialX+miliX(200-40+(70*2)+3)+ec],
    [PosicaoInicialX+miliX(100-9+(70*4)+2+3)+ec, PosicaoInicialX+miliX(200-40+(70*4)+5+3)+ec],
]


const delta = -miliX(40)
export const TermoP3: ImpressoesX = [
    [PosicaoInicialX+miliX(100-9)+delta, PosicaoInicialX+miliX(200-40)+delta],
    [PosicaoInicialX+miliX(100-9+(70*2))+delta, PosicaoInicialX+miliX(200-40+(70*2))+delta],
    [PosicaoInicialX+miliX(100-9+(70*4)+2)+delta, PosicaoInicialX+miliX(200-40+(70*4)+5)+delta ],
]

export const Termo2559371: ImpressoesX = [
    [PosicaoInicialX+miliX(100-9+7.5-45+3), PosicaoInicialX+miliX(200-40+52)+delta],
    [PosicaoInicialX+miliX(100-9+(70*2)+101-35), PosicaoInicialX+miliX(200-40+(70*2)+152+4)+delta],
    [0, 0],
]

// M1
export const Termo2559371_M1_Texto_Inferior: ImpressoesX = [
    [PosicaoInicialX+miliX(100-9+7.5-45+3+6-2), PosicaoInicialX+miliX(200-40+52+6-3)+delta],
    [PosicaoInicialX+miliX(100-9+(70*2)+101-35+6+3-7), PosicaoInicialX+miliX(200-40+(70*2)+152+4+6+6-7)+delta],
    [0, 0],
]

export const Termo2559371_M1_Texto_Superior: ImpressoesX = [
    [PosicaoInicialX+miliX(100-9+7.5-45+3+6-2-8), PosicaoInicialX+miliX(200-40+52+6-3-9)+delta],
    [PosicaoInicialX+miliX(100-9+(70*2)+101-35+6+3-7-9), PosicaoInicialX+miliX(200-40+(70*2)+152+4+6+6-7-8)+delta],
    [0, 0],
]

export const T199: ImpressoesX = [
    [PosicaoInicialX+miliX(100-9+6+6)+ec, PosicaoInicialX+miliX(200-40+8)+ec],
    [PosicaoInicialX+miliX(100-9+(70*2)+6)+ec, PosicaoInicialX+miliX(200-40+(70*2)+8)+ec],
    [PosicaoInicialX+miliX(100-9+(70*4)+2+8)+ec, PosicaoInicialX+miliX(200-40+(70*4)+5+6)+ec],
]

export const T125 = T199

export const T110: ImpressoesX = [
    [PosicaoInicialX+miliX(100-9+6+6+5)+ec, PosicaoInicialX+miliX(200-40+8+5)+ec],
    [PosicaoInicialX+miliX(100-9+(70*2)+6+5)+ec, PosicaoInicialX+miliX(200-40+(70*2)+8+5+2)+ec],
    [PosicaoInicialX+miliX(100-9+(70*4)+2+8+5)+ec, PosicaoInicialX+miliX(200-40+(70*4)+5+6+5+2)+ec],
]

export const T123: ImpressoesX = [
    [PosicaoInicialX+miliX(100-9+6+6+5)+ec, PosicaoInicialX+miliX(200-40+8+5)+ec],
    [PosicaoInicialX+miliX(100-9+(70*2)+6+5)+ec, PosicaoInicialX+miliX(200-40+(70*2)+8+5+2)+ec],
    [PosicaoInicialX+miliX(100-9+(70*4)+2+8+5)+ec, PosicaoInicialX+miliX(200-40+(70*4)+5+6+5+2)+ec],
]

export const P3A: ImpressoesX = [
    [PosicaoInicialX+miliX(100-9+6-11.5+2.3)+ec, PosicaoInicialX+miliX(200-40-11)+ec],
    [PosicaoInicialX+miliX(100-9+(70*2)-12.5)+ec, PosicaoInicialX+miliX(200-40+(70*2)-10.5)+ec],
    [PosicaoInicialX+miliX(100-9+(70*4)+2-11.6)+ec, PosicaoInicialX+miliX(200-40+(70*4)+5-13.11)+ec],
]


export const V120: ImpressoesX = [
    [PosicaoInicialX+miliX(100-9+6)+ec, PosicaoInicialX+miliX(200-40)+ec],
    [PosicaoInicialX+miliX(100-9+(70*2)-2)+ec, PosicaoInicialX+miliX(200-40+(70*2))+ec],
    [PosicaoInicialX+miliX(100-9+(70*4)+2)+ec, PosicaoInicialX+miliX(200-40+(70*4)+5)+ec],
]

export const V2: ImpressoesX = [
    [PosicaoInicialX+miliX(100-9+6+6+5+5.7)+ec, PosicaoInicialX+miliX(200-40+8+5+5.7)+ec],
    [PosicaoInicialX+miliX(100-9+(70*2)+6+5+5.7)+ec, PosicaoInicialX+miliX(200-40+(70*2)+8+5+2+5.7)+ec],
    [PosicaoInicialX+miliX(100-9+(70*4)+2+8+5+5.7)+ec, PosicaoInicialX+miliX(200-40+(70*4)+5+6+5+2+5.7)+ec],
]

/*
Referencia_3Eixos().then( () => {
    
    executeInSequence(YPassoAPasso([
        PosicaoInicialY+miliY(300),
        PosicaoInicialY+miliY(400),
    ]).map( linha => {
        linha().then(
            () => fazLinhaX()
        )
    }))
       
   


})

*/


export const E44_A3 = E44_A5 // @4 - preta
export const E44_A1 = E44_A5 // @4 - preta
export const E44_A6 = E44_A5 // @4 - preta
export const E44_A7 = E44_A5 // @4 - preta


// termoretratil



export const E44_B2 = E44_B1 // @3 - branca
export const E44_B5 = E44_B1 // @3 - branca
export const E44_B6 = E44_B1 // @3 - branca
export const T202 = E44_B1 // porem o texto eh @2 - branca

//termoretratil


// job
const intervalo = 10000
const modelo = TermoP3 //T110 //V107 //E44_A5

/*
const arr = [
    () => fazLinhaXBranca(modelo),
    () => delay(intervalo),
    () => fazLinhaXBranca(modelo),
    () => delay(intervalo),
    () => fazLinhaXBranca(modelo),
    () => delay(intervalo),
    () => fazLinhaXBranca(modelo),
    () => delay(intervalo),
    () => fazLinhaXBranca(modelo),
    () => delay(intervalo),
    () => fazLinhaXBranca(modelo),
    () => delay(intervalo),
    () => fazLinhaXBranca(modelo),
    () => delay(intervalo),
    () => fazLinhaXBranca(modelo),
    () => delay(intervalo),

    () => fazLinhaXBranca(modelo),
    () => delay(intervalo),
    () => fazLinhaXBranca(modelo),
    () => delay(intervalo),
    () => fazLinhaXBranca(modelo),
    () => delay(intervalo),
    () => fazLinhaXBranca(modelo),
    () => delay(intervalo),
    () => fazLinhaXBranca(modelo),
    () => delay(intervalo),
    () => fazLinhaXBranca(modelo),
    () => delay(intervalo),
    () => fazLinhaXBranca(modelo),
    () => delay(intervalo),
    () => fazLinhaXBranca(modelo),
    () => delay(intervalo),

    () => fazLinhaXBranca(modelo),
    () => delay(intervalo),
    () => fazLinhaXBranca(modelo),
    () => delay(intervalo),
    () => fazLinhaXBranca(modelo),
    () => delay(intervalo),
    () => fazLinhaXBranca(modelo),
    () => delay(intervalo),
    () => fazLinhaXBranca(modelo),
    () => delay(intervalo),
    () => fazLinhaXBranca(modelo),
    () => delay(intervalo),
    () => fazLinhaXBranca(modelo),
    () => delay(intervalo),
    () => fazLinhaXBranca(modelo),
    () => delay(intervalo),

    () => fazLinhaXBranca(modelo),
    () => delay(intervalo),
    () => fazLinhaXBranca(modelo),
    () => delay(intervalo),
    () => fazLinhaXBranca(modelo),
    () => delay(intervalo),
    () => fazLinhaXBranca(modelo),
    () => delay(intervalo),
    () => fazLinhaXBranca(modelo),
    () => delay(intervalo),
    () => fazLinhaXBranca(modelo),
    () => delay(intervalo),
    () => fazLinhaXBranca(modelo),
    () => delay(intervalo),
    () => fazLinhaXBranca(modelo),
    () => delay(intervalo),

    () => fazLinhaXBranca(modelo),
    () => delay(intervalo),
    () => fazLinhaXBranca(modelo),
    () => delay(intervalo),
    () => fazLinhaXBranca(modelo),
    () => delay(intervalo),
    () => fazLinhaXBranca(modelo),
    () => delay(intervalo),
    () => fazLinhaXBranca(modelo),
    () => delay(intervalo),
    () => fazLinhaXBranca(modelo),
    () => delay(intervalo),
    () => fazLinhaXBranca(modelo),
    () => delay(intervalo),
    () => fazLinhaXBranca(modelo),
    () => delay(intervalo),

    () => fazLinhaXBranca(modelo),
    () => delay(intervalo),
    () => fazLinhaXBranca(modelo),
    () => delay(intervalo),
    () => fazLinhaXBranca(modelo),
    () => delay(intervalo),
    () => fazLinhaXBranca(modelo),
    () => delay(intervalo),
    () => fazLinhaXBranca(modelo),
    () => delay(intervalo),
    () => fazLinhaXBranca(modelo),
    () => delay(intervalo),
    () => fazLinhaXBranca(modelo),
    () => delay(intervalo),
    () => fazLinhaXBranca(modelo),
    () => delay(intervalo),

    () => fazLinhaXBranca(modelo),
    () => delay(intervalo),
    () => fazLinhaXBranca(modelo),
    () => delay(intervalo),
    () => fazLinhaXBranca(modelo),
    () => delay(intervalo),
    () => fazLinhaXBranca(modelo),
    () => delay(intervalo),
    () => fazLinhaXBranca(modelo),
    () => delay(intervalo),
    () => fazLinhaXBranca(modelo),
    () => delay(intervalo),
    () => fazLinhaXBranca(modelo),
    () => delay(intervalo),
    () => fazLinhaXBranca(modelo),
    () => delay(intervalo),


    () => fazLinhaXBranca(modelo),
    () => delay(intervalo),
    () => fazLinhaXBranca(modelo),
    () => delay(intervalo),

/*
    () => fazLinhaX(modelo),
    () => delay(intervalo),
    () => fazLinhaX(modelo),
    () => delay(intervalo),
    () => fazLinhaX(modelo),
    () => delay(intervalo),
    () => fazLinhaX(modelo),
    () => delay(intervalo),
    () => fazLinhaX(modelo),
    () => delay(intervalo),
    () => fazLinhaX(modelo),
    () => delay(intervalo),
    () => fazLinhaX(modelo),
    () => delay(intervalo),
    () => fazLinhaX(modelo),
    () => delay(intervalo),

    () => fazLinhaX(modelo),
    () => delay(intervalo),
    () => fazLinhaX(modelo),
    () => delay(intervalo),
    () => fazLinhaX(modelo),
    () => delay(intervalo),
    () => fazLinhaX(modelo),
    () => delay(intervalo),
    () => fazLinhaX(modelo),
    () => delay(intervalo),
    () => fazLinhaX(modelo),
    () => delay(intervalo),
    () => fazLinhaX(modelo),
    () => delay(intervalo),
    () => fazLinhaX(modelo),
    () => delay(intervalo),

    () => fazLinhaX(modelo),
    () => delay(intervalo),
    () => fazLinhaX(modelo),
    () => delay(intervalo),
    () => fazLinhaX(modelo),
    () => delay(intervalo),
    () => fazLinhaX(modelo),
    () => delay(intervalo),
    () => fazLinhaX(modelo),
    () => delay(intervalo),
    () => fazLinhaX(modelo),
    () => delay(intervalo),
    () => fazLinhaX(modelo),
    () => delay(intervalo),
    () => fazLinhaX(modelo),
    () => delay(intervalo),
   */
   
    

//]

const C = 100

/*const arr = YPassoAPasso([
    PosicaoInicialY+100*1,
    PosicaoInicialY+100*2,
    PosicaoInicialY+100*3,
])
    */    


//executeInSequence(arr )



