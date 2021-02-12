import { delay } from "../utils/delay"
import { executeInSequence, setParam_ } from "./cmpp-memmap-layer"
import { Address } from "./global"
import { Driver } from "./mapa_de_memoria"
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

type Impressoes = [
    [x0: number, x1: number],
    [x2: number, x3: number],
    [x4: number, x5: number],
]

const fazLinhaX = (impressoes: Impressoes):Promise<void> => {
/*
    const movimento = {
        rampa: miliX(70),
        PMA: PosicaoInicialX+miliX(100),
        UMA: PosicaoInicialX+miliX(170),
        PI: PosicaoInicialX,
        PF: movimento['UMA'] + rampa,
        NMA: 2,
        velAv: 1700,
        acAv: 3000,
        velRet: 2300,
        acRet: 3000,
    }*/

    const rampa = miliX(70)
    const PMA = PosicaoInicialX+miliX(100)
    const UMA = PosicaoInicialX+miliX(170)
    const PI = PosicaoInicialX
    const PF = UMA + rampa
    const NMA = 2
    const velAv = 1700
    const acAv = 3000
    const velRet = 2300
    const acRet = 3000

    return new Promise( (resolve, reject) => {
    
        const setup = [
            //() => X('Posicao inicial', PI),
            () => X('Velocidade de avanco', velAv),
            () => X('Velocidade de retorno', velRet),
            () => X('Aceleracao de retorno', acRet),
            () => X('Aceleracao de avanco', acAv),
        ]

        const rampa = miliX(100)
        
        const ImprimePar = (x0: number, x1: number): Promise<void> => {
            return new Promise( (resolve, reject) => {
                const programaImpressao = [
                    () => X('Posicao final', x1+rampa),
                    () => X('Posicao da primeira impressao no avanco', x0),
                    () => X('Posicao da ultima mensagem no avanco', x1),
                    () => X('Numero de mensagem no avanco', NMA),
                ]

                const start_X_duas_Passadas_Branca = [
                    () => X('Start automatico no retorno ligado', true),
                    () => X('Start serial', true),
                    () => delay(1000),
                    () => AguardaAtePosicaoAtualSerIgualA('XAxis', PI, 5, 40000),
                    () => X('Start serial', true),
                    () => delay(1000),
                    () => AguardaAtePosicaoAtualSerIgualA('XAxis', PI, 5, 40000),
                ]

                const start_X_uma_passada_preta = [
                    () => X('Start automatico no retorno ligado', true),
                    () => X('Start serial', true),
                    () => delay(1000),
                    () => AguardaAtePosicaoAtualSerIgualA('XAxis', PI, 5, 40000),
                ]


                executeInSequence([
                    ...programaImpressao,
                    ...start_X_duas_Passadas_Branca,
                ]).then(() => resolve())
            
            })
        }
        
    
   
    
        const arr = [ 
            ...setup, 
            () => ImprimePar(impressoes[0][0],impressoes[0][1] ),
            () => ImprimePar(impressoes[1][0],impressoes[1][1] ),
            () => ImprimePar(impressoes[2][0],impressoes[2][1] ),
        ]
        
        
        return executeInSequence(arr)
            .then( () => resolve())


    })
    
}

const E44_A5: Impressoes = [
    [PosicaoInicialX+miliX(100-9), PosicaoInicialX+miliX(200-40)],
    [PosicaoInicialX+miliX(100-9+(70*2)), PosicaoInicialX+miliX(200-40+(70*2))],
    [PosicaoInicialX+miliX(100-9+(70*4)+2), PosicaoInicialX+miliX(200-40+(70*4)+5) ],
]

const ec = miliX(67-115) //espaçamento_cabeçote

const E44_B1: Impressoes = [
    [PosicaoInicialX+miliX(100-9+6)+ec, PosicaoInicialX+miliX(200-40)+ec],
    [PosicaoInicialX+miliX(100-9+(70*2))+ec, PosicaoInicialX+miliX(200-40+(70*2))+ec],
    [PosicaoInicialX+miliX(100-9+(70*4)+2)+ec, PosicaoInicialX+miliX(200-40+(70*4)+5)+ec],
]

// este sao 5 impressoes por linha
const V17: Impressoes = [
    [PosicaoInicialX+miliX(100-9+6-22+3)+ec, PosicaoInicialX+miliX(200-40+5-6.5+3)+ec],
    [PosicaoInicialX+miliX(100-9+(70*2)+25-3+3)+ec, PosicaoInicialX+miliX(200-40+(70*2)+52.5-4+3)+ec],
    [PosicaoInicialX+miliX(200-40+(70*4)+5+3)+ec, PosicaoInicialX+miliX(200-40+(70*4)+5+3)+ec],
]

const V107: Impressoes = [
    [PosicaoInicialX+miliX(100-9+6+3.5)+ec, PosicaoInicialX+miliX(200-40+3.5)+ec],
    [PosicaoInicialX+miliX(100-9+(70*2)+1.5)+ec, PosicaoInicialX+miliX(200-40+(70*2)+3)+ec],
    [PosicaoInicialX+miliX(100-9+(70*4)+2+3)+ec, PosicaoInicialX+miliX(200-40+(70*4)+5+3)+ec],
]


const delta = -miliX(40)
const TermoP3: Impressoes = [
    [PosicaoInicialX+miliX(100-9)+delta, PosicaoInicialX+miliX(200-40)+delta],
    [PosicaoInicialX+miliX(100-9+(70*2))+delta, PosicaoInicialX+miliX(200-40+(70*2))+delta],
    [PosicaoInicialX+miliX(100-9+(70*4)+2)+delta, PosicaoInicialX+miliX(200-40+(70*4)+5)+delta ],
]

const Termo2559371: Impressoes = [
    [PosicaoInicialX+miliX(100-9+7.5-45+3), PosicaoInicialX+miliX(200-40+52)+delta],
    [PosicaoInicialX+miliX(100-9+(70*2)+101-35), PosicaoInicialX+miliX(200-40+(70*2)+152+4)+delta],
    [0, 0],
]

// M1
const Termo2559371_M1_Texto_Inferior: Impressoes = [
    [PosicaoInicialX+miliX(100-9+7.5-45+3+6-2), PosicaoInicialX+miliX(200-40+52+6-3)+delta],
    [PosicaoInicialX+miliX(100-9+(70*2)+101-35+6+3-7), PosicaoInicialX+miliX(200-40+(70*2)+152+4+6+6-7)+delta],
    [0, 0],
]

const Termo2559371_M1_Texto_Superior: Impressoes = [
    [PosicaoInicialX+miliX(100-9+7.5-45+3+6-2-8), PosicaoInicialX+miliX(200-40+52+6-3-9)+delta],
    [PosicaoInicialX+miliX(100-9+(70*2)+101-35+6+3-7-9), PosicaoInicialX+miliX(200-40+(70*2)+152+4+6+6-7-8)+delta],
    [0, 0],
]

const T199: Impressoes = [
    [PosicaoInicialX+miliX(100-9+6+6)+ec, PosicaoInicialX+miliX(200-40+8)+ec],
    [PosicaoInicialX+miliX(100-9+(70*2)+6)+ec, PosicaoInicialX+miliX(200-40+(70*2)+8)+ec],
    [PosicaoInicialX+miliX(100-9+(70*4)+2+8)+ec, PosicaoInicialX+miliX(200-40+(70*4)+5+6)+ec],
]

const T125 = T199

const T110: Impressoes = [
    [PosicaoInicialX+miliX(100-9+6+6+5)+ec, PosicaoInicialX+miliX(200-40+8+5)+ec],
    [PosicaoInicialX+miliX(100-9+(70*2)+6+5)+ec, PosicaoInicialX+miliX(200-40+(70*2)+8+5+2)+ec],
    [PosicaoInicialX+miliX(100-9+(70*4)+2+8+5)+ec, PosicaoInicialX+miliX(200-40+(70*4)+5+6+5+2)+ec],
]

const T123: Impressoes = [
    [PosicaoInicialX+miliX(100-9+6+6+5)+ec, PosicaoInicialX+miliX(200-40+8+5)+ec],
    [PosicaoInicialX+miliX(100-9+(70*2)+6+5)+ec, PosicaoInicialX+miliX(200-40+(70*2)+8+5+2)+ec],
    [PosicaoInicialX+miliX(100-9+(70*4)+2+8+5)+ec, PosicaoInicialX+miliX(200-40+(70*4)+5+6+5+2)+ec],
]

const P3A: Impressoes = [
    [PosicaoInicialX+miliX(100-9+6-11.5+2.3)+ec, PosicaoInicialX+miliX(200-40-11)+ec],
    [PosicaoInicialX+miliX(100-9+(70*2)-12.5)+ec, PosicaoInicialX+miliX(200-40+(70*2)-10.5)+ec],
    [PosicaoInicialX+miliX(100-9+(70*4)+2-11.6)+ec, PosicaoInicialX+miliX(200-40+(70*4)+5-13.11)+ec],
]


const V120: Impressoes = [
    [PosicaoInicialX+miliX(100-9+6)+ec, PosicaoInicialX+miliX(200-40)+ec],
    [PosicaoInicialX+miliX(100-9+(70*2)-2)+ec, PosicaoInicialX+miliX(200-40+(70*2))+ec],
    [PosicaoInicialX+miliX(100-9+(70*4)+2)+ec, PosicaoInicialX+miliX(200-40+(70*4)+5)+ec],
]

const V2: Impressoes = [
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


const E44_A3 = E44_A5 // @4 - preta
const E44_A1 = E44_A5 // @4 - preta
const E44_A6 = E44_A5 // @4 - preta
const E44_A7 = E44_A5 // @4 - preta


// termoretratil



const E44_B2 = E44_B1 // @3 - branca
const E44_B5 = E44_B1 // @3 - branca
const T202 = E44_B1 // porem o texto eh @2 - branca

//termoretratil


// job
const intervalo = 10000
const modelo = V17 //V107 //E44_A5

const arr = [
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
   
    

]

executeInSequence(arr)

