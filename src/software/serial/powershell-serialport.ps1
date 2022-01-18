# fiz alguns experimentos para manipular a serial-port pelo Powershell, parece facil.
# nao funcionou de primeira, mas também eu estava com pressa
# estou deixando o codigo aqui para poder prosseguir futuramente
# se eu puder usar o powershell para controlar a serial, em teoria posso migrar o backend de Node para Deno.

# O PROBLEMA que eu tive neste primeiro ensaio foi nao conseguir ler nenhuma resposta.

# talvez os bytes desta msg esteja incorreta, mas o casting esta correto
[byte[]]$message = ( 0x1B, 0x02, 0x01, 0x81, 0x32, 0x33, 0x1B, 0x03, 0x14 )

# abre a porta
$port= new-Object System.IO.Ports.SerialPort COM50,9600,None,8,one

# escreve nela
$port.write($message)

#configura o timeout de leitura (verificar se o tipo é milisecs ou secs)
$port.ReadTimeout= 2000

#le byte
# existem varios metodos de leitura sincrona e da pra ler assincrono via evento.
$port.ReadByte()