import { bit_test } from "./core/bit-wise-utils"
import { FrameCore } from "./cmpp/datalink/core/frame-core"
import { Address } from "./global-env/global"
import { sendCmpp } from "./cmpp/datalink/send-receive-cmpp-datalink"

// le sinais de gaveta e janela manutencao e botao de emergencia
// Referente ao dadoH do endereco absoluto $0038 da placa do eixo Z.
// waddr=$0038/2 -> ByteH -> X:
// X = 
// gaveta_1 = bit 2 (ok, conseguir ler)
// gaveta_2 = bit 0 (ok, conseguir ler)
// janela_manutencao = bit 1 (ok, conseguir ler)
// botao_de_emergencia = bit 7 (nok - 'este sinal por alguma razão nao consegui ler na pratica (pode ser problema no cabo))

const CLOSED = 'Closed'
const OPEN = 'Open'
const ACTIVATED = 'Activated'
const UNACTIVATED = 'Unactivated'

export type MachineSignals = {
    drawer_1: typeof CLOSED | typeof OPEN
    drawer_2:  typeof CLOSED | typeof OPEN
    emergency_buton:  typeof ACTIVATED | typeof UNACTIVATED
    maintanance_window:  typeof CLOSED | typeof OPEN
}

export const readMachineSignals = ():Promise<MachineSignals> => new Promise( (resolve, reject) => {
 
    const ZAxis = 'ZAxis'
    const {portName, baudRate, channel} = Address['Axis'][ZAxis] 
    const waddr = 0x38/2
    const data = 0
    const frame = FrameCore('STX','Solicitacao',channel,waddr,data)
    sendCmpp(portName, baudRate)(frame)
        .then( res => {
            const dataHigh = res.dataHigh[0]
            const dataLow = res.dataLow[0]
            //console.log('Eixo: ', ZAxis, ' port: ',portName, ' BaudRate: ', baudRate)
            //console.log('Sinais:','high: ',dataHigh, ' low: ', dataLow)
            //console.table(dataHigh)
            const bitGaveta1 = 2
            const bitGaveta2 = 0
            const bitJanelaManut = 1
            const bitBotaoEmerg = 7

            const gaveta_1_bit = bit_test(dataHigh, bitGaveta1)
            const gaveta_2_bit = bit_test(dataHigh, bitGaveta2)
            const janela_manutencao_bit = bit_test(dataHigh, bitJanelaManut)
            const botao_de_emergencia_bit = bit_test(dataHigh, bitBotaoEmerg)

            const gaveta_1: MachineSignals['drawer_1'] = gaveta_1_bit===false ? CLOSED : OPEN
            const gaveta_2: MachineSignals['drawer_2'] = gaveta_2_bit===false ?  CLOSED : OPEN
            const janela_manutencao: MachineSignals['maintanance_window'] = janela_manutencao_bit===false ?  CLOSED : OPEN
            const botao_emergencia: MachineSignals['emergency_buton'] = botao_de_emergencia_bit===false ? UNACTIVATED : ACTIVATED

            const sinais: MachineSignals = {
                drawer_1: gaveta_1,
                drawer_2: gaveta_2,
                maintanance_window: janela_manutencao,
                emergency_buton: botao_emergencia,
            }

            resolve(sinais);

        })
        .catch( err => reject(['Falha ao coletar sinais (gaveta1, gaveta2, janela, bot_emerg) da placa Z',err]))


})




const Test2 = () => {

    readMachineSignals()
        .then( sinais => {
            console.table(sinais)
        })
        .catch( err => {
            console.log(err)
        })
}

//Test2();