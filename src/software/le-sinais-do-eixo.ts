

import { bit_test } from "./bit-wise-utils"
import { FrameCore } from "./cmpp/datalink/cmpp-datalink-protocol"
import { Address, Axis } from "./global-env/global"
import { sendCmpp } from "./send-receive-cmpp-datalink"
import { setParam_ } from './cmpp-memmap-layer'
import { Driver } from "./mapa_de_memoria"
import { Range } from "./core/utils"
import { executeInSequence } from "./core/promise-utils"
import { readMachineSignals } from "./le-sinais-da-maquina"

// le sinais do eixto, fc+(giro), fc-, etc


// .equ	CONFC	=$39	;Nivel dos sinais de fc-/fc+/ref/zindex
// 	;d0=H/F		d1=Nmotor	d2=Fc+		d3=Dmotor
// 	;d4=CKmotor	d5=FC-		d6=REF		d7=Emotor

export type ESinais = {
    //StepperMode: 'Half-Step' | 'Full-step'
    //NivelDoMotor: 'Maximo' | 'Reduzidos'
    Giro: [boolean, boolean] //'Ligado' | 'Desligado'
    //DMotor: boolean
    //MotorClock: boolean
    FinalDeCurso:  'Dentro' | 'Fora'
    //MotorEnabled: boolean
}


export const LeSinaisEixo = (eixo: Axis):Promise<ESinais> => new Promise( (resolve, reject) => {
 
    const axis = eixo
    const {portName, baudRate, channel} = Address['Axis'][axis] 
    const waddr = 107 //0x38
    const data = 0
    const frame = FrameCore('STX','Solicitacao',channel,waddr,data)

    sendCmpp(portName, baudRate)(frame)
        .then( res => {
            const dataHigh = res.dataHigh[0]
            const dataLow = res.dataLow[0]
            //console.log(waddr,dataHigh, dataLow)
            //console.log('Eixo: ', ZAxis, ' port: ',portName, ' BaudRate: ', baudRate)
            //console.log('Sinais:','high: ',dataHigh, ' low: ', dataLow)
            //console.table(dataHigh)

            resolve({
                Giro: [bit_test(dataHigh,2), bit_test(dataLow,2)],
                FinalDeCurso: bit_test(dataLow, 5)===false ? 'Dentro' : 'Fora'
            });

        })
        .catch( err => reject(['Falha ao coletar sinais (gaveta1, gaveta2, janela, bot_emerg) da placa Z',err]))

})


const Test2 = () => {

    LeSinaisEixo('YAxis')
        .then( sinais => {
            console.table(sinais)
        })
        .catch( err => {
            console.log(err)
        })
}

const Test1 = () => {

    let hasChanged: boolean = false
    let last: ESinais['Giro'] | undefined = undefined
    const arr = Range(0,500).map( () => () => LeSinaisEixo('YAxis'))
    const es = executeInSequence(arr, si => {
        if (last===undefined) 
            last = si.Giro
        else {
            if(si.Giro[0]!==last[0] || si.Giro[1]!==last[1]) {
                hasChanged = true
                console.log('***************')
            }
        }       
        console.table(si.Giro)
        if(hasChanged) console.log('Mudou haha')
    })
}

const Test3 = () => {
    console.log('Preparando para monitorar FC-')
    
    const onChange = (from: ESinais['FinalDeCurso'], to: ESinais['FinalDeCurso']):void => {
        console.log(`Sinal de fim de curso chaveado de '${from}' para '${to}'`)
    }

    let fim_curso_current: ESinais['FinalDeCurso'] | undefined = undefined
    const arr = Range(0,10000,1).map( () => {
        return () => LeSinaisEixo('XAxis')
    })

    console.log('Inicio do Monitorando...')
    
    executeInSequence(arr, signal => {
        const fc = signal.FinalDeCurso
        if(fim_curso_current===undefined) {
            fim_curso_current = fc
        } else {
            if(fim_curso_current!==fc) {
                onChange(fim_curso_current, fc);
                fim_curso_current = fc
            }
        }
       
    })

}


Test3();