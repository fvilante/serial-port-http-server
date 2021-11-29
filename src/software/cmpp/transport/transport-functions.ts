import { Invalid, Valid, Validated } from "../../adts/maybe/validated"
import { Byte } from "../../core/byte"

//Represents the position of a bit inside the a 16 bits word
//TODO: Extract this type to a more convenient file (ie: core-types.ts ?!)
type StartBit = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 

//TODO: extract this type to a more general file
type BitValue = number // range from 0 to 1 // TODO: Improve this type in further if necessary

//TODO: extract this type to a more general file
type Word16Bits = number// range from 0 to 255 // TODO: Improve this type in further if necessary


type Serialization<A,B> = {
    serialize: (_:A) => B
    deserialize: (_:B) => A
}

type ParamCore<T extends string> = {
    name: T
    waddr: Byte   // word address 
}

type Param_16bits<T extends string> = {
    type: '16 Bits'
} & ParamCore<T>


type Param_8bits<T extends string> = {
    type: '8 Bits'
    startBit: StartBit //takes 8 bits stating in 'startsBit' (included)
} & ParamCore<T>


type Param_1bit<T extends string> = { 
    type: '1 Bit'
    startBit: StartBit //takes 1 bits stating in 'startsBit' (included)
} & ParamCore<T>

type Param<T extends string> = 
    | Param_16bits<T>
    | Param_8bits<T>
    | Param_1bit<T>


// ctors

const param_16bits = <T extends string>(etc: Omit<Param_16bits<T>,'type'>):Param_16bits<T> => {
    return {  type: '16 Bits', ...etc }
}

const param_8bits = <T extends string>(etc: Omit<Param_8bits<T>,'type'>):Param_8bits<T> => {
    return {  type: '8 Bits', ...etc }
}

const param_1bit = <T extends string>(etc: Omit<Param_1bit<T>,'type'>):Param_1bit<T> => {
    return {  type: '1 Bit', ...etc }
}

// typing casting

const X: number = 0xA0 // fix: confirmar endereço

// ---- Inicio dos dados do usuario ---------

const PosicaoInicial = param_16bits({
    name: 'Posicao inicial',
    waddr: X+0x00,
})

const PosicaoFinal = param_16bits({
    name: 'Posicao final',
    waddr: X+0x02,
})

const AceleracaoDeAvanco = param_16bits({
    name: 'Aceleracao de avanco',
    waddr: X+0x04,
})

const AceleracaoDeRetorno = param_16bits({
    name: 'Aceleracao de retorno',
    waddr: X+0x06,
})

const VelocidadeDeAvanco = param_16bits({
    name: 'Velocidade de avanco',
    waddr: X+0x08,
})

const VelocidadeDeRetorno = param_16bits({
    name: 'Velocidade de retorno',
    waddr: X+0x0A,
})

const NumeroDeMensagemNoAvanco = param_8bits({
    name: 'Numero de mensagem no avanco',
    waddr: X+0xC,
    startBit: 0
})

const NumeroDeMensagemNoRetorno = param_8bits({
    name: 'Numero de mensagem no retorno',
    waddr: X+0xC,
    startBit: 8,
})

const PosicaoDaPrimeiraImpressaoNoAvanco = param_16bits({
    name: 'Posicao da primeira impressao no avanco',
    waddr: X+0x0E,
})

const PosicaoDaPrimeiraImpressaoNoRetorno = param_16bits({
    name: 'Posicao da primeira impressao no retorno',
    waddr: X+0x10,
})

const PosicaoDaUltimaMensagemNoAvanco = param_16bits({
    name: 'Posicao da ultima mensagem no avanco',
    waddr: X+0x12,
})

const PosicaoDaUltimaMensagemNoRetorno = param_16bits({
    name: 'Posicao da ultima mensagem no retorno',
    waddr: X+0x14,
})

const LarguraDoSinalDeImpressao = param_16bits({
    name: 'Largura do sinal de impressao',
    waddr: X+0x16,
})

const TempoParaStartAutomatico = param_16bits({
    name: 'Tempo para o start automatico',
    waddr: X+0x18,
})

const TempoParaStartExterno = param_16bits({
    name: 'Tempo para o start externo',
    waddr: X+0x1A,
})

const CotaDeAntecipacaoDoStartEntreEixosPinelmatico = param_16bits({
    name: 'Cota de antecipacao do start entre eixos (pinelmatico)',
    waddr: X+0x1C,
})

const RetardoParaStartAutomaticoPassoAPasso = param_16bits({
    name: 'Retardo para o start automatico passo a passo',
    waddr: X+0x1E,
})

// X+0x20 = Flag de configuracao da programacao

const StartAutomaticoNoAvancoLigado = param_1bit({
    name: 'Start automatico no avanco ligado',
    waddr: X+0x20,
    startBit: 0,
})

const StartAutomaticoNoRetornoLigado = param_1bit({
    name: 'Saida de start no avanco ligado',
    waddr: X+0x20,
    startBit: 2,
})

const SaidaDeStartNoRetornoLigado = param_1bit({
    name: 'Saida de start no retorno ligado',
    waddr: X+0x20,
    startBit: 3,
})

const StartExternoHabilitado = param_1bit({
    name: 'Start externo habilitado',
    waddr: X+0x20,
    startBit: 4,
})

const LogicaDoStartExterno = param_1bit({
    name: 'Logica do start externo',
    waddr: X+0x20,
    startBit: 5,
})

const EntradaDeStartEntreEixoHabilitado = param_1bit({
    name: 'Entrada de start entre eixo habilitado',
    waddr: X+0x20,
    startBit: 6,
})

const StartExternoParaReferenciarHabilitado = param_1bit({
    name: 'Start externo para referenciar habilitado',
    waddr: X+0x20,
    startBit: 7,
})

// X+0x21 = Flag de configuracao da programacao

const LogicaDoSinalDeImpressao = param_1bit({
    name: 'Logica do sinal de impressao',
    waddr: X+0x20,
    startBit: 8,
})

const LogicaDoSinalDeReversao = param_1bit({
    name: 'Logica do sinal de reversao',
    waddr: X+0x20,
    startBit: 9,
})

const SelecaoDeImpressaoViaSerialLigada = param_1bit({
    name: 'Selecao de impressao via serial ligada',
    waddr: X+0x20,
    startBit: 10,
})
    
const ReversaoDeImpressaoViaSerialLigada = param_1bit({
    name: 'Reversao de impressao via serial ligada',
    waddr: X+0x20,
    startBit: 11,
})

const ZeroIndexHabilitadoParaProtecao = param_1bit({
    name: 'Zero Index habilitado p/ protecao',
    waddr: X+0x20,
    startBit: 12,
})

const ZeroIndexHabilitadoParaCorrecao = param_1bit({
    name: 'Zero Index habilitado p/ correcao',
    waddr: X+0x20,
    startBit: 13,
})

const ReducaoDoNivelDeCorrenteEmRepouso = param_1bit({
    name: 'Reducao do nivel de corrente em repouso',
    waddr: X+0x20,
    startBit: 14,
})

const ModoContinuoOuPassoAPasso = param_1bit({
    name: 'Modo continuo/passo a passo',
    waddr: X+0x20,
    startBit: 15,
})

// ---------------

const RetardoParaOSinalDeImpressao = param_16bits({
    name: 'Retardo para o sinal de impressao',
    waddr: X+0x22,
})

/*
const DivisorProgramadoDoTaco = param_16bits({
    name: 'Divisor programado do taco',
    waddr: X+0x24,
})

const Vago = param_16bits({
    name: 'Vago',
    waddr: X+0x25,
})
*/
    
const ToleranciaDeErroDoZeroIndex = param_16bits({
    name: 'Tolerancia de Erro do zero index',
    waddr: X+0x26,
})

const NumeroDePulsosPorVoltaDoMotor = param_16bits({
    name: 'Numero de pulsos por volta do motor',
    waddr: X+0x28,
})

const ValorProgramadoDaReferencia = param_16bits({
    name: 'Valor programado da referencia',
    waddr: X+0x2A,
})

const AceleracaoDeReferencia = param_16bits({
    name: 'Aceleracao de referencia',
    waddr: X+0x2C,
})

const VelocidadeDeReferencia = param_16bits({
    name: 'Velocidade de referencia',
    waddr: X+0x2A, //2E
})

// X+0x30 = Flag especial de intertravamento

const SaidaDeStartPassoAPasso = param_1bit({
    name: 'Saida de start passo a passo',
    waddr: X+0x30,
    startBit: 0,
})

const StartAutomaticoPassoAPasso = param_1bit({
    name: 'Start automatico passo a passo',
    waddr: X+0x30,
    startBit: 1,
})

const SelecaoDeMensagemPorMultipla = param_1bit({
    name: 'Selecao de mensagem por multipla',
    waddr: X+0x30,
    startBit: 2,
})

const SelecaoDeMensagemPorImpressao = param_1bit({
    name: 'Selecao de mensagem por impresao',
    waddr: X+0x30,
    startBit: 3,
})

const SelecaoDePensagemPelaParalela = param_1bit({
    name: 'Selecao de mensagem pela paralela',
    waddr: X+0x30,
    startBit: 4,
})

const SelecaoDeMensagemDecrementadoNoRetorno = ({
    name: 'Selecao de mensagem Decrementado no retorno',
    waddr: X+0x30,
    startBit: 5,
})

// ------

/*
const DivisorProgramadoDomotor = param_16bits({
    name: 'Divisor programado do motor',
    waddr: X+0x31,
})
*/

// ---- Fim dos dados do usuario ---------

// Controle via serial

const StartSerial = param_1bit({
    name: 'Start serial',
    waddr: X+0x32,
    startBit: 0,
})

const StopSerial = param_1bit({
    name: 'Stop serial',
    waddr: X+0x32,
    startBit: 1,
})

const PausaSerial = param_1bit({
    name: 'Pausa serial',
    waddr: X+0x32,
    startBit: 2,
})

const MonoManualSerial = param_1bit({
    name: 'Modo manual serial',
    waddr: X+0x32,
    startBit: 3,
})

const TesteDeImpressaoSerial = param_1bit({
    name: 'Teste de impressao serial',
    waddr: X+0x32,
    startBit: 4,
})

const UsadoNaBahiaSulDescritoNaRotinaLEITOR_OK = param_1bit({
    name: 'Usado na bahia sul, descrito na rotina LEITOK',
    waddr: X+0x32,
    startBit: 5,
})

const GravaEprom2 = param_1bit({
    name: 'Grava eprom2',
    waddr: X+0x32,
    startBit: 6,
})

/*
const vago = param_1bit({
    name: 'vago',
    waddr: X+0x32,
    startBit: 7,
})*/

// ----------

// O Programa salva nesta variavel a diferenca
// entre a saida do fc- e o primeiro giro do zindex

const DiferencaEntreSaidaDoFCMenosEOPrimeiroGiroDoZeroIndex = param_16bits({
    name: 'Diferenca entre saida do FC- e o primeiro giro do zindex',
    waddr: X+0x34,
})

const ValorAnteriorDaPortaC = param_1bit({
    name: 'Valor anterior da porta C',
    waddr: X+0x36,
    startBit: 0,
})

// 0x37 = Flag de uso geral

const FinalizacaoDaReferencia = param_1bit({
    name: 'Finalizacao da referencia',
    waddr: X+0x36,
    startBit: 8,
})

const BitDeValorDoZeroIndexInvalido = param_1bit({
    name: 'Bit de valor do zero index invalido',
    waddr: X+0x36,
    startBit: 9,
})

const StartAutomaticoPendente = param_1bit({
    name: 'Start automatico pendente',
    waddr: X+0x36,
    startBit: 10,
})

const StartEntreEixosPendente = param_1bit({
    name: 'Start entre eixo pendente',
    waddr: X+0x36,
    startBit: 11,
})

//;D3	Solicitacao de reversao de mensagem via serial
//;D4	Utilizado no iclude DOMINIC para inicializar a impressora e

const AcessoAEpromViaSerial = param_1bit({
    name: 'Acesso a eprom via serial',
    waddr: X+0x36,
    startBit: 13,
})
    
const GravacaoDeBlocoNaEprom2EmAndamento = param_1bit({
    name: 'Gravacao de bloco na eprom2 em andamento',
    waddr: X+0x36,
    startBit: 14,
})

const GravacaoDaEprom2EmAndamento =  param_1bit({
    name: 'Gravacao da eprom2 em andamento',
    waddr: X+0x36,
    startBit: 15,
})

//0x39 = Nivel dos sinais de fc-/fc+/ref/zindex


const NivelSinalHalfFull = param_1bit({
    name: 'Nivel: H/F',
    waddr: X+0x38,
    startBit: 8,
})

const NivelSinalNmotor = param_1bit({
    name: 'Nivel: Nmotor',
    waddr: X+0x38,
    startBit: 9,
})

const NivelSinalGiro = param_1bit({
    name: 'Nivel: FC+', // NOTE: Sinal de giro também é chamado de FC+ por questao de legado
    waddr: X+0x38,
    startBit: 10,
})

const NivelSinalDmotor = param_1bit({
    name: 'Nivel: Dmotor',
    waddr: X+0x38,
    startBit: 11,
})

const NivelSinalCKmotor = param_1bit({
    name: 'Nivel: CKmotor',
    waddr: X+0x38,
    startBit: 12,
})

const NivelSinalFimDeCursoMenos = param_1bit({
    name: 'Nivel: FC-',
    waddr: X+0x38,
    startBit: 13,
})

const NivelSinalReferencia = param_1bit({
    name: 'Nivel: REF',
    waddr: X+0x38,
    startBit: 14,
})

const NivelSinalEmotor = param_1bit({
    name: 'Nivel: Emotor',
    waddr: X+0x38,
    startBit: 15,
})

// api 

const api = {
    'Posicao inicial': PosicaoInicial,
    'Posicao final': PosicaoFinal,
    'Aceleracao de avanco': AceleracaoDeAvanco,
    'Velocidade de avanco': VelocidadeDeAvanco,
    'Velocidade de retorno': VelocidadeDeRetorno,
    'Numero de mensagem no avanco': NumeroDeMensagemNoAvanco,
    'Numero de mensagem no retorno': NumeroDeMensagemNoRetorno,
    'PosicaoDaPrimeiraImpressaoNoAvanco': PosicaoDaPrimeiraImpressaoNoAvanco,
    'Posicao da primeira impressao no retorno': PosicaoDaPrimeiraImpressaoNoRetorno,
    'Posicao da ultima mensagem no avanco': PosicaoDaUltimaMensagemNoAvanco,
    'Posicao da ultima mensagem no retorno': PosicaoDaUltimaMensagemNoRetorno,
    'Largura do sinal de impressao': LarguraDoSinalDeImpressao,
    'Tempo para o start automatico': TempoParaStartAutomatico,
    'Tempo para o start externo': TempoParaStartExterno,
    'Cota de antecipacao do start entre eixos (pinelmatico)': CotaDeAntecipacaoDoStartEntreEixosPinelmatico,
    'Retardo para o start automatico passo a passo': RetardoParaStartAutomaticoPassoAPasso,
    'Start automatico no avanco ligado': StartAutomaticoNoAvancoLigado,
    'Saida de start no avanco ligado': StartAutomaticoNoRetornoLigado,
    'Saida de start no retorno ligado': SaidaDeStartNoRetornoLigado,
    'Start externo habilitado': StartExternoHabilitado,
    'Logica do start externo': LogicaDoStartExterno,
    'Entrada de start entre eixo habilitado': EntradaDeStartEntreEixoHabilitado,
    'Start externo para referenciar habilitado': StartExternoParaReferenciarHabilitado,
    'Logica do sinal de impressao': LogicaDoSinalDeImpressao,
    'Logica do sinal de reversao': LogicaDoSinalDeReversao,
    'Selecao de impressao via serial ligada': SelecaoDeImpressaoViaSerialLigada,
    'Reversao de impressao via serial ligada': ReversaoDeImpressaoViaSerialLigada,
    'Zero Index habilitado p/ protecao': ZeroIndexHabilitadoParaProtecao,
    'Zero Index habilitado p/ correcao': ZeroIndexHabilitadoParaCorrecao,
    'Reducao do nivel de corrente em repouso': ReducaoDoNivelDeCorrenteEmRepouso,
    'Modo continuo/passo a passo': ModoContinuoOuPassoAPasso,
    'Retardo para o sinal de impressao': RetardoParaOSinalDeImpressao,
    'Tolerancia de Erro do zero index': ToleranciaDeErroDoZeroIndex,
    'Numero de pulsos por volta do motor': NumeroDePulsosPorVoltaDoMotor,
    'Valor programado da referencia': ValorProgramadoDaReferencia,
    'Aceleracao de referencia': AceleracaoDeReferencia,
    'Velocidade de referencia': VelocidadeDeReferencia,
    'Saida de start passo a passo': SaidaDeStartPassoAPasso,
    'Start automatico passo a passo': StartAutomaticoPassoAPasso,
    'Selecao de mensagem por multipla': SelecaoDeMensagemPorMultipla,
    'Selecao de mensagem por impresAo': SelecaoDeMensagemPorImpressao,
    'Selecao de mensagem pela paralela': SelecaoDePensagemPelaParalela,
    'Selecao de mensagem Decrementado no retorno': SelecaoDeMensagemDecrementadoNoRetorno,
    'Start serial': StartSerial,
    'Stop serial': StopSerial,
    'Pausa serial': PausaSerial,
    'Modo manual serial': MonoManualSerial,
    'Teste de impressao serial': TesteDeImpressaoSerial,
    'Usado na bahia sul, descrito na rotina LEITOK': UsadoNaBahiaSulDescritoNaRotinaLEITOR_OK,
    'Grava eprom2': GravaEprom2,
    'Diferenca entre saida do FC- e o primeiro giro do zindex': DiferencaEntreSaidaDoFCMenosEOPrimeiroGiroDoZeroIndex,
    'Valor anterior da porta C': ValorAnteriorDaPortaC,
    'Finalizacao da referencia': FinalizacaoDaReferencia,
    'Bit de valor do zero index invalido': BitDeValorDoZeroIndexInvalido,
    'Start automatico pendente': StartAutomaticoPendente,
    'Start entre eixo pendente': StartEntreEixosPendente,
    'Acesso a eprom via serial': AcessoAEpromViaSerial,
    'Gravacao de bloco na eprom2 em andamento': GravacaoDeBlocoNaEprom2EmAndamento,
    'Gravacao da eprom2 em andamento': GravacaoDaEprom2EmAndamento,
    'Nivel: H/F': NivelSinalHalfFull,
    'Nivel: Nmotor': NivelSinalNmotor,
    'Nivel: FC+': NivelSinalGiro,
    'Nivel: Dmotor': NivelSinalDmotor,
    'Nivel: CKmotor': NivelSinalCKmotor,
    'Nivel: FC-': NivelSinalFimDeCursoMenos,
    'Nivel: REF': NivelSinalReferencia,
    'Nivel: Emotor': NivelSinalEmotor,

}
