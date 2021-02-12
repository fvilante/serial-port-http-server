

// type casts

export type Position = number
type Accelaretion = number
type Speed = number
type Time = number
type Byte = number // ex: num msg no avan/ret
type Pulses = number 
type LigadoDesligado = boolean
type AbertoFechado = boolean
type ContinuoPassoAPasso = boolean
type SetarRessetar = boolean
type VerdadeiroFalso = boolean
type Uint16 = number


// access mode
type ReadOnly = 'Ro'
type WriteOnly = 'Wo'
type ReadAndWrite = 'RW'
type Blocked = 'Blocked'
type AccessMode = ReadOnly | WriteOnly | ReadAndWrite | Blocked

// ---------


export type Param<N extends string = string, T extends unknown = unknown, A extends AccessMode = AccessMode> = {
    name: N
    accessMode: A
    cast?: T
    waddr: number
    startBit?: number
    bitLen?: number
}



// --

const X: number = 0xA0 // fix: confirmar endereço


type ParamsUsuario = readonly [
    // ---- Inicio dos dados do usuario ---------
    Param<'Posicao inicial', Position, ReadAndWrite>,
    Param<'Posicao final', Position, ReadAndWrite>,
    Param<'Aceleracao de avanco', Accelaretion, ReadAndWrite>,
    Param<'Aceleracao de retorno', Accelaretion, ReadAndWrite>,
    Param<'Velocidade de avanco', Speed, ReadAndWrite>,
    Param<'Velocidade de retorno', Speed, ReadAndWrite>,
    Param<'Numero de mensagem no avanco', Byte, ReadAndWrite>, // byte
    Param<'Numero de mensagem no retorno', Byte, ReadAndWrite>, // byte
    Param<'Posicao da primeira impressao no avanco', Position, ReadAndWrite>,
    Param<'Posicao da primeira impressao no retorno', Position, ReadAndWrite>,
    Param<'Posicao da ultima mensagem no avanco', Position, ReadAndWrite>,
    Param<'Posicao da ultima mensagem no retorno', Position, ReadAndWrite>,
    Param<'Largura do sinal de impressao', Time, ReadAndWrite>,
    Param<'Tempo para o start automatico', Time, ReadAndWrite>,
    Param<'Tempo para o start externo', Time, ReadAndWrite>,
    Param<'Cota de antecipacao do start entre eixos (pinelmatico)', Position, ReadAndWrite>,
    Param<'Retardo para o start automatico passo a passo', Time, ReadAndWrite>,
    // X+0x20 = Flag de configuracao da programacao
    Param<'Start automatico no avanco ligado', LigadoDesligado, ReadAndWrite >,
    Param<'Start automatico no retorno ligado', LigadoDesligado, ReadAndWrite>,
    Param<'Saida de start no avanco ligado', LigadoDesligado, ReadAndWrite>,
    Param<'Saida de start no retorno ligado', LigadoDesligado, ReadAndWrite>,
    Param<'Start externo habilitado', LigadoDesligado, ReadAndWrite>,
    Param<'Logica do start externo', AbertoFechado, ReadAndWrite>,
    Param<'Entrada de start entre eixo habilitado', LigadoDesligado, ReadAndWrite>,
    Param<'Start externo para referenciar habilitado', LigadoDesligado, ReadAndWrite>,
    // X+0x21 = Flag de configuracao da programacao
    Param<'Logica do sinal de impressao', AbertoFechado, ReadAndWrite>,
    Param<'Logica do sinal de reversao', AbertoFechado, ReadAndWrite>,
    Param<'Selecao de impressao via serial ligada', LigadoDesligado, ReadAndWrite>,
    Param<'Reversao de impressao via serial ligada', LigadoDesligado, ReadAndWrite>,
    Param<'Zero Index habilitado p/ protecao', LigadoDesligado, ReadAndWrite>,
    Param<'Zero Index habilitado p/ correcao', LigadoDesligado, ReadAndWrite>,
    Param<'Reducao do nivel de corrente em repouso', LigadoDesligado, ReadAndWrite>,
    Param<'Modo continuo/passo a passo', ContinuoPassoAPasso, ReadAndWrite>,
    Param<'Retardo para o sinal de impressao', Time, ReadAndWrite>,
    //Param<'Divisor programado do taco', undefined, ReadAndWrite>,
    //Param<'Vago', unknown>,
    //----
    Param<'Tolerancia de Erro do zero index', Pulses, ReadAndWrite>,
    Param<'Numero de pulsos por volta do motor', Pulses, ReadAndWrite>,
    Param<'Valor programado da referencia', Pulses, ReadAndWrite>,
    Param<'Aceleracao de referencia', Pulses, ReadAndWrite>,
    Param<'Velocidade de referencia', Pulses, ReadAndWrite>,
    // X+0x30 = Flag especial de intertravamento
    Param<'Saida de start passo a passo', LigadoDesligado, ReadAndWrite>,
    Param<'Start automatico passo a passo', LigadoDesligado, ReadAndWrite>,
    Param<'Selecao de mensagem por multipla', LigadoDesligado, ReadAndWrite>,
    Param<'Selecao de mensagem por impres�o', LigadoDesligado, ReadAndWrite>,
    Param<'Selecao de mensagem pela paralela', LigadoDesligado, ReadAndWrite>,
    Param<'Selecao de mensagem Decrementado no retorno', LigadoDesligado, ReadAndWrite>,
    // ------
    //Param<'Divisor programado do motor', Pulses, ReadAndWrite>,

    // ---- Fim dos dados do usuario ---------
]


export type Driver = readonly [
        ...ParamsUsuario,
    
        // Controle via serial
        Param<'Start serial', SetarRessetar, WriteOnly>,
        Param<'Stop serial', SetarRessetar, WriteOnly>,
        Param<'Pausa serial', SetarRessetar, WriteOnly >,
        Param<'Modo manual serial', SetarRessetar, WriteOnly>,
        Param<'Teste de impressao serial', SetarRessetar, WriteOnly>,
        Param<'Usado na bahia sul, descrito na rotina LEITOK', SetarRessetar, Blocked>,
        Param<'Grava eprom2', SetarRessetar, WriteOnly>,
        //Param<'vago', unknown>,  
        // ----------
    
        // O Programa salva nesta variavel a diferenca
        // entre a saida do fc- e o primeiro giro do zindex
        Param<'Diferenca entre saida do FC- e o primeiro giro do zindex', Pulses, ReadOnly>,
        //
        Param<'Valor anterior da porta C', Uint16, ReadOnly>,
    
        // 0x37 = Flag de uso geral
        Param<'Finalizacao da referencia', VerdadeiroFalso, ReadOnly>,
        Param<'Bit de valor do zero index invalido', VerdadeiroFalso, ReadOnly>,
        Param<'Start automatico pendente', VerdadeiroFalso, ReadOnly>,
        Param<'Start entre eixo pendente', VerdadeiroFalso, ReadOnly>,
        //;D3	Solicitacao de reversao de mensagem via serial
        //;D4	Utilizado no iclude DOMINIC para inicializar a impressora e
        Param<'Acesso a eprom via serial', VerdadeiroFalso, ReadOnly>,
        Param<'Gravacao de bloco na eprom2 em andamento', VerdadeiroFalso, ReadOnly>,
        Param<'Gravacao da eprom2 em andamento', VerdadeiroFalso, ReadOnly>,
 
        //0x39 = Nivel dos sinais de fc-/fc+/ref/zindex
        Param<'Nivel: H/F', LigadoDesligado, ReadOnly>,
        Param<'Nivel: Nmotor', LigadoDesligado, ReadOnly>,
        Param<'Nivel: FC+', LigadoDesligado, ReadOnly>,
        Param<'Nivel: Dmotor', LigadoDesligado, ReadOnly>,
        Param<'Nivel: CKmotor', LigadoDesligado, ReadOnly>,
        Param<'Nivel: FC-', LigadoDesligado, ReadOnly>,
        Param<'Nivel: REF', LigadoDesligado, ReadOnly>,
        Param<'Nivel: Emotor', LigadoDesligado, ReadOnly>,
]



export const Driver: Driver = [
    // ---- Inicio dos dados do usuario ---------
    {
        name: 'Posicao inicial',
        waddr: X+0x00,
        accessMode: 'RW',
    },
    {
        name: 'Posicao final',
        waddr: X+0x02,
        accessMode: 'RW',
    },
    {
        name: 'Aceleracao de avanco',
        waddr: X+0x04,
        accessMode: 'RW',
    },
    {
        name: 'Aceleracao de retorno',
        waddr: X+0x06,
        accessMode: 'RW',
    },
    {
        name: 'Velocidade de avanco',
        waddr: X+0x08,
        accessMode: 'RW',
    },
    {
        name: 'Velocidade de retorno',
        waddr: X+0x0A,
        accessMode: 'RW',
    },
    {
        name: 'Numero de mensagem no avanco',
        waddr: X+0xC,
        startBit: 0,
        bitLen: 8,
        accessMode: 'RW',
    },
    {
        name: 'Numero de mensagem no retorno',
        waddr: X+0xC,
        startBit: 8,
        bitLen: 8,
        accessMode: 'RW',
    },
    {
        name: 'Posicao da primeira impressao no avanco',
        waddr: X+0x0E,
        accessMode: 'RW',
    },
    {
        name: 'Posicao da primeira impressao no retorno',
        waddr: X+0x10,
        accessMode: 'RW',
    },
    {
        name: 'Posicao da ultima mensagem no avanco',
        waddr: X+0x12,
        accessMode: 'RW',
    },
    {
        name: 'Posicao da ultima mensagem no retorno',
        waddr: X+0x14,
        accessMode: 'RW',
    },
    {
        name: 'Largura do sinal de impressao',
        waddr: X+0x16,
        accessMode: 'RW',
    },
    {
        name: 'Tempo para o start automatico',
        waddr: X+0x18,
        accessMode: 'RW',
    },
    {
        name: 'Tempo para o start externo',
        waddr: X+0x1A,
        accessMode: 'RW',
    },
    {
        name: 'Cota de antecipacao do start entre eixos (pinelmatico)',
        waddr: X+0x1C,
        accessMode: 'RW',
    },
    {
        name: 'Retardo para o start automatico passo a passo',
        waddr: X+0x1E,
        accessMode: 'RW',
    },
    // X+0x20 = Flag de configuracao da programacao
    {
        name: 'Start automatico no avanco ligado',
        waddr: X+0x20,
        startBit: 0,
        bitLen: 1,
        accessMode: 'RW',
    },
    {
        name: 'Start automatico no retorno ligado',
        waddr: X+0x20,
        startBit: 1,
        bitLen: 1,
        accessMode: 'RW',
    },
    {
        name: 'Saida de start no avanco ligado',
        waddr: X+0x20,
        startBit: 2,
        bitLen: 1,
        accessMode: 'RW',
    },
    {
        name: 'Saida de start no retorno ligado',
        waddr: X+0x20,
        startBit: 3,
        bitLen: 1,
        accessMode: 'RW',
    },
    {
        name: 'Start externo habilitado',
        waddr: X+0x20,
        startBit: 4,
        bitLen: 1,
        accessMode: 'RW',
    },
    {
        name: 'Logica do start externo',
        waddr: X+0x20,
        startBit: 5,
        bitLen: 1,
        accessMode: 'RW',
    },
    {
        name: 'Entrada de start entre eixo habilitado',
        waddr: X+0x20,
        startBit: 6,
        bitLen: 1,
        accessMode: 'RW',
    },
    {
        name: 'Start externo para referenciar habilitado',
        waddr: X+0x20,
        startBit: 7,
        bitLen: 1,
        accessMode: 'RW',
    },
    // X+0x21 = Flag de configuracao da programacao
    {
        name: 'Logica do sinal de impressao',
        waddr: X+0x20,
        startBit: 8,
        bitLen: 1,
        accessMode: 'RW',
    },
    {
        name: 'Logica do sinal de reversao',
        waddr: X+0x20,
        startBit: 9,
        bitLen: 1,
        accessMode: 'RW',
    },
    {
        name: 'Selecao de impressao via serial ligada',
        waddr: X+0x20,
        startBit: 10,
        bitLen: 1,
        accessMode: 'RW',
    },
    {
        name: 'Reversao de impressao via serial ligada',
        waddr: X+0x20,
        startBit: 11,
        bitLen: 1,
        accessMode: 'RW',
    },
    {
        name: 'Zero Index habilitado p/ protecao',
        waddr: X+0x20,
        startBit: 12,
        bitLen: 1,
        accessMode: 'RW',
    },
    {
        name: 'Zero Index habilitado p/ correcao',
        waddr: X+0x20,
        startBit: 13,
        bitLen: 1,
        accessMode: 'RW',
    },
    {
        name: 'Reducao do nivel de corrente em repouso',
        waddr: X+0x20,
        startBit: 14,
        bitLen: 1,
        accessMode: 'RW',
    },
    {
        name: 'Modo continuo/passo a passo',
        waddr: X+0x20,
        startBit: 15,
        bitLen: 1,
        accessMode: 'RW',
    },
    // ---------------
    {
        name: 'Retardo para o sinal de impressao',
        waddr: X+0x22,
        accessMode: 'RW',
    },

    /*{
        name: 'Divisor programado do taco',
        waddr: X+0x24,
        accessMode: 'RW',
    },*/
    //{
    //    name: 'Vago',
    //    waddr: X+0x25,
    //},
    {
        name: 'Tolerancia de Erro do zero index',
        waddr: X+0x26,
        accessMode: 'RW',
    },
    {
        name: 'Numero de pulsos por volta do motor',
        waddr: X+0x28,
        accessMode: 'RW',
    },
    {
        name: 'Valor programado da referencia',
        waddr: X+0x2A,
        accessMode: 'RW',
    },
    {
        name: 'Aceleracao de referencia',
        waddr: X+0x2C,
        accessMode: 'RW',
    },
    {
        name: 'Velocidade de referencia',
        waddr: X+0x2A, //2E
        accessMode: 'RW',
    },
    // X+0x30 = Flag especial de intertravamento
    {
        name: 'Saida de start passo a passo',
        waddr: X+0x30,
        startBit: 0,
        bitLen: 1,
        accessMode: 'RW',
    },
    {
        name: 'Start automatico passo a passo',
        waddr: X+0x30,
        startBit: 1,
        bitLen: 1,
        accessMode: 'RW',
    },
    {
        name: 'Selecao de mensagem por multipla',
        waddr: X+0x30,
        startBit: 2,
        bitLen: 1,
        accessMode: 'RW',
    },
    {
        name: 'Selecao de mensagem por impres�o',
        waddr: X+0x30,
        startBit: 3,
        bitLen: 1,
        accessMode: 'RW',
    },
    {
        name: 'Selecao de mensagem pela paralela',
        waddr: X+0x30,
        startBit: 4,
        bitLen: 1,
        accessMode: 'RW',
    },
    {
        name: 'Selecao de mensagem Decrementado no retorno',
        waddr: X+0x30,
        startBit: 5,
        bitLen: 1,
        accessMode: 'RW',
    },
    // ------
    /*{
        name: 'Divisor programado do motor',
        waddr: X+0x31,
        accessMode: 'RW',
    },*/
    // ---- Fim dos dados do usuario ---------

    // Controle via serial
    {
        name: 'Start serial',
        waddr: X+0x32,
        startBit: 0,
        bitLen: 1,
        accessMode: 'Wo',
    },
    {
        name: 'Stop serial',
        waddr: X+0x32,
        startBit: 1,
        bitLen: 1,
        accessMode: 'Wo',
    },
    {
        name: 'Pausa serial',
        waddr: X+0x32,
        startBit: 2,
        bitLen: 1,
        accessMode: 'Wo',
    },
    {
        name: 'Modo manual serial',
        waddr: X+0x32,
        startBit: 3,
        bitLen: 1,
        accessMode: 'Wo',
    },
    {
        name: 'Teste de impressao serial',
        waddr: X+0x32,
        startBit: 4,
        bitLen: 1,
        accessMode: 'Wo',
    },
    {
        name: 'Usado na bahia sul, descrito na rotina LEITOK',
        waddr: X+0x32,
        startBit: 5,
        bitLen: 1,
        accessMode: 'Blocked',
    },
    {
        name: 'Grava eprom2',
        waddr: X+0x32,
        startBit: 6,
        bitLen: 1,
        accessMode: 'Wo',
    },
    //{
    //    name: 'vago',
    //    waddr: X+0x32,
    //    startBit: 7,
    //    bitLen: 1,
    //},

    // ----------

    // O Programa salva nesta variavel a diferenca
    // entre a saida do fc- e o primeiro giro do zindex
    {
        name: 'Diferenca entre saida do FC- e o primeiro giro do zindex',
        waddr: X+0x34,
        accessMode: 'Ro',
    },
    {
        name: 'Valor anterior da porta C',
        waddr: X+0x36,
        startBit: 0,
        bitLen: 8,
        accessMode: 'Ro',
    },

    // 0x37 = Flag de uso geral
    {
        name: 'Finalizacao da referencia',
        waddr: X+0x36,
        startBit: 8,
        bitLen: 1,
        accessMode: 'Ro',
    },
    {
        name: 'Bit de valor do zero index invalido',
        waddr: X+0x36,
        startBit: 9,
        bitLen: 1,
        accessMode: 'Ro',
    },
    {
        name: 'Start automatico pendente',
        waddr: X+0x36,
        startBit: 10,
        bitLen: 1,
        accessMode: 'Ro',
    },
    {
        name: 'Start entre eixo pendente',
        waddr: X+0x36,
        startBit: 11,
        bitLen: 1,
        accessMode: 'Ro',
    },
    //;D3	Solicitacao de reversao de mensagem via serial
	//;D4	Utilizado no iclude DOMINIC para inicializar a impressora e
	{
        name: 'Acesso a eprom via serial',
        waddr: X+0x36,
        startBit: 13,
        bitLen: 1,
        accessMode: 'Ro',
    },
    {
        name: 'Gravacao de bloco na eprom2 em andamento',
        waddr: X+0x36,
        startBit: 14,
        bitLen: 1,
        accessMode: 'Ro',
    },
    {
        name: 'Gravacao da eprom2 em andamento',
        waddr: X+0x36,
        startBit: 15,
        bitLen: 1,
        accessMode: 'Ro',
    },

    //0x39 = Nivel dos sinais de fc-/fc+/ref/zindex
    {
        name: 'Nivel: H/F',
        waddr: X+0x38,
        startBit: 8,
        bitLen: 1,
        accessMode: 'Ro',
    },
    {
        name: 'Nivel: Nmotor',
        waddr: X+0x38,
        startBit: 9,
        bitLen: 1,
        accessMode: 'Ro',
    },
    {
        name: 'Nivel: FC+',
        waddr: X+0x38,
        startBit: 10,
        bitLen: 1,
        accessMode: 'Ro',
    },
    {
        name: 'Nivel: Dmotor',
        waddr: X+0x38,
        startBit: 11,
        bitLen: 1,
        accessMode: 'Ro',
    },
    {
        name: 'Nivel: CKmotor',
        waddr: X+0x38,
        startBit: 12,
        bitLen: 1,
        accessMode: 'Ro',
    },
    {
        name: 'Nivel: FC-',
        waddr: X+0x38,
        startBit: 13,
        bitLen: 1,
        accessMode: 'Ro',
    },
    {
        name: 'Nivel: REF',
        waddr: X+0x38,
        startBit: 14,
        bitLen: 1,
        accessMode: 'Ro',
    },
    {
        name: 'Nivel: Emotor',
        waddr: X+0x38,
        startBit: 15,
        bitLen: 1,
        accessMode: 'Ro',
    },

]

// helpers
type Extract_<T, U> = T extends T ? T extends U ? T : never : never
export type HyperDriver<N extends string = string, T extends unknown = unknown, A extends AccessMode = AccessMode> = readonly (Param<N,T,A>)[]

export type GetTypeFromName<D extends HyperDriver, N extends string> = D extends HyperDriver<N, infer R> ? R : never

export type GetAllParams<D extends HyperDriver> = D[number]
export type GetAllNames<D extends HyperDriver> = D[number] extends Param<infer N, any> ? N : never 
export type GetParamFromName<D extends HyperDriver, N extends GetAllNames<D>> = Extract_<D[number], { name: N }>
export type GetCastFromName<D extends HyperDriver, N extends GetAllNames<D>> = GetParamFromName<D,N>['cast']

export type GetAccessModeFromName<D extends HyperDriver, N extends GetAllNames<D>> = GetParamFromName<D,N>['accessMode']


type T00 = GetAllParams<Driver>
type T01 = GetAllNames<Driver>
type T02 = GetParamFromName<Driver,'Posicao final' | 'Posicao inicial'>
type T03 = GetAccessModeFromName<Driver, 'Start serial'>
type T04 = GetCastFromName<Driver, 'Posicao inicial'>



