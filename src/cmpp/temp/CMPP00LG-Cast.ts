import { Duration } from "../../core/time"


type AbsolutePosition = undefined
type Acceleration = undefined
type Velocity = undefined
type NaturalNumber = undefined
//type Duration = undefined
type Displacement = undefined
type PortLogic = undefined
type Uint16_t = undefined

type CMPP00LGCast = {
    'Posicao inicial': AbsolutePosition
    'Posicao final': AbsolutePosition
    'Aceleracao de avanco': Acceleration
    'Aceleracao de retorno': Acceleration
    'Velocidade de avanco': Velocity
    'Velocidade de retorno': Velocity
    'Numero de mensagem no avanco': NaturalNumber
    'Numero de mensagem no retorno': NaturalNumber
    'Posicao da primeira impressao no avanco': AbsolutePosition
    'Posicao da primeira impressao no retorno': AbsolutePosition
    'Posicao da ultima impressao no avanco': AbsolutePosition
    'Posicao da ultima impressao no retorno': AbsolutePosition
    'Largura do sinal de impressao': Duration
    'Tempo para o start automatico': Duration
    'Tempo para o start externo': Duration
    'Cota de antecipacao do start entre eixos (pinelmatico)': Displacement
    'Retardo para o start automatico passo a passo': Duration
    'Start automatico no avanco ligado': boolean
    'Start automatico no retorno ligado': boolean
    'Saida de start no avanco ligado': boolean
    'Saida de start no retorno ligado': boolean
    'Start externo habilitado': boolean
    'Logica do start externo': PortLogic
    'Entrada de start entre eixo habilitado': boolean
    'Start externo para referenciar habilitado': boolean
    'Logica do sinal de impressao': PortLogic
    'Logica do sinal de reversao': PortLogic
    'Selecao de impressao via serial ligada': boolean
    'Reversao de impressao via serial ligada': boolean
    'Zero Index habilitado p/ correcao': boolean
    'Reducao do nivel de corrente em repouso': boolean
    'Modo continuo/passo a passo': boolean
    'Retardo para o sinal de impressao': boolean
    'Tolerancia de Erro do zero index': boolean
    'Numero de pulsos por volta do motor': 200 | 400
    'Valor programado da referencia': AbsolutePosition
    'Aceleracao de referencia': Acceleration
    'Velocidade de referencia': Velocity
    'Saida de start passo a passo': boolean
    'Start automatico passo a passo': boolean
    'Selecao de mensagem por multipla': boolean
    'Selecao de mensagem por impressao': boolean
    'Selecao de mensagem pela paralela': boolean
    'Selecao de mensagem decrementado no retorno': boolean
    'Start serial': boolean
    'Stop serial': boolean
    'Pausa serial': boolean
    'Modo manual serial': boolean
    'Teste de impressao serial': boolean
    'Usado na bahia sul, descrito na rotina LEITOK': boolean
    'Grava eprom2': boolean
    'Diferenca entre saida do FC- e o primeiro giro do zIndex': Displacement
    'Valor anterior da porta C': Uint16_t
    'Finalizacao da referencia': boolean
    'Bit de valor do zero index invalido': boolean
    'Start automatico pendente': boolean
    'Start entre eixo pendente': boolean
    'Acesso a eprom via serial': boolean
    'Gravacao de bloco na eprom2 em andamento': boolean
    'Gravacao da eprom2 em andamento': boolean
    'Nivel: H/F': boolean
    'Nivel: Nmotor': boolean
    'Nivel: FC+': boolean
    'Nivel: Dmotor': boolean
    'Nivel: CKmotor': boolean
    'Nivel: FC-': boolean
    'Nivel: Ref': boolean
    'Nivel: Emotor': boolean

}
