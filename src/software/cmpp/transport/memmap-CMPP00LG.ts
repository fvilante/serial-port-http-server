import { param_16bits, param_1bit, param_8bits, UInt16 } from './memmap-core'

// typing casting

const X: number = 0xA0 // fix: confirmar endereço

const id = <A extends number>(x: A):A => x

//types
const identityType = {
    serialize: id,
    deserialize: id, 
}


// ---- Inicio dos dados do usuario ---------

const PosicaoInicial = param_16bits({
    name: 'Posicao inicial',
    waddr: X+0x00,
    ...identityType,
})

const PosicaoFinal = param_16bits({
    name: 'Posicao final',
    waddr: X+0x02,
    ...identityType,
})

const AceleracaoDeAvanco = param_16bits({
    name: 'Aceleracao de avanco',
    waddr: X+0x04,
    ...identityType,
})

const AceleracaoDeRetorno = param_16bits({
    name: 'Aceleracao de retorno',
    waddr: X+0x06,
    ...identityType,
})

const VelocidadeDeAvanco = param_16bits({
    name: 'Velocidade de avanco',
    waddr: X+0x08,
    ...identityType,
})

const VelocidadeDeRetorno = param_16bits({
    name: 'Velocidade de retorno',
    waddr: X+0x0A,
    ...identityType,
})

const NumeroDeMensagemNoAvanco = param_8bits({
    name: 'Numero de mensagem no avanco',
    waddr: X+0xC,
    startBit: 0
    ...identityType,
})

const NumeroDeMensagemNoRetorno = param_8bits({
    name: 'Numero de mensagem no retorno',
    waddr: X+0xC,
    startBit: 8,
    ...identityType,
})

const PosicaoDaPrimeiraImpressaoNoAvanco = param_16bits({
    name: 'Posicao da primeira impressao no avanco',
    waddr: X+0x0E,
    ...identityType,
})

const PosicaoDaPrimeiraImpressaoNoRetorno = param_16bits({
    name: 'Posicao da primeira impressao no retorno',
    waddr: X+0x10,
    ...identityType,
})

const PosicaoDaUltimaMensagemNoAvanco = param_16bits({
    name: 'Posicao da ultima mensagem no avanco',
    waddr: X+0x12,
    ...identityType,
})

const PosicaoDaUltimaMensagemNoRetorno = param_16bits({
    name: 'Posicao da ultima mensagem no retorno',
    waddr: X+0x14,
    ...identityType,
})

const LarguraDoSinalDeImpressao = param_16bits({
    name: 'Largura do sinal de impressao',
    waddr: X+0x16,
    ...identityType,
})

const TempoParaStartAutomatico = param_16bits({
    name: 'Tempo para o start automatico',
    waddr: X+0x18,
    ...identityType,
})

const TempoParaStartExterno = param_16bits({
    name: 'Tempo para o start externo',
    waddr: X+0x1A,
    ...identityType,
})

const CotaDeAntecipacaoDoStartEntreEixosPinelmatico = param_16bits({
    name: 'Cota de antecipacao do start entre eixos (pinelmatico)',
    waddr: X+0x1C,
    ...identityType,
})

const RetardoParaStartAutomaticoPassoAPasso = param_16bits({
    name: 'Retardo para o start automatico passo a passo',
    waddr: X+0x1E,
    ...identityType,
})

// X+0x20 = Flag de configuracao da programacao

const StartAutomaticoNoAvancoLigado = param_1bit({
    name: 'Start automatico no avanco ligado',
    waddr: X+0x20,
    startBit: 0,
    ...identityType,
})

const StartAutomaticoNoRetornoLigado = param_1bit({
    name: 'Saida de start no avanco ligado',
    waddr: X+0x20,
    startBit: 2,
    ...identityType,
})

const SaidaDeStartNoRetornoLigado = param_1bit({
    name: 'Saida de start no retorno ligado',
    waddr: X+0x20,
    startBit: 3,
    ...identityType,
})

const StartExternoHabilitado = param_1bit({
    name: 'Start externo habilitado',
    waddr: X+0x20,
    startBit: 4,
    ...identityType,
})

const LogicaDoStartExterno = param_1bit({
    name: 'Logica do start externo',
    waddr: X+0x20,
    startBit: 5,
    ...identityType,
})

const EntradaDeStartEntreEixoHabilitado = param_1bit({
    name: 'Entrada de start entre eixo habilitado',
    waddr: X+0x20,
    startBit: 6,
    ...identityType,
})

const StartExternoParaReferenciarHabilitado = param_1bit({
    name: 'Start externo para referenciar habilitado',
    waddr: X+0x20,
    startBit: 7,
    ...identityType,
})

// X+0x21 = Flag de configuracao da programacao

const LogicaDoSinalDeImpressao = param_1bit({
    name: 'Logica do sinal de impressao',
    waddr: X+0x20,
    startBit: 8,
    ...identityType,
})

const LogicaDoSinalDeReversao = param_1bit({
    name: 'Logica do sinal de reversao',
    waddr: X+0x20,
    startBit: 9,
    ...identityType,
})

const SelecaoDeImpressaoViaSerialLigada = param_1bit({
    name: 'Selecao de impressao via serial ligada',
    waddr: X+0x20,
    startBit: 10,
    ...identityType,
})
    
const ReversaoDeImpressaoViaSerialLigada = param_1bit({
    name: 'Reversao de impressao via serial ligada',
    waddr: X+0x20,
    startBit: 11,
    ...identityType,
})

const ZeroIndexHabilitadoParaProtecao = param_1bit({
    name: 'Zero Index habilitado p/ protecao',
    waddr: X+0x20,
    startBit: 12,
    ...identityType,
})

const ZeroIndexHabilitadoParaCorrecao = param_1bit({
    name: 'Zero Index habilitado p/ correcao',
    waddr: X+0x20,
    startBit: 13,
    ...identityType,
})

const ReducaoDoNivelDeCorrenteEmRepouso = param_1bit({
    name: 'Reducao do nivel de corrente em repouso',
    waddr: X+0x20,
    startBit: 14,
    ...identityType,
})

const ModoContinuoOuPassoAPasso = param_1bit({
    name: 'Modo continuo/passo a passo',
    waddr: X+0x20,
    startBit: 15,
    ...identityType,
})

// ---------------

const RetardoParaOSinalDeImpressao = param_16bits({
    name: 'Retardo para o sinal de impressao',
    waddr: X+0x22,
    ...identityType,
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
    ...identityType,
})

const NumeroDePulsosPorVoltaDoMotor = param_16bits({
    name: 'Numero de pulsos por volta do motor',
    waddr: X+0x28,
    ...identityType,
})

const ValorProgramadoDaReferencia = param_16bits({
    name: 'Valor programado da referencia',
    waddr: X+0x2A,
    ...identityType,
})

const AceleracaoDeReferencia = param_16bits({
    name: 'Aceleracao de referencia',
    waddr: X+0x2C,
    ...identityType,
})

const VelocidadeDeReferencia = param_16bits({
    name: 'Velocidade de referencia',
    waddr: X+0x2A, //2E
    ...identityType,
})

// X+0x30 = Flag especial de intertravamento

const SaidaDeStartPassoAPasso = param_1bit({
    name: 'Saida de start passo a passo',
    waddr: X+0x30,
    startBit: 0,
    ...identityType,
})

const StartAutomaticoPassoAPasso = param_1bit({
    name: 'Start automatico passo a passo',
    waddr: X+0x30,
    startBit: 1,
    ...identityType,
})

const SelecaoDeMensagemPorMultipla = param_1bit({
    name: 'Selecao de mensagem por multipla',
    waddr: X+0x30,
    startBit: 2,
    ...identityType,
})

const SelecaoDeMensagemPorImpressao = param_1bit({
    name: 'Selecao de mensagem por impresao',
    waddr: X+0x30,
    startBit: 3,
    ...identityType,
})

const SelecaoDePensagemPelaParalela = param_1bit({
    name: 'Selecao de mensagem pela paralela',
    waddr: X+0x30,
    startBit: 4,
    ...identityType,
})

const SelecaoDeMensagemDecrementadoNoRetorno = param_1bit({
    name: 'Selecao de mensagem Decrementado no retorno',
    waddr: X+0x30,
    startBit: 5,
    ...identityType,
})

// ------

/*
const DivisorProgramadoDomotor = param_16bits({
    name: 'Divisor programado do motor',
    waddr: X+0x31,
    ...identityType,
})
*/

// ---- Fim dos dados do usuario ---------

// Controle via serial

const StartSerial = param_1bit({
    name: 'Start serial',
    waddr: X+0x32,
    startBit: 0,
    ...identityType,
})

const StopSerial = param_1bit({
    name: 'Stop serial',
    waddr: X+0x32,
    startBit: 1,
    ...identityType,
})

const PausaSerial = param_1bit({
    name: 'Pausa serial',
    waddr: X+0x32,
    startBit: 2,
    ...identityType,
})

const MonoManualSerial = param_1bit({
    name: 'Modo manual serial',
    waddr: X+0x32,
    startBit: 3,
    ...identityType,
})

const TesteDeImpressaoSerial = param_1bit({
    name: 'Teste de impressao serial',
    waddr: X+0x32,
    startBit: 4,
    ...identityType,
})

const UsadoNaBahiaSulDescritoNaRotinaLEITOR_OK = param_1bit({
    name: 'Usado na bahia sul, descrito na rotina LEITOK',
    waddr: X+0x32,
    startBit: 5,
    ...identityType,
})

const GravaEprom2 = param_1bit({
    name: 'Grava eprom2',
    waddr: X+0x32,
    startBit: 6,
    ...identityType,
})

/*
const vago = param_1bit({
    name: 'vago',
    waddr: X+0x32,
    startBit: 7,
    ...identityType,
})*/

// ----------

// O Programa salva nesta variavel a diferenca
// entre a saida do fc- e o primeiro giro do zindex

const DiferencaEntreSaidaDoFCMenosEOPrimeiroGiroDoZeroIndex = param_16bits({
    name: 'Diferenca entre saida do FC- e o primeiro giro do zindex',
    waddr: X+0x34,
    ...identityType,
})

const ValorAnteriorDaPortaC = param_1bit({
    name: 'Valor anterior da porta C',
    waddr: X+0x36,
    startBit: 0,
    ...identityType,
})

// 0x37 = Flag de uso geral

const FinalizacaoDaReferencia = param_1bit({
    name: 'Finalizacao da referencia',
    waddr: X+0x36,
    startBit: 8,
    ...identityType,
})

const BitDeValorDoZeroIndexInvalido = param_1bit({
    name: 'Bit de valor do zero index invalido',
    waddr: X+0x36,
    startBit: 9,
    ...identityType,
})

const StartAutomaticoPendente = param_1bit({
    name: 'Start automatico pendente',
    waddr: X+0x36,
    startBit: 10,
    ...identityType,
})

const StartEntreEixosPendente = param_1bit({
    name: 'Start entre eixo pendente',
    waddr: X+0x36,
    startBit: 11,
    ...identityType,
})

//;D3	Solicitacao de reversao de mensagem via serial
//;D4	Utilizado no iclude DOMINIC para inicializar a impressora e

const AcessoAEpromViaSerial = param_1bit({
    name: 'Acesso a eprom via serial',
    waddr: X+0x36,
    startBit: 13,
    ...identityType,
})
    
const GravacaoDeBlocoNaEprom2EmAndamento = param_1bit({
    name: 'Gravacao de bloco na eprom2 em andamento',
    waddr: X+0x36,
    startBit: 14,
    ...identityType,
})

const GravacaoDaEprom2EmAndamento =  param_1bit({
    name: 'Gravacao da eprom2 em andamento',
    waddr: X+0x36,
    startBit: 15,
    ...identityType,
})

//0x39 = Nivel dos sinais de fc-/fc+/ref/zindex


const NivelSinalHalfFull = param_1bit({
    name: 'Nivel: H/F',
    waddr: X+0x38,
    startBit: 8,
    ...identityType,
})

const NivelSinalNmotor = param_1bit({
    name: 'Nivel: Nmotor',
    waddr: X+0x38,
    startBit: 9,
    ...identityType,
})

const NivelSinalGiro = param_1bit({
    name: 'Nivel: FC+', // NOTE: Sinal de giro também é chamado de FC+ por questao de legado
    waddr: X+0x38,
    startBit: 10,
    ...identityType,
})

const NivelSinalDmotor = param_1bit({
    name: 'Nivel: Dmotor',
    waddr: X+0x38,
    startBit: 11,
    ...identityType,
})

const NivelSinalCKmotor = param_1bit({
    name: 'Nivel: CKmotor',
    waddr: X+0x38,
    startBit: 12,
    ...identityType,
})

const NivelSinalFimDeCursoMenos = param_1bit({
    name: 'Nivel: FC-',
    waddr: X+0x38,
    startBit: 13,
    ...identityType,
})

const NivelSinalReferencia = param_1bit({
    name: 'Nivel: REF',
    waddr: X+0x38,
    startBit: 14,
    ...identityType,
})

const NivelSinalEmotor = param_1bit({
    name: 'Nivel: Emotor',
    waddr: X+0x38,
    startBit: 15,
    ...identityType,
})

// api 

export const api = {
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
