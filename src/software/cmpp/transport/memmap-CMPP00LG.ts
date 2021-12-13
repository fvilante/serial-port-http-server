import { Tunnel } from '../datalink/tunnel'
import { makeSettersAndGettersFromCmppAPI } from './api-beaultifier'
import { paramCaster_16bits, paramCaster_1bit, paramCaster_8bits, UInt1, UInt16 } from './memmap-caster'
import { Pulses, PulsesPerTick, PulsesPerTickSquared, TicksOfClock } from './memmap-types'

// typing casting

const X: number = 0xA0 // fix: confirmar endereço

const id = <A extends number>(x: A):A => x

//types
const identityType = {
    serialize: id,
    deserialize: id, 
}

const pulses = {
    serialize: (_: Pulses) => _.value,
    deserialize: (raw: UInt16) => Pulses(raw) 
}

const pulsesPerTick = {
    serialize: (_: PulsesPerTick) => _.value,
    deserialize: (raw: UInt16) => PulsesPerTick(raw)
}

const pulsesPerTickSquered = {
    serialize: (_: PulsesPerTickSquared) => _.value,
    deserialize: (raw: UInt16) => PulsesPerTickSquared(raw)
}

const ticksOfClock = {
    serialize: (_: TicksOfClock) => _.value,
    deserialize: (raw: UInt16) => TicksOfClock(raw)
}

// --- discrete/optional -> cmpp types

//TODO: maybe exist a better place for this type (ie: near 'Aceleracao', 'Velocidade', etc)
export type LigadoDesligado = 'desligado' | 'ligado'
//TODO: Check if the convertion logic is not inverted
const ligadoDesligado = {
    serialize: (_: LigadoDesligado):UInt1 => _==='ligado' ? 1 : 0,
    deserialize: (raw: UInt1):LigadoDesligado => raw === 0 ? 'desligado' : 'ligado'
}

//TODO: maybe exist a better place for this type (ie: near 'Aceleracao', 'Velocidade', etc)
export type AbertoFechado = 'aberto' | 'fechado'
//TODO: Check if the convertion logic is not inverted
const abertoFechado = {
    serialize: (_: AbertoFechado):UInt1 => _==='aberto' ? 1 : 0,
    deserialize: (raw: UInt1):AbertoFechado => raw === 0 ? 'fechado' : 'aberto'
}

//TODO: maybe exist a better place for this type (ie: near 'Aceleracao', 'Velocidade', etc)
export type ContinuoPassoAPasso = 'continuo' | 'passo-a-passo'
//TODO: Check if the convertion logic is not inverted
const continuoPassoAPasso = {
    serialize: (_: ContinuoPassoAPasso):UInt1 => _==='passo-a-passo' ? 1 : 0,
    deserialize: (raw: UInt1):ContinuoPassoAPasso => raw === 0 ? 'continuo' : 'passo-a-passo'
}

// ---- Inicio dos dados do usuario ---------

const PosicaoInicial = paramCaster_16bits({
    name: 'Posicao inicial',
    waddr: X+0x00,
    ...pulses,
})

const PosicaoFinal = paramCaster_16bits({
    name: 'Posicao final',
    waddr: X+0x02,
    ...pulses,
})

const AceleracaoDeAvanco = paramCaster_16bits({
    name: 'Aceleracao de avanco',
    waddr: X+0x04,
    ...pulsesPerTickSquered,
})

const AceleracaoDeRetorno = paramCaster_16bits({
    name: 'Aceleracao de retorno',
    waddr: X+0x06,
    ...pulsesPerTickSquered,
})

const VelocidadeDeAvanco = paramCaster_16bits({
    name: 'Velocidade de avanco',
    waddr: X+0x08,
    ...pulsesPerTick,
})

const VelocidadeDeRetorno = paramCaster_16bits({
    name: 'Velocidade de retorno',
    waddr: X+0x0A,
    ...pulsesPerTick,
})

const NumeroDeMensagemNoAvanco = paramCaster_8bits({
    name: 'Numero de mensagem no avanco',
    waddr: X+0xC,
    startBit: 0,
    ...identityType, //TODO: Improve type
})

const NumeroDeMensagemNoRetorno = paramCaster_8bits({
    name: 'Numero de mensagem no retorno',
    waddr: X+0xC,
    startBit: 8,
    ...identityType,
})

const PosicaoDaPrimeiraImpressaoNoAvanco = paramCaster_16bits({
    name: 'Posicao da primeira impressao no avanco',
    waddr: X+0x0E,
    ...pulses,
})

const PosicaoDaPrimeiraImpressaoNoRetorno = paramCaster_16bits({
    name: 'Posicao da primeira impressao no retorno',
    waddr: X+0x10,
    ...pulses,
})

const PosicaoDaUltimaMensagemNoAvanco = paramCaster_16bits({
    name: 'Posicao da ultima mensagem no avanco',
    waddr: X+0x12,
    ...pulses,
})

const PosicaoDaUltimaMensagemNoRetorno = paramCaster_16bits({
    name: 'Posicao da ultima mensagem no retorno',
    waddr: X+0x14,
    ...pulses,
})

const LarguraDoSinalDeImpressao = paramCaster_16bits({
    name: 'Largura do sinal de impressao',
    waddr: X+0x16,
    ...pulses,
})

const TempoParaStartAutomatico = paramCaster_16bits({
    name: 'Tempo para o start automatico',
    waddr: X+0x18,
    ...ticksOfClock,
})

const TempoParaStartExterno = paramCaster_16bits({
    name: 'Tempo para o start externo',
    waddr: X+0x1A,
    ...ticksOfClock,
})

const CotaDeAntecipacaoDoStartEntreEixosPinelmatico = paramCaster_16bits({
    name: 'Cota de antecipacao do start entre eixos (pinelmatico)',
    waddr: X+0x1C,
    ...pulses,
})

const RetardoParaStartAutomaticoPassoAPasso = paramCaster_16bits({
    name: 'Retardo para o start automatico passo a passo',
    waddr: X+0x1E,
    ...ticksOfClock,
})

// X+0x20 = Flag de configuracao da programacao

const StartAutomaticoNoAvanco = paramCaster_1bit({
    name: 'Start automatico no avanco',
    waddr: X+0x20,
    startBit: 0,
    ...ligadoDesligado,
})

const StartAutomaticoNoRetorno = paramCaster_1bit({
    name: 'Start automatico no retorno',
    waddr: X+0x20,
    startBit: 1,
    ...ligadoDesligado,
})

const SaidaDeStartNoAvanco = paramCaster_1bit({
    name: 'Saida de start no avanco',
    waddr: X+0x20,
    startBit: 2,
    ...ligadoDesligado,
})

const SaidaDeStartNoRetorno = paramCaster_1bit({
    name: 'Saida de start no retorno',
    waddr: X+0x20,
    startBit: 3,
    ...ligadoDesligado,
})

const StartExternoHabilitado = paramCaster_1bit({
    name: 'Start externo habilitado',
    waddr: X+0x20,
    startBit: 4,
    ...ligadoDesligado,
})

const LogicaDoStartExterno = paramCaster_1bit({
    name: 'Logica do start externo',
    waddr: X+0x20,
    startBit: 5,
    ...ligadoDesligado,
})

const EntradaDeStartEntreEixo = paramCaster_1bit({
    name: 'Entrada de start entre eixo habilitado',
    waddr: X+0x20,
    startBit: 6,
    ...ligadoDesligado,
})

const ReferenciaPeloStartExterno = paramCaster_1bit({
    name: 'Referencia pelo start externo',
    waddr: X+0x20,
    startBit: 7,
    ...ligadoDesligado,
})

// X+0x21 = Flag de configuracao da programacao

const LogicaDoSinalDeImpressao = paramCaster_1bit({
    name: 'Logica do sinal de impressao',
    waddr: X+0x20,
    startBit: 8,
    ...abertoFechado,
})

const LogicaDoSinalDeReversao = paramCaster_1bit({
    name: 'Logica do sinal de reversao',
    waddr: X+0x20,
    startBit: 9,
    ...abertoFechado,
})

const SelecaoDeImpressaoViaSerial = paramCaster_1bit({
    name: 'Selecao de impressao via serial',
    waddr: X+0x20,
    startBit: 10,
    ...ligadoDesligado
})
    
const ReversaoDeImpressaoViaSerial = paramCaster_1bit({
    name: 'Reversao de impressao via serial',
    waddr: X+0x20,
    startBit: 11,
    ...ligadoDesligado,
})

const GiroComFuncaoDeProtecao = paramCaster_1bit({
    name: 'Giro com funcao de protecao',
    waddr: X+0x20,
    startBit: 12,
    ...ligadoDesligado,
})

const GiroComFuncaoDeCorrecao = paramCaster_1bit({
    name: 'Giro com funcao de correcao',
    waddr: X+0x20,
    startBit: 13,
    ...ligadoDesligado,
})

const ReducaoDaCorrenteEmRepouso = paramCaster_1bit({
    name: 'Reducao da corrente em repouso',
    waddr: X+0x20,
    startBit: 14,
    ...ligadoDesligado,
})

const ModoContinuoOuPassoAPasso = paramCaster_1bit({
    name: 'Modo continuo/passo a passo',
    waddr: X+0x20,
    startBit: 15,
    ...continuoPassoAPasso,
})

// ---------------

const RetardoParaOSinalDeImpressao = paramCaster_16bits({
    name: 'Retardo para o sinal de impressao',
    waddr: X+0x22,
    ...ticksOfClock,
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
    
const ToleranciaDeErroDoZeroIndex = paramCaster_16bits({
    name: 'Tolerancia de Erro do zero index',
    waddr: X+0x26,
    ...pulses,
})

const NumeroDePulsosPorVoltaDoMotor = paramCaster_16bits({
    name: 'Numero de pulsos por volta do motor',
    waddr: X+0x28,
    ...pulses,
})

const ValorDaPosicaoDeReferencia = paramCaster_16bits({
    name: 'Valor da posicao de referencia',
    waddr: X+0x2A,
    ...pulses,
})

const AceleracaoDeReferencia = paramCaster_16bits({
    name: 'Aceleracao de referencia',
    waddr: X+0x2C,
    ...pulsesPerTickSquered,
})

const VelocidadeDeReferencia = paramCaster_16bits({
    name: 'Velocidade de referencia',
    waddr: X+0x2A, //2E
    ...pulsesPerTick,
})

// X+0x30 = Flag especial de intertravamento

const SaidaDeStartPassoAPasso = paramCaster_1bit({
    name: 'Saida de start passo a passo',
    waddr: X+0x30,
    startBit: 0,
    ...ligadoDesligado,
})

const StartAutomaticoPassoAPasso = paramCaster_1bit({
    name: 'Start automatico passo a passo',
    waddr: X+0x30,
    startBit: 1,
    ...ligadoDesligado,
})

const SelecaoDeMensagemPorMultipla = paramCaster_1bit({
    name: 'Selecao de mensagem por multipla',
    waddr: X+0x30,
    startBit: 2,
    ...ligadoDesligado,
})

const SelecaoDeMensagemPorImpressao = paramCaster_1bit({
    name: 'Selecao de mensagem por impresao',
    waddr: X+0x30,
    startBit: 3,
    ...ligadoDesligado,
})

const SelecaoDePensagemPelaParalela = paramCaster_1bit({
    name: 'Selecao de mensagem pela paralela',
    waddr: X+0x30,
    startBit: 4,
    ...ligadoDesligado,
})

const SelecaoDeMensagemDecrementadoNoRetorno = paramCaster_1bit({
    name: 'Selecao de mensagem Decrementado no retorno',
    waddr: X+0x30,
    startBit: 5,
    ...ligadoDesligado,
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

const StartSerial = paramCaster_1bit({
    name: 'Start serial',
    waddr: X+0x32,
    startBit: 0,
    ...ligadoDesligado,
})

const StopSerial = paramCaster_1bit({
    name: 'Stop serial',
    waddr: X+0x32,
    startBit: 1,
    ...ligadoDesligado,
})

const PausaSerial = paramCaster_1bit({
    name: 'Pausa serial',
    waddr: X+0x32,
    startBit: 2,
    ...ligadoDesligado,
})

const MonoManualSerial = paramCaster_1bit({
    name: 'Modo manual serial',
    waddr: X+0x32,
    startBit: 3,
    ...ligadoDesligado,
})

const TesteDeImpressaoSerial = paramCaster_1bit({
    name: 'Teste de impressao serial',
    waddr: X+0x32,
    startBit: 4,
    ...ligadoDesligado,
})

const UsadoNaBahiaSulDescritoNaRotinaLEITOR_OK = paramCaster_1bit({
    name: 'Usado na bahia sul, descrito na rotina LEITOK',
    waddr: X+0x32,
    startBit: 5,
    ...ligadoDesligado,
})

const GravaEprom2 = paramCaster_1bit({
    name: 'Grava eprom2',
    waddr: X+0x32,
    startBit: 6,
    ...ligadoDesligado,
})

/*
const vago = param_1bit({
    name: 'vago',
    waddr: X+0x32,
    startBit: 7,
    ...ligadoDesligado,
})*/

// ----------

// O Programa salva nesta variavel a diferenca
// entre a saida do fc- e o primeiro giro do zindex

const DiferencaEntreSaidaDoFCMenosEOPrimeiroGiroDoZeroIndex = paramCaster_16bits({
    name: 'Diferenca entre saida do FC- e o primeiro giro do zindex',
    waddr: X+0x34,
    ...pulses,
})

const ValorAnteriorDaPortaC = paramCaster_1bit({
    name: 'Valor anterior da porta C',
    waddr: X+0x36,
    startBit: 0,
    ...ligadoDesligado,
})

// 0x37 = Flag de uso geral

const FinalizacaoDaReferencia = paramCaster_1bit({
    name: 'Finalizacao da referencia',
    waddr: X+0x36,
    startBit: 8,
    ...ligadoDesligado,
})

const BitDeValorDoZeroIndexInvalido = paramCaster_1bit({
    name: 'Bit de valor do zero index invalido',
    waddr: X+0x36,
    startBit: 9,
    ...ligadoDesligado,
})

const StartAutomaticoPendente = paramCaster_1bit({
    name: 'Start automatico pendente',
    waddr: X+0x36,
    startBit: 10,
    ...ligadoDesligado,
})

const StartEntreEixosPendente = paramCaster_1bit({
    name: 'Start entre eixo pendente',
    waddr: X+0x36,
    startBit: 11,
    ...ligadoDesligado,
})

//;D3	Solicitacao de reversao de mensagem via serial
//;D4	Utilizado no iclude DOMINIC para inicializar a impressora e

const AcessoAEpromViaSerial = paramCaster_1bit({
    name: 'Acesso a eprom via serial',
    waddr: X+0x36,
    startBit: 13,
    ...ligadoDesligado,
})
    
const GravacaoDeBlocoNaEprom2EmAndamento = paramCaster_1bit({
    name: 'Gravacao de bloco na eprom2 em andamento',
    waddr: X+0x36,
    startBit: 14,
    ...ligadoDesligado,
})

const GravacaoDaEprom2EmAndamento =  paramCaster_1bit({
    name: 'Gravacao da eprom2 em andamento',
    waddr: X+0x36,
    startBit: 15,
    ...ligadoDesligado,
})

//0x39 = Nivel dos sinais de fc-/fc+/ref/zindex


const NivelSinalHalfFull = paramCaster_1bit({
    name: 'Nivel: H/F',
    waddr: X+0x38,
    startBit: 8,
    ...ligadoDesligado,
})

const NivelSinalNmotor = paramCaster_1bit({
    name: 'Nivel: Nmotor',
    waddr: X+0x38,
    startBit: 9,
    ...ligadoDesligado,
})

const NivelSinalGiro = paramCaster_1bit({
    name: 'Nivel: FC+', // NOTE: Sinal de giro também é chamado de FC+ por questao de legado
    waddr: X+0x38,
    startBit: 10,
    ...ligadoDesligado,
})

const NivelSinalDmotor = paramCaster_1bit({
    name: 'Nivel: Dmotor',
    waddr: X+0x38,
    startBit: 11,
    ...ligadoDesligado,
})

const NivelSinalCKmotor = paramCaster_1bit({
    name: 'Nivel: CKmotor',
    waddr: X+0x38,
    startBit: 12,
    ...ligadoDesligado,
})

const NivelSinalFimDeCursoMenos = paramCaster_1bit({
    name: 'Nivel: FC-',
    waddr: X+0x38,
    startBit: 13,
    ...ligadoDesligado,
})

const NivelSinalReferencia = paramCaster_1bit({
    name: 'Nivel: REF',
    waddr: X+0x38,
    startBit: 14,
    ...ligadoDesligado,
})

const NivelSinalEmotor = paramCaster_1bit({
    name: 'Nivel: Emotor',
    waddr: X+0x38,
    startBit: 15,
    ...ligadoDesligado,
})

// api 

//TODO: Cast below variable
//NOTE: Do not forget to insert "as const" after the ending brackets. Each key must be annotated as 'readonly'
const api = {
    'Posicao inicial': PosicaoInicial,
    'Posicao final': PosicaoFinal,
    'Aceleracao de avanco': AceleracaoDeAvanco,
    'Aceleracao de retorno': AceleracaoDeRetorno,
    'Velocidade de avanco': VelocidadeDeAvanco,
    'Velocidade de retorno': VelocidadeDeRetorno,
    'Numero de mensagem no avanco': NumeroDeMensagemNoAvanco,
    'Numero de mensagem no retorno': NumeroDeMensagemNoRetorno,
    'Posicao da primeira impressao no avanco': PosicaoDaPrimeiraImpressaoNoAvanco,
    'Posicao da primeira impressao no retorno': PosicaoDaPrimeiraImpressaoNoRetorno,
    'Posicao da ultima mensagem no avanco': PosicaoDaUltimaMensagemNoAvanco,
    'Posicao da ultima mensagem no retorno': PosicaoDaUltimaMensagemNoRetorno,
    'Largura do sinal de impressao': LarguraDoSinalDeImpressao,
    'Tempo para o start automatico': TempoParaStartAutomatico,
    'Tempo para o start externo': TempoParaStartExterno,
    'Cota de antecipacao do start entre eixos (pinelmatico)': CotaDeAntecipacaoDoStartEntreEixosPinelmatico,
    'Retardo para o start automatico passo a passo': RetardoParaStartAutomaticoPassoAPasso,
    'Start automatico no avanco': StartAutomaticoNoAvanco,
    'Start automatico no retorno': StartAutomaticoNoRetorno,
    'Saida de start no avanco': SaidaDeStartNoAvanco,
    'Saida de start no retorno': SaidaDeStartNoRetorno,
    'Start externo habilitado': StartExternoHabilitado,
    'Logica do start externo': LogicaDoStartExterno,
    'Entrada de start entre eixo habilitado': EntradaDeStartEntreEixo,
    'Referencia pelo start externo': ReferenciaPeloStartExterno,
    'Logica do sinal de impressao': LogicaDoSinalDeImpressao,
    'Logica do sinal de reversao': LogicaDoSinalDeReversao,
    'Selecao de impressao via serial': SelecaoDeImpressaoViaSerial,
    'Reversao de impressao via serial': ReversaoDeImpressaoViaSerial,
    'Giro com funcao de protecao': GiroComFuncaoDeProtecao,
    'Giro com funcao de correcao': GiroComFuncaoDeCorrecao,
    'Reducao da corrente em repouso': ReducaoDaCorrenteEmRepouso,
    'Modo continuo/passo a passo': ModoContinuoOuPassoAPasso,
    'Retardo para o sinal de impressao': RetardoParaOSinalDeImpressao,
    'Tolerancia de Erro do zero index': ToleranciaDeErroDoZeroIndex,
    'Numero de pulsos por volta do motor': NumeroDePulsosPorVoltaDoMotor,
    'Valor da posicao de referencia': ValorDaPosicaoDeReferencia,
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
} as const


// API: just used to pre-apply tunnel to set and get
// TODO: maybe 'makeSettersAndGettersFromCmppAPI' can already do this work
export const CMPP00LG = (tunnel: Tunnel) => {
    const { set: internalSet, get: internalGet} = makeSettersAndGettersFromCmppAPI(api)

    return {
        set: internalSet(tunnel),
        get: internalGet(tunnel),
    }
}