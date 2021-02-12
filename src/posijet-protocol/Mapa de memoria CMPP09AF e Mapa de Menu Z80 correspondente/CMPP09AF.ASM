;////////////////////////////////////////////////////////////////////////////////
; - Falta definir qual include será usado no lugar de serial39.bib para que	/
; se tenha um protocolo que receba e transmita varios bytes por pacote sendo	/
; duas opcoes Protoc16.bib usado na pananbra ou ProtocZ8.bib usado na placa	/
; do motor da hitachi.								/
;////////////////////////////////////////////////////////////////////////////////
; 		Otimizacao da rotina IntTmp					/
;-------------------------------------------------------------------------------/
; - Otimizado a leitura do giro de uma instruçao e um ciclo.			/
; - Otimisado em 2 instrucão e 1 ou 2 ciclo no decremento de PaTua.		/
; - Otimisado em 1 instrucão e 1 ciclo no incremento de PaTua.			/
; - Elimidado o trexo apartir de ZINDE2 que é apenas um teste muito antigo e	/
; nao sei o objetivo, mas so salva a leitura do giro em TSTINDX que não é	/
; utilizada para nada. (eliminado 23 Word e 10/20 ciclos)			/
; - A rotina ZindexP e ZindexN que utilizada o registro ItmpL sujando PatuaL	/
; passou a utilizar o registro ZL que estava disponivel e substituido as 2	/
; instrução COM e ANDI $15 por CPI $15 que tem o mesmo efeito no flag de zero	/
; (eliminado 6 Word e 3	 ciclos).						/
; - Eliminado as instruções "sbic pPrtRv,5" e "sbic PORTC,4" desnecessaria do	/
; inicio da rotina INTTMP (elimidado 2 Word e 2 ciclos)				/
; - Na rotina Ntimer foi eliminado a troca da interrupção do comparador1A pela	/
; interrupcao de overflow quando OCR1A=0 pois acreditava que não ocorria a	/
; interrupção de comparação (elimidado 6 Word e 3/5 ciclos).			/
; - O mesmo foi feito apos IntTm3 para o comparador1B (elimidado 4 Word e	/
; 2/4 ciclos)									/
; - Como a escrita do par OCR1AH:L e OCR1BH:Lnão não é simultanea como eu	/
; acreditava, pode ocorrer uma interrupçao acidental, portanto foi acrescentado	/
; 2 intruções para reseta-la (Foi apenas reposicionado as intruçoes ja		/
; existente).									/
; - Foi colocado nos finais da rotina IntTmp um trexo para testar OverRum	/
; interrupção do comparadorA (Acrescentado 2*6 Word e 8/4 ciclos).		/
; - Total (elimidado 30 Word e 29/17 ciclos)					/
;-------------------------------------------------------------------------------/
; - Testando a novas rotinas de emulação serial que é menor e mais rapida para	/
; poder colocar 2 serial emulada.						/
; 2*LerSer=90/36 contra RDUART=81/15 e 2*EscSe=50/20 contra WRUART=44/11.	/
; - Teremos só 15/20 ciclos adicionais com a implantacao de 2 seriais.		/
;////////////////////////////////////////////////////////////////////////////////
;
;////////////////////////////////////////////////////////////////////////////////
; 			Copia do software cmpp07AC				/
;				Em Teste					/
;////////////////////////////////////////////////////////////////////////////////
;			Erros a ser concertados					/
; - Modo continuo aparentemente OK						/
; - No modo passo a passo mesmo desligango o start automatico no avanco ele	/
; permanece.									/
; - Mas quando a primeira mensagem do avanco = posicao inicial o sinal de	/
; impressao ocorre apos a contagem do start automatico normalmente mas o eixo	/
; nao sai.									/
; - Mas quando a "primeira mensagem do avanco = posicao inicial" ou a "ultima	/
; mensagem do avanco = posicao apos o sinal de start estando na posicao inicial	/
; ou final ocorre o sinal de impressao normal mas o eixo nao starta. Para	/
; startar precisa de 3 start, 1 para inverter a direcao 1 para imprimir e o	/
; terceiro para start propriamente.						/
;////////////////////////////////////////////////////////////////////////////////
; 			Copia do software cmpp04NI				/
;-------------------------------------------------------------------------------/
; - Modificacoes feito em CALCPE no modo passo a passo:				/
; - No final ou Durante o movimento será fornecido um sinal de impressao e um	/
; sinal de start entre eixo, quando a posicao executada for umas das posicoes	/
; de mensagem, ou seja nas posicacao inicial ou final só será fornecido este	/
; sinal se eles forem iguais a posicao da primeira ou ultima mensagem do avanco	/
; respectivamente, tambem é valido a mesma regra para o retorno.		/
; - Quando se receber um sinal de start para o inicio de um movimento e a	/
; posicao inicial for igual a primeira mensagem do avanco ou a posicao final	/
; for igual a primeira do mensagem do retorno, nao havera movimento imediato,	/
; mas será fornecido um sinal de impressao e um sinal de start entre eixo, mas	/
; se a entrada de start entre eixos estiver desabilitada tambem teremos um	/
; start entre eixo interno com retardo.						/
;-------------------------------------------------------------------------------/
;/////////////////////////////////////////////////////////////////////////////
; - Conferir rp14= Primeira impressao programada e rp18=Ultima impressao
; programada na chamada da rotina PULAQ0 em DIRNEG e DIRPOS.
;/////////////////////////////////////////////////////////////////////////////
; - Os parametros do start automatico do avanco/retorno estao aparentemente
; funcionando ao contrario.
; - No modo passo a passo, quando os numeros de mensagens do avanco/retorno
; sao diferente e' identificado o erro 71 no retorno, retornando para a posicao
; inicial sem as paradas programadas.
; - O retardo do start automatico deve ser maior que o retardo da impressao
; + 2* a largura de impressao para que ocorra tambem um sinal de impressao na
; saida do movimento.
; - Se o numero de impressao for zero em nenhuma hipotese deve se ter impressao
; na da saida do movimento da direcao correspondente.
;/////////////////////////////////////////////////////////////////////////////
;	Falta testar as combinacoes de numero de avanco e retorno 1,0 0,1 e 0,0
;	Falta verificar se as posicao inicial = posicao final ou as posicoes
; entre uma mensagem e a outra forem iguais os sinais de impressao os start
; entre eixo permanecer funcionando.
;	Esta dando conflito no sinal de reverso quando o sinal de impressao da
; saida do movimento esta terminando quando ja em movimento.
;
;	Com numero dem mensagem no avanco =2 e numero de mensagem no retorno =1
; nao ouve sinal de impressao e nem start automatico ao retornar a posicao
; inicial
;	A rotina INVMEN esta errada por considerar a posicao de execucao como
; ja executada e estando em movimento, ela nao informa corretamente a direcao
; do movimento. Se em movimento deveria adotar a direcao como referencia.
;/////////////////////////////////////////////////////////////////////////////
;
; -	A rotina do pistao esta atualizando o tempo todo o retardo de
; impressao e do start entre eixo enqunto o motor estiver andando.
; -	Corrigido o erro do sinal do numero da mensagem corrente que foi
; decrementada e nao somente comparada a 4 linha apos CALCPA e a 8 linhas
; foi salva.
;-	Em calcp7 foi acresentada o erro em caso de estar acima da posicao
; final.
;-	Concertar o erro no calculo do primeiro movimento do retorno
; PI=0300 PF=0500 NA=3 NR=3 PEXEC passou de 0500 para PEXEC=0700
; Numero da mensagem corrente passou de 02 para 01
;	A definicao do numero de menssagem na rotina REFER esta desnecessaria
; pois tambem esta na rotina VRFREF. Tambem a chamada de  de INVMEX deve ser
; passada para a rotina VRFREF.
;************************************************************************
;	Resultante dos software CMPP00M1.ASM				*
;	Corrigido o erro da largura do sinal de impressao para valores	*
; maior que 255inttmp ou 249mseg.					*
;	O sinal Porta,5 e' copia do sinal de impressao para o dosador	*
;	Ajustado o numero de mensagem corrente apos a busca da		*
; referencia.								*
;	A a selecao de mensagem so' sera' ativado se tiver mudanca no	*
; numero de mensagem corrente.						*
;	Alterado a rotina FIMMOV para facilitar o entendimento, mas	*
; mantido a logica exatamente igual.					*
;	Concertado o erro que ocorria, apos a busca da referencia o	*
; start automatico ja era obedecido para o start do primeiro movimento.	*
;	A rotina INVMEN foi modificada para que o sinal de reverso	*
; funcione tambem no modo passo a passo.				*
; 	Foi bloqueada a chamada da rotina ENVIMPRES na rotina SELMEN	*
; pois a rotina de selecao desse include esta sendo por direcao, que ja	*
; esta sendo executado pela rotina INVMEN na chamada de ENVIMPRES. 	*
;	O enderecamento da eprom dos parametros de configuracao foi	*
; modificado por isso foi modificado a rotina WRITEP e INIPRG em 	*
; relacao a sequencia de leitura e gravacao da eprom que foi		*
; simplificada								*
;	Foi eliminado a rotina INIMOD  chamada por VRFREF pos o acerto	*
; do numero da mensagem corronte ja estava sendo feito na rotina REFER	*
; no. Foi acresentado na rotina VRFREF o acerto da nova direcao		*
; 	Deve definir se a selecao e reversao de mensagem serao		*
; controlada por posicao ou direcao, para isto deve se definir 2 bits	*
; de controle um para a selecao e outra para o reverso.			*
;	Deve se padronizar NUMMEN (numero de mensasem corrente) do modo	*
; continuo para que funcione igual ao modo passo a passo		*
;************************************************************************
.include "..\appnotes\m8515def.inc"
.include "..\BIBN\macroW4.mac"
.include "..\BIB\fifo1.mac"
.include "..\BIBN\posijet2.mac"
;
	;****************************************************************
	;*		Definicao das variaveis				*
	;****************************************************************
	;***** Konstantes do programa
.equ	RAMINT	=$60		;Endereco dos parametros de interrupcao
.equ	RAMPRG	=$A0		;Endereco dos parametros do programa
.equ	kpresc	=1		;Valor minimo do divisor da frequenca base
.equ	Fclock	=8000000	;Frequencia de clock do processador
.equ	Ftimer	=Fclock/1024	;Frequencia do timer 1024 ciclos por segundos
.equ	esc	=$1B		;Tecla esc
.equ	CNTgEPL	=$E0		;Contador low do gravador da eemprom
.equ	CNTgEPH	=$E1		;Contador hight do gravador da eemprom
.equ	BAUD1	=9600	;Taxa de comunicacao da com1
.equ	PONCOM1	=$100	;Endereco do ponteiro da com1
;
;************************************************************************
;			Variaveis de execucao (Index Y)			*
;************************************************************************
.equ	PatuaL	=$00	;Posicao atual
.equ	PatuaH	=$01
.equ	PexecL	=$02	;Posicao de execucao
.equ	PexecH	=$03
.equ	PrampL	=$04	;Posicao do inicio da rampa
.equ	PrampH	=$05
.equ	VmaxL	=$06	;Velocidade maxima
.equ	VmaxH	=$07
.equ	VminL	=$08	;Velocidade minima
.equ	VminH	=$09
.equ	VincL	=$0A	;Incremento de Velocidade
.equ	VincH	=$0B
.equ	velatuF	=$0C	;Velocidade atual (3 byte)
.equ	velatuL	=$0D
.equ	velatuH	=$0E
.equ	iMensag	=$0F	;Numero da proxima mensagem a ser impressa
;.equ	Fbase0	=$10	;(LSB) Frequencia base
;.equ	Fbase1	=$11
;.equ	Fbase2	=$12	;(MSB) Frequencia base (3 byte)
.equ	FLGpis	=$13	;Flag do pistao
	.equ	AntecipOk =7	;Indica que ja passou pela posição de antecipação
	.equ	ImpressOk =6	;Indica que a posição atual é uma Posição de impressão
.equ	FmaxL	=$14	;Velocidade limite superior, constante do sistema
.equ	FmaxH	=$15
.equ	FminL	=$16	;Velocidade limite inferior, constante do sistema
.equ	FminH	=$17
.equ	tmpsysL	=$18	;Contador do tempo do sistema
.equ	tmpsysH	=$19
.equ	ndivL	=$1A	;Novo divisor do contador para o comparador A
.equ	ndivH	=$1B
.equ	cntprtL	=$1C	;Contador da Largura do sinal de impressao
.equ	cntprtH	=$1D
.equ	PindeL	=$1E	;Posicao do zero index
.equ	PindeH	=$1F
.equ	prtL	=$20
.equ	prtH	=$21
.equ	SobraIntTmpL	=$22	;Menor tempo de sobra da rotina intTmp
.equ	SobraIntTmpH	=$23	;Menor tempo de sobra da rotina intTmp
;.equ	Vago1	=$22	;Vago
;.equ	Vago2	=$23	;Vago
;.equ	pasprtF	=$24	;Passo do sinal de impressao (3 byte)
;.equ	pasprtL	=$25
;.equ	pasprtH	=$26
.equ	NUMmenA	=$27	;Ultimo valor do numero de mensagem a ser impressa
.equ	nummen	=$28	;Numero de mensagem a ser impressa
.equ	Vmotor	=$29	;Valor do divisor do motor
.equ	masceL	=$2A	;Mascara de erro byte low
	.Equ	eSinStaV =0 	;Sinal de start, velocidade
	.Equ	eSinStaO =1	;Sinal de start/outro
	.Equ	eSinIndx2=2	;Sinal do zero index
	.Equ	eSinIndx3=3	;Sinal do zero index
	.Equ	eSinImpr =4	;Sinal de impressao
	.Equ	eSerCom1 =5	;Erro na com1  (Valido somente com o include "..\BIBN\CODEBOX8.bib")
	.equ	eMudPar	=6 ;Mudanca de parametros no instante errado
	;D7: Erro de parametros de movimento passo a passo
.equ	masceH	=$2B			;byte high
	;D0: Nao usado			D1: Nao usado
	;D2: Nao usado			D3: Nao usado
	;D4: Nao usado			D5: Nao usado
	;D6: Nao usado			D7: Nao usado
.equ	cntstaL	=$2C	;Contador da do sinal do start externo
.equ	cntstaH	=$2D
.equ	cntautL	=$2E	;Contador do sinal do start automatico
.equ	cntautH	=$2F
.equ	PORTCX	=$30
.equ	PORTCY	=$31
.equ	StatusL	=$32	;Flag de status
	.equ	ReferenciaOk	=0	;Referenciado
	.equ	PosExecutada	=1	;Posicao Executada (Só esta como variavel no .include "..\BIBN\serial38.bib")
	.equ	Referenciando	=2	;Referenciando
	.equ	sttDirPos	=3	;Direcao do movimento
	.equ	sttAceler	=4	;Aceleracao ligada
	.equ	sttDesacel	=5	;Desaceleracao ligada
	;bit6: Nao usado
	.equ	sttErro		=7	;Indicacao de erro
.equ	StatusH	=$33	;Flag de status
.equ	ErroSys =$34	;Byte com o cod. de erro
.equ	tstindL	=$36	;So'para teste do zero index ???###???
.equ	tstindH	=$37	;So'para teste do zero index ???###???
;.equ	tstindX	=$38	;So'para teste do zero index ???###???
.equ	flagZ	=$39	;Flags do sinal do zero index
.equ	tmpintL	=$3A	;So'para teste de overrun da interrupcao ???###???
.equ	tmpintH	=$3B	;So'para teste de overrun da interrupcao ???###???
.equ	FlgStaX	=$3C	;Flags do sinal do start esterno
	;FlgStaX,7	= Valor do sinal de start anterior
	;FlgStaX,6	= Nao usado
	;FlgStaX,5	= Nao usado
	;FlgStaX,4	= Indica que o start foi entre eixos
	;FlgStaX,3,2,1,0	= Contador de leitura do start
.equ	FlgStaY	=$3D	;Flags do sinal do start do eixo Y
	;FlgStaY,0,1,2,3,7 igual a flags
	;FlgStaY,4	= Sinal de start entre eixo
	;FlgStaY,5	= Indica saida de start entre eixo em andamento
	;FlgStaY,6	= Indica que a saida do start entre eixo e' esterno
	;
;.equ	cntstYL	=$3E	;Contador do sinal do start externo
;.equ	cntstYH	=$3F
	;
	;
;************************************************************************
;			Parametros do programa (Index Z)		*
;************************************************************************
.equ	posiniL	=$00	;Posicao inicial programada
.equ	posiniH	=$01
.equ	posfimL	=$02	;Posicao final programada
.equ	posfimH =$03				
.equ	AavanL	=$04	;Aceleracao de avanco programada
.equ	AavanH	=$05
.equ	AretoL	=$06	;Aceleracao de retorno programada
.equ	AretoH	=$07
.equ	VavanL	=$08	;Velocidade de avanco programada
.equ	VavanH	=$09
.equ	VretoL	=$0A	;Velocidade de retorno programada
.equ	VretoH	=$0B
.equ	nMenAv	=$0C	;Numero de mensagem no avanco
.equ	nMenRt	=$0D	;Numero de mensagem no retorno
.equ	pPrtAvL	=$0E	;posicao da primeira impressao no avanco
.equ	pPrtAvH	=$0F
.equ	pPrtRtL	=$10	;posicao da primeira impressao no retorno
.equ	pPrtRtH	=$11
.equ	UprtAVL	=$12	;Posicao da ultima mensagem no avanco
.equ	UprtAVH	=$13
.equ	UprtRTL	=$14	;Posicao da ultima mensagem no retorno
.equ	UprtRTH	=$15
.equ	tmpprtL	=$16	;Largura do sinal de impressao
.equ	tmpprtH	=$17
.equ	tmpautL	=$18	;Tempo para o start automatico
.equ	tmpautH	=$19
.equ	tmpextL	=$1A	;Tempo para o start externo
.equ	tmpextH	=$1B
.equ	AntcinL	=$1C	;Cota de antecipacao do start entre eixos (pinelmatico)
.equ	AntcinH	=$1D
.equ	TempPPL	=$1E	;Retardo para o start automatico passo a passo
.equ	TempPPH	=$1F
.equ	FLAGPL	=$20	;Flag de configuracao da programacao
	.equ	STAUTA	=0	;Start automatico no avanco ligado
	.equ	STAUTR	=1	;Start automatico no retorno ligado
	.equ	SSAUTA	=2	;Saida de start no avanco ligado
	.equ	SSAUTR	=3	;Saida de start no retorno ligado
	.equ	HSEXTE	=4	;Start externo habilitado ??
	.equ	LSEXTE	=5	;Logica do start externo ??
	.equ	ESENTR	=6	;Entrada de start entre eixo habilitado ??
	.equ	STAREF	=7	;Start externo para referenciar habilitado ??
.equ	FLAGPH	=$21	;Flag de configuracao da programacao
	.equ	LOGIMP	=0	;Logica do sinal de impressao
	.equ	LOGREV	=1	;Logica do sinal de reversao
	.equ	SELSER	=2	;Selecao de impressao via serial ligada
	.equ	REVSER	=3	;Reversao de impressao via serial ligada
	.equ	ZERIHP	=4	;Zero Index habilitado p/ protecao
	.equ	ZERIHC	=5	;Zero Index habilitado p/ correcao
	.equ	REDCOR	=6	;Reducao do nivel de corrente em repouso
	.equ	MODPP	=7	;Modo continuo/passo a passo
.equ	TEMPPTL	=$22	;Retardo para o sinal de impressao
.equ	TEMPPTH	=$23
.equ	Ptaco	=$24	;Divisor programado do taco
.equ	Vago1	=$25	;Vago

.equ	JanelaL	=$26	;(+/-) Tolerancia de Erro do zero index
.equ	JanelaH	=$27
.equ	npulsoL =$28	;Numero de pulsos por volta do motor
.equ	npulsoH =$29
.equ	valrefL	=$2A	;Valor programado da referencia
.equ	valrefH	=$2B
.equ	AreferL	=$2C	;Aceleracao de referencia
.equ	AreferH	=$2D
.equ	VreferL	=$2E	;Velocidade de referencia
.equ	VreferH	=$2F
.equ	FLAGPE	=$30	;Flag especial de intertravamento.
	.equ	SstaPP		=0	;Saida de start passo a passo ?
	.equ	STautPP		=1	;Start automatico passo a passo
	.equ	SelPorMul	=2	;Selecao de mensagem por multipla
	.equ	SelPorImp	=3	;Selecao de mensagem por impresão
	.equ	SelParalela	=4	;Selecao de mensagem pela paralela
	.equ	SelMenDecRet	=5	;Selecao de mensagem Decrementado no retorno
.equ	Pmotor	=$31	;Divisor programado do motor
.equ	fimprg	=FLAGPE+2	;Fim dos dados do usuario
.equ	CTRSER	=$32	;Controle via serial
	.equ	SerStart	=0	;Start serial
	.equ	SerStop		=1	;Stop serial
	.equ	SerPausa	=2	;Pausa serial
	.equ	SerManual	=3	;Modo manual serial
	.equ	SerTstImp	=4	;Teste de impressao serial
	.equ	SerLeitOkBhs	=5	;Usado na bahia sul, descrito na rotina LEITOK
	.equ	SerGrvEpr	=6	;Grava eprom2
	;		d7=??
.equ	POSINDEL =$34	;O Programa salva nesta variavel a diferenca
.equ	POSINDEH =$35	;entre a saida do fc- e o primeiro giro do zindex
;
.equ	FLAGC	=$36	;Valor anterior da porta C
.equ	FlagG	=$37	;Flag de uso geral
	.equ	FinalizRef=0	;Finalizacao da referencia
	.equ	ZerIndInv =1	;Bit de valor do zero index invalido
	.equ	StaAutPe  =2	;Start automatico pendente
	.equ	StaEntEixP=3	;Start entre eixo pendente
	;D3	Solicitacao de reversao de mensagem via serial
	;D4	Utilizado no iclude DOMINIC para inicializar a impressora e
	.equ	AcsEprSer =5	;Acesso a eprom via serial
	.equ	GrvBlkEpr =6	;Gravacao de bloco na eprom2 em andamento
	.equ	GrvEprAnd =7	;Gravacao da eprom2 em andamento
.equ	CNTPIST	=$38	;Contador do temporizador do pistao
.equ	CONFC	=$39	;Nivel dos sinais de fc-/fc+/ref/zindex
	;d0=H/F		d1=Nmotor	d2=Fc+		d3=Dmotor
	;d4=CKmotor	d5=FC-		d6=REF		d7=Emotor
.equ	iMenAv	=$3A	;Numero de mensagem no avanco
.equ	iMenRt	=$3B	;Numero de mensagem no avanco
;.equ	CNTPPL	=$3A	;Contador do retardo para o start entre eixo
;.equ	CNTPPH	=$3B
.equ	CNTPTL	=$3C	;Contador do retardo para o sinal de impressao
.equ	CNTPTH	=$3D	;Contador do retardo para o sinal de impressao
;
.equ	emg_cnt	=$3E	;carrega contador do botao de emergencia
.equ	CNTBH	=$3F	;Contador do tempo de pulso da bahia sul
;
;Parametros de configuracao da uart 2
.equ	PortRx2	=PinD	;Porta de recepcao da porta serial
.equ	PinRx2	=4	;Pino de recepcao da porta serial
.equ	PortTx2	=PortD	;Porta de transmisão da porta serial
.equ	PinTx2	=5	;Pino de transmisão da porta serial
.equ	DdrRx2	=DdrD	;Porta de configuracao da porta serial		;so para teste @@@
;.equ	OutRx2	=PortD	;Porta de saida da recepcao da porta serial	;so para teste @@@
.equ	nBitsCom2	=8	;Numero de bits (entre 6 e13)
.equ	PonUart2	=$E0	;Ponteiro da com3 com 4 bytes
.equ	PONCOM2	=$180	;Endereco do ponteiro da com2
.equ	BAUD2	=2400	;Taxa de comunicacao da com2 (se 457 z80 =252=FCh)
;
;Parametros de configuracao da uart 3
.equ	PortRx3	=PinD	;Porta de recepcao da porta serial
.equ	PinRx3	=7	;Pino de recepcao da porta serial
.equ	PortTx3	=PortD	;Porta de transmisão da porta serial
.equ	PinTx3	=6	;Pino de transmisão da porta serial
.equ	DdrRx3	=DdrD	;Porta de configuracao da porta serial		;so para teste @@@
;.equ	OutRx3	=PortD	;Porta de saida da recepcao da porta serial	;so para teste @@@
.equ	nBitsCom3	=8	;Numero de bits (entre 6 e13)
.equ	PonUart3	=$F0	;Ponteiro da com3 com 4 bytes
;
;Parametros de configuracao comuns da uart
.equ	nAmost		=6	;Numero de amostragem para cada bits (entre 3 e 15)
.equ	ShiftRxL	=0	;Registro de deslocamento de leitura low
.equ	ShiftRxH	=1	;Registro de deslocamento de leitura high
.equ	ShiftTxL	=2	;Registro de deslocamento de escrita low
.equ	ShiftTxH	=3	;Registro de deslocamento de escrita high
.Equ	DadoRxL		=4	;Dados low recebido da serial
.Equ	DadoRxH		=5	;Dados High recebido da serial
.equ	DadoTxL		=6	;Dados que atualiza o shif Register
.equ	DadoTxH		=7	;Dados que atualiza o shif Register
.equ	cntAmostraRx	=8	;Contador de amostragem de leitura
.equ	cntAmostraTx	=9	;Contador de amostragem de escrita
.equ	NumBitsSer	=10	;Numero de bits da comunicacao
.equ	SerStaStt	=11	;Status da serial do start
	.equ UltNivPinRx=0	;Ultimo nivel lido do pino de Rx (recepcao serial)
	.equ ErroEstBit =1	;Erro de estabilidade de nivel
	.equ InvalBits	=2	;Bit invalido, troca de nivel na leitura do bits
	.equ OverRunRx  =3	;Erro de overrun na recepcao
	.equ ErroFraming=4	;Erro no dados da serial
	.equ ModApsBits	=5	;Ouve modificacao de nivel apos o ultimo bit
	.equ RegTxFull	=6	;Registro de transmisao cheio
	.equ RecepcComp =RxC	;Recepção completa (Atmega8515 Rcx=7)
.equ	CntErroSer	=12	;Contador de erro de framing
.equ	VagoCom0	=13
.equ	VagoCom1	=14
.equ	VagoCom2	=15

;.equ	CntErroCom	=10	;Contador de erro de comunicação
;.equ	TempCom		=12	;Contador de tempo da serial
;.equ	TxPendencia	=13
;.equ	ValorTxL	=14	;So para Teste
;.equ	ValorTxH	=15	;So para Teste
;
	;***** Variaveis da rotina principal de interrupcao
.def	Cmotor	=r6	;Contador do motor
.def	Ctaco	=r7	;Contador do taco
.def	Vtaco	=r8	;Valor do divisor do taco
.def	CdivL	=r9	;Contador do Divisor low para o comparador A
.def	tmpax	=r10	;Registrador temporario auxiliar
.def	SSreg	=r11	;Registrador para salvar o status register
.def	VdivL	=r12	;Valor low para o contador do comparador A
.def	VdivH	=r13	;Valor hight para o contador do comparador A
.def	ItmpL	=r20	;Registrador temporario para interrupcao
.def	ItmpH	=r21	;Registrador temporario para interrupcao
.def	timerL	=r22	;Registrador low do timer
.def	timerH	=r23	;Registrador high do timer
.def	CdivH	=r24	;Contador do Divisor hight para o comparador A
.def	flagI	=r25	;Registrador de flag de controle de interrupcao
	;D0: Leitura do Zero index habilitado	D1: Ultima leitura do zero index
	;D2: Sinal de impresao habilitado	D3: Logica do sinal de impressao
	;D4: Aceleracao ligada			D5: motor ligado (13/09/99)
	;D6: Iniciado a rotina do timer		D7: Fim da rotina do timer
	;
;
	;****************************************************************
	; Redifinicao dos nomes dos registradores para que possao ser	*
	; utilizado aos pares pela macro de tratamento de word		*
	;****************************************************************
	;
.def	rp0L	=R0
.def	rp0H	=R1
.def	rp2L	=R2
.def	rp2H	=R3
.def	rp4L	=R4
.def	rp4H	=R5
.def	rp14L	=r14	;Registrador de uso geral low	=restoL
.def	rp14H	=r15	;Registrador de uso geral high	=restoH, resto8
.def	rp16L	=r16	;Registrador de uso geral low	=operadorL
.def	rp16H	=r17	;Registrador de uso geral high	=operadorH, operador8
.def	rp18L	=r18	;Registrador de uso geral low	=operandoL
.def	rp18H	=r19	;Registrador de uso geral high	=operandoH, operando8	
;
	;****************************************************************
	;	Comentarios retirado do programa principal		*
	;****************************************************************
	;
	;***** Enderecamento da porta de I/O
	;
	;Controle de linha
	;PINA,0	=TACOIN	Sinal de entrada de taco
	;PINA,1	=STOP	Sinal de entrada do stop externo
	;PINA,2	=INICIO	Sinal de start entre eixo
;OK	;PINA,3	=START	Sinal de entrada do start externo
	;PORTA,4=ERRO	Foi mensionado como saida de PA mas nunca implementado
;BAHIAS	;PORTA,5=AUXI	Saida do dosador para TECNILATEX e garagem para a BAHIA SUL
;BAHIAS	;PORTA,6=PISTAO	Era saida de Erro ma usado na Bahia Sul como OK
	;PORTA,7=EMEG	Sinal de entrada de EMERGENCIA

	;Controle da impressora
	;PINB,0 =Bysi	 Sinal de entrada que indica impressora ocupado
.EQU	pPrtRv	=PortB		;Porta do pino do print reverso
	.EQU	sInvMen	=1	;Pino de saida do print reverso
	.equ	sP3	=2	;Sinal de saida P3 para selecao de mensagem
	.equ	sPrintGo=3 	;Sinal de saida para impressao
	.Equ	sP2	=4	;Sinal de saida P2 para selecao de mensagem
	.equ	sTaco	=5	;Sinal de saida de taco para a impressora
	.Equ	sP1	=6	;Sinal de saida P1 para selecao de mensagem
	.Equ	sP0	=7	;Sinal de saida P0 para selecao de mensagem
	;Controle do motor obs: REF era PINC,6 e passou a ser PINC,2
	;PORTC,0=HF	 Sinal de saida   para passo simples/duplo
;OK	;PORTC,1=Nmoto	 Sinal de saida   do nivel de corrente do motor
;OK	;PINC,2	=REF	 Sinal de entrada do fim de curso +
.EQU	DIRMOT	=3	 ;Sinal de saida da direcao do motor, 1=positivo
;OK	;PORTC,4=CKmotor Sinal de saida   do Clock do motor
;OK	;PINC,5	=FC-	 Sinal de entrada do fim de curso
;	;PINC,6	=FC+	 Sinal de entrada do Zero index
;OK	;PORTC,7=Emotor	 Sinal de saida   para energicacao do motor

	;Controle da comunicacao serial
;OK	;PIND,0	=RX1	Sinal de entrada da porta serial principal COM1
;OK	;PORTD,1=TX1	Sinal de saida   da porta serial principal COM1
	;PORTD,2=RTS1	Sinal de saida   da porta serial principal COM1
	;PIND,3	=CTS1	Sinal de entrada da porta serial principal COM1
;OK	;PIND,4	=RX2	Sinal de entrada da porta serial auxiliar COM2
;OK	;PORTD,5=TX2	Sinal de saida   da porta serial auxiliar COM2
	;PORTD,6=RTS2	Sinal de saida   da porta serial auxiliar COM2
	;PIND,7	=CTS2	Sinal de entrada da porta serial auxiliar COM2
	;
.ESEG
.org	0
;Os primeiros 16 byte sao protegido, so' o fabricante pode modificar
E_NL:	.DW	0	;Numero de ligada
E_HT:	.DW	0	;Horas de trabalho
E_NCC:	.DW	0	;Numero de ciclos completado
E_PULL:	.DW	0	;Pulso enviado para o motor, (Metros rodados) word low
E_PULH:	.DW	0	;Pulso enviado para o motor, (Metros rodados)
E_SEN:	.DB	0,0,0,0,0,0	;senha do usuario
;
;Os proximos 24 byte pode ser modificado pelo usuario
	.DW	0	;Vago
	.DW	0	;Vago
	.DW	0	;Vago
	.DW	0	;Vago
	.DW	0	;Vago
	.DW	0	;Vago
	.DW	0	;Vago
	.DW	0	;Vago
;
E_COM1:	.DB	1	;Canal da com1
	.DW	(FCLOCK/BAUD1-8)/$10	;Divisor para o baud Rate da com1
					;Menor taxa a 8MHz e' 1950 Baud
E_COM2:	.DB	1	;Canal da com2
	.DW	(2*FCLOCK/BAUD2/nAmost+1)/2 ;Divisor para o baud Rate da com2
E_FLAG:	.DW	0	;Flags de configuracao
	.DW	0	;Vago
	.DW	0	;Vago
	.DW	0	;Vago
;
;Os bytes seguintes e'para ser usado pelos programa
; Os valores são considerado uma polia de 12 dentes 60.96 mm/Volta
PROGINI:.DW	$200+46		;Posicao inicial (7mm)
	.DW	$200+492	;Posicao final (75mm)
	.DW	24606		;Aceleracao do avanco (3750mm/S^2)
	.DW	24606		;Aceleracao do retorno (3750mm/S^2)
	.DW	492		;Velocidade do avanco (75mm/S)
	.DW	492		;Velocidade do retorno (75mm/S)
	.DB	3,3		;Numero de mensagem no avanco/retorno
	.DW	$200+151	;Primeira mensagem no avanco (23mm)
	.DW	$200+394	;Primeira mensagem no retorno( 60m)
	.DW	$200+394	;Ultima mensagem no avanco (60mm)
	.DW	$200+151	;Ultima mensagem no retorno (23mm)
	.DW	10		;Largura do sinal de impressao 10ms
	.DW	1		;Tempo para o start automatico
	.DW	10		;Tempo para o start externo 10mS
	.DW	7	;(1mm)	;Cota de antecipacao do start entre eixos (pinelmatico)
	.DW	1		;Retardo para o start entre eixo (??deveria ser 1024??)
	.DB	$50,$80	;$DC,$80	;FLAGPL/FLAGPH Flag de configuracao do programa
	.DW	1		;Retardo para o sinal de impressao
	.DB	5,0		;Divisor programado do Taco/Vago
E_JAN:	.DW	50		;Janela de erro admitido
E_NPM:	.DW	400		;Numero de pulso do motor
E_PREF:	.DW	$200+50		;Valref, Posicao zero da referencia =78+20mm
E_AREF:	.DW	9843		;Arefer, Aceleracao de referencia =2000mm/segundo^2
E_VREF:	.DW	492		;Vrefer, Velocidade de referencia =100mm/segundo
	.DB	2,4		;FLAGPE Flag especial de intertravamento.
				;Divisor programado do Motor
PROGFIM:
;
;***** Interrupt Vectors
.CSEG
.org	0
	rjmp	RESET		;Reset Handle
;
;.Org	ICP1addr		;Input Capture1 Interrupt Vector Address ($003)
;	RETI
.org	OC1Aaddr		;Interrupcao $0004
	rjmp	INTTMP		;Output Compare1A Interrupt Vector Address
;
;.org	OVF1addr		;Interrupcao $0006
;	rjmp	INTTMP		;Overflow1 Interrupt Vector Address
;
.org	$00D			;Fim da tabela de chamada de interrupcao
;Area de definicao do funcionamento vago
F_APL:	.DB	'M','L'		;Aplicacao do sofware: movimentador linear
F_UTI:	.DB	'g','e'		;Utilizacao: Generica
F_IMP:	.DB	'g','e'		;Impressora utilizada: Generica
F_LIN:	.DB	'g','e'		;Linha de producao: Generica
;		  Y-----YM--MD---D
F_SOFT:	.DW	0b1100011110010000	;Data do software,16 de Dezembro de 99
F_GRAV:	.DW	0b1100011110010000	;Data da gravacao,16 de Dezembro de 99
F_SEN:	.DB	'M','E','S','R','P','J'	;senha do fabricante
F_SER:	.DW	0		;Numero de serie
	.DW	0		;Vago
	.DW	0		;Vago

;
;************************************************************************
;*									*
;* "INTTMP"								*
;* Number of words	:5						*
;* Number of cycles	:8						*
;* Low registers used	:7 (SSreg,CTACO,VTACO,CDIVL,TMPAX,VDIVL,VDIVH)	*
;* High registers used	:8 (ItmpL,ItmpH,TIMERL,TIMERHCDIVH,FLAGI,YL,YH)	*
;* I/O UTILIZADO	:	OCR1A	OCR1B	SREG	TIFR	TIMSK	*
;* VARIAVEIS UTILIZADA:	Y+NDIV	Y+PATUA	Y+PINDE	Y+PRTH	Y+PRTL		*
;* Nunca podera ser usado o registro r0 nesta rotina ou por qualquer	*
;* outra rotina chamada por INTTMP.					*
;************************************************************************
INTTMP:	PUSHW	Z
	in	SSreg,SREG	;Salva temporariamente o Status Register
	cbi	pPrtRv,sTaco	;Se pPrtRv(5)=1, reseta clock do taco
	cbi	PORTC,4		;Se portc(4)=1, reseta clock do motor
	LDIW	Y,RAMINT	;Endereco dos parametros da interrupcao
	subi	CdivH,Kpresc
	brcc	INTTM0	;(16)	;Se nao fim do tempo do clock do motor
	MOVEW	Cdiv,Vdiv
	rcall	motorx	;(20+07/79=27/99);Se fim do tempo do clock do motor
	subi	CdivH,Kpresc
INTTM0:	in	ItmpL,TIFR	;Verifica interrupcao
	SBRC	ItmpL,Ocf1B	;comparador B (rtimer)
	RJMP	INTTM3	;(20/104)	;Fim do tempo
	rcall	NTIMER	;(22/106+22/237)=(44/343)
	LDIW	Z,PONCOM1	;Ponteiro da com1
	RCALL	INTRX	;(49/343+39/18)=(67/382)
	sbrc	FlagI,7		;Verifica se fim da rotina de interrupcao timer
	CBR	FlagI,3<<6	;Reinicializa a rotina do rtimer bit 6 e 7
	POPW	Z
	IN	ItmpL,TIFR	;Verifica interrupcao
	SBRS	ItmpL,Ocf1A	;Interrupcao do comparador1A ?
	RJMP	INTTM1	;(77/392)	;Não
	LDD	ItmpH,Y+masceH	;Mascara de erro
	SBR	ItmpH,1<<0	;Erro de RunTimer da rotina inttmp
	STD	Y+masceH,ItmpH	;Mascara de erro
INTTM1:	out	SREG,SSreg	;restore Status register
	reti	;(82/402)
;
INTTM3:	INW	Itmp,OCR1B	;(22/106)	;Comparador B
	ADDIW	Itmp,Ftimer
INTTM4:	OUTW	OCR1B,Itmp	;Comparador B
	ldi	ItmpH,1<<Ocf1B
	out	TIFR,ItmpH	;Limpa a interrupcao do comparador1B
	MOVEW	Itmp,Vdiv
	LDDW	Vdiv,Y+ndiv	;Vdiv=[Z+ndiv]
	SUBW	Itmp,Vdiv
	brcs	INTTM6	;(40/124);Se novo divisor maior
	breq	INTTM7	;(41/125);Se novo divisor igual
	;Se novo divisor menor
INTTM5:	LSRW	Itmp
	SUBW	Cdiv,Itmp
	brcc	INTTM7	;(46/130)
	CLRW	Cdiv
	rjmp	INTTM7	;(49/133)
	;Se novo divisor maior
INTTM6:	RORW	Itmp		;Divide por 2 Itmp negativo
	SUBW	Cdiv,Itmp
	brcs	INTTM7	;(46/130)
	ldi	CdivH,255
	mov	CdivL,CdivH
	;Se novo divisor igual
INTTM7:	rcall	NTIMER	;(136/41+237/22)=(373/63)	;Falta subtrair timerx CdivL
	sbrc	FlagI,6		;Verifica se rotina do timer em andamento
	rjmp	ierro		;Erro de time out loop infinito
	SBR	FlagI,1<<6	;Seta inicio da rotina de interrupcao do timer
	POPW	Z
;
	PUSH	ZH
	push	SSreg		;Salva Status register do programa principal
	IN	ItmpL,TIFR	;Verifica interrupcao
	SBRS	ItmpL,Ocf1A	;Interrupcao do comparador1A ?
	RJMP	INTTM8	;(390/82)	;Não
	LDD	ItmpH,Y+masceH	;Mascara de erro
	SBR	ItmpH,1<<0	;Erro de RunTimer da rotina inttmp
	STD	Y+masceH,ItmpH	;Mascara de erro
INTTM8:	sei	;(395/83)	;enable global interrupts
;
	PUSH	ZL
	PUSHW	rp14
	PUSHW	rp16
	PUSHW	rp18
	PUSHW	rp0
	rcall	RTIMER		;rotina de fim de timer
	POPW	rp0
	CLI
	INW	rp18,OCR1B	;Comparador do Rtime, Comparador B
	INW	rp16,TCNT1	;Contador 1
	SEI
	SUBW	rp18,rp16	;Tempo ocioso do processador anterior
	LDDW	rp16,Y+tmpint	;Tempo ocioso do processador atual
	CPW	rp18,rp16	;Verifica qual o menor tempo
	BRCC	INTTM9		;Tempo atual >= Tempo anterior
	STDW	Y+tmpint,rp18	;Restante do tempo que restante da interrupcao
INTTM9:	POPW	rp18
	POPW	rp16
	POPW	rp14
	POPW	Z
	SBR	FlagI,1<<7	;Seta fim da rotina de interrupcao do timer
	out	SREG,ZH		;restore Status register
	sei
	POP	ZH
	ret
ierro:	rjmp	ierro		;Erro de time out loop infinito
;
; Carrega novo timer e novo divisor
; tempo de execucao (22/41+RDUART+WRUART+EscSer+LerSer)=22/41+81+45+25+45= 22/237 estados
; LerSer=45/18,	EscSe=25/10,	RDUART=81/15,	WRUART=44/11.
NTIMER:	ldi	ItmpL,Kpresc
	mov	tmpax,ItmpL	;ItmpL contem Kpresc
	INW	Itmp,OCR1A	;Comparador A
	cpi	CdivH,0
	brne	NTIME0	;(07)
	add	ItmpL,CdivL
NTIME0:	adc	ItmpH,tmpax
	OUTW	OCR1A,Itmp	;Comparador A
;
;As duas inhas abaixo estao dando problemas no emulador
	ldi	ItmpH,1<<Ocf1A
	out	TIFR,ItmpH	;Limpa a interrupcao do comparador1A
;
	cpi	CdivH,0
	brne	NTIME1	;(15)
	sub	timerL,CdivL
NTIME1:	sbc	timerH,tmpax
	BRCC	NTIME6	;(18)
	LDSW	Itmp,PonCom2+DivCom	;Divisor para o baud Rate da com2
	ADDW	timer,Itmp
;Verifica a serial com2
	LDIW	Z,PonUart2	;Ponteiro da Uart2 emulada
	RCALL	EscSer	;(36+RDUART+WRUART+EscSer)
	BRNE	NTIME3		;Manten o nivel durante a amostragem do bit
	BRCC	NTIME2	;(20)	;Fim do bloco recebido stop bit ?
	SBI	PortTx2,PinTx2	;Pino de saida ativo com 1 ?
;	SBI	PortTx2,PinRx2	;Retona a saida para a entrada	;so para teste @@@
	RJMP	NTIME3	;(25)
NTIME2:	CBI	PortTx2,PinTx2	;Pino de saida desativo com 0 ?
;	CBI	PortTx2,PinRx2	;Retona a saida para a entrada	;so para teste @@@
NTIME3:	CLT			;Limpa bit
	SBIC	PortRx2,PinRx2	;Pino de entrada ativo com 1 ?
	SET			;Sim, Seta bit
	RCALL	LerSer	;(41+RDUART+WRUART+EscSer+LerSer)
;Verifica a serial com3
	LDIW	Z,PonUart3	;Ponteiro da Uart2 emulada
	RCALL	EscSer	;(36+RDUART+WRUART+EscSer)
	BRNE	NTIME5		;Manten o nivel durante a amostragem do bit
	BRCC	NTIME4	;(20)	;Fim do bloco recebido stop bit ?
	SBI	PortTx3,PinTx3	;Pino de saida ativo com 1 ?
;	SBI	PortTx3,PinRx3	;Retona a saida para a entrada	;so para teste @@@
	RJMP	NTIME5	;(25)
NTIME4:	CBI	PortTx3,PinTx3	;Pino de saida desativo com 0 ?
;	CBI	PortTx3,PinRx3	;Retona a saida para a entrada	;so para teste @@@
NTIME5:	CLT			;Limpa bit
	SBIC	PortRx3,PinRx3	;Pino de entrada ativo com 1 ?
	SET			;Sim, Seta bit
	RJMP	LerSer	;(41+RDUART+WRUART+EscSer+LerSer)
NTIME6:	RET		;(22)
;
;Tratameno para o divisor do motor
;tempo de execucao	(79/07) estados com printgo e zindex
motorx:	SBRC	FLAGI,4		;Motor acelerando ?
	RJMP	motor0		;Sim
	SBRS	FLAGI,5		;Nao, Motor desacelerando ?
	ret		;(07)	;Nao esta acelerando e nen desacelerando
;Leitura do giro
motor0:	LDD	ItmpL,Y+flagZ
	ADD	ItmpL,ItmpL
	SBIC	pinc,2		;Zero index ?
	SBR	ItmpL,1<<0	;=1
	STD	Y+flagZ,ItmpL
;
	dec	Cmotor
	breq	motor2	;(13/14);Pulso para o motor
	dec	Ctaco
	brne	motor1	;(15/16);taco nao zero
	sbi	pPrtRv,sTaco	;seta clock do taco
	mov	Ctaco,Vtaco	;Carrega Valor do divisor do taco
motor1:	ret		;(19/20)
motor2:	sbi	PORTC,4		;seta clock do motor
	dec	Ctaco
	brne	motor3	;(17/18);taco nao zero
	sbi	pPrtRv,sTaco	;seta clock do taco
	mov	Ctaco,Vtaco	;Carrega Valor do divisor do taco
;
;Processamento para a contagem do pulso do motor
motor3:	ldd	Cmotor,Y+Vmotor	;Carrega Valor do divisor do motor
	LDDW	Itmp,Y+Patua
	rcall	prtgo	;(27/26+20/5=47/31)	;Verifica o sinal de impressao
	sbic	PORTC,DIRMOT	;Verifica a direcao do movimento
	rjmp	motor5	;(50/34);Se portc(3)=1, movimento positivo
	SUBIW	Itmp,1
	STDW	Y+Patua,Itmp
	RJMP	ZindexN	;(57/41+22/10=79/51);Verifica o zero index (direcao negativa)
;
motor5:	ADDIW	Itmp,1
	STDW	Y+Patua,Itmp
	RJMP	ZindexP	;(58/42+19/10=77/52);Verifica o zero index (direcao positiva)

;--------------------------------------------------------------------------
;Rotina de Verificacao de Zero Index
;Desc.: Sempre que for detectado o Zero Index a rotina salva o valor
;da PosAtual e desabilita-se a si mesma. A rotina que avalia esse
;valor, apos o processamento deve reabilitar esta rotina.
;tempo de execucao	10/21 estados
;--------------------------------------------------------------------------
;
ZindexP:	;10/19
	LDD	ZL,Y+flagZ
	ANDI	ZL,$0F	;So considera as quatro ultimas leitura
	BREQ	ZINDE0	;(5)	;Zero index = xxxx0000
	CPI	ZL,$0F	;So considera as quatro ultimas leitura
	BRNE	ZINDE2	;(7)	;Zero index indefinido
	SBRS	FlagI,1		;Zero index = xxxx1111, o anterior ?
	SBR	flagI,1<<1	;Zero index 0 para 1
	RET		;(12)	;Se zero index 1 para 1
ZINDE0:	SBRS	FlagI,1		;Zero index anterior
	RET		;(10)	;Se zero index 0 para 0
	CBR	flagI,1<<1	;Zero index 1 para 0
	SBRS	FlagI,0		;Verifica se rotina esta habilitada
	RET		;(13)
;desab int de z.index, salva e retorna
	CBR	flagI,1<<0	;Desabilita o Zero index
	STDW	Y+Pinde,Itmp	;Salva posicao atual no zero index
	RET		;(19)
;
ZindexN:	;(10/22)
	LDD	ZL,Y+flagZ
	ANDI	ZL,$0F	;So considera as quatro ultimas leitura
	BREQ	ZINDE1	;(5)	;Zero index = xxxx0000
	CPI	ZL,$0F	;So considera as quatro ultimas leitura
	BRNE	ZINDE2	;(7)	;Zero index indefinido
	sbrc	FlagI,1		;Zero index = xxxx1111, zero index anterior ?
	ret		;(11)	;Se zero index 1 para 1
	SBR	flagI,1<<1	;Zero index 0 para 1
	sbrs	FlagI,0		;Verifica se rotina esta habilitada
	ret		;(14)
	CBR	flagI,1<<0	;Desabilita o Zero index
	ADDIW	Itmp,4
	STDW	Y+Pinde,Itmp	;Salva posicao atual no zero index
	ret		;(22)
ZINDE1:	CBR	flagI,1<<1	;Zero index 1 para 0
ZINDE2:	ret		;(10/11)	;Se zero index 0 para 0
;
;Verifica o sinal de impressao
;tempo de execucao	(20/05) estados
prtgo:	sbrs	FlagI,2		;Verifica se sinal de impressao esta habilitado
	ret		;(5)	;Se sinal de impresao desabilitado
	ldd	tmpax,Y+prtH
	cpse	tmpax,ItmpH	;Verifica posicao atual com posisao/impressao
	ret		;(9)	;Se diferente
	ldd	tmpax,Y+prtL
	cpse	tmpax,ItmpL	;Verifica posicao atual com posisao/impressao
	ret		;(13)	;Se diferente
prtgo0:	CBR	FlagI,1<<2	;Desabilita o sinal de impresao
	sbrc	FlagI,3		;Verifica logica do sinal de de impressao
	sbi	pPrtRv,sPrintGo	;Ativa o sinal de impressao com 1
	sbrs	FlagI,3		;Verifica logica do sinal de de impressao
	cbi	pPrtRv,sPrintGo	;Ativa o sinal de impressao com 0
	ret		;(20)
;************************ Fim da rotina de interrupcao ************************
;
RTIMER:	;RCALL	LerCom		;Leitura da Com3
	RCALL	dosado		;Copia sinal de impressao pPrtRv,3 para PORTA,5
	LDI	rp18L,5
	STD	Z+iMenAv,rp18L	;Numero de mensagem no avanco
	LDI	rp18L,10
	STD	Z+iMenRt,rp18L	;Numero de mensagem no retorno
	IN	rp18L,PinA	;
	BST	rp18L,7
	LDD	rp18L,Z+emg_cnt	;carrega contador do botao de emergencia
	LSL	rp18L
	BLD	rp18L,0
	STD	Z+emg_cnt,rp18L
	CPI	rp18L,$FF	;$FF = N.F. $00 = N.A.
	BRNE	emerg_end
;	RCALL	VRFZD		;Inicializa o motor
emerg_end:
	PUSHW	Z
	ldd	rp18L,Z+FLAGPH	;Flag de habilitacao do programa
	BST	rp18L,LOGIMP	;Logica do sinal de impressao
	BLD	flagI,3		;Atualiza
;
	;Verifica a communicação
	LDIW	Z,PONCOM1	;Ponteiro da com1
	SBRC	rp18L,SELSER	;Selecao de impressao via serial ligada
	RJMP	RTIME0		;Selecao ligada
	SBRC	rp18L,REVSER	;Reversao de impressao via serial ligada
	RJMP	RTIME0		;Reversao ligada
	RCALL	SERIAL
	RJMP	RTIME1
RTIME0:	RCALL	CHKIMPRES	;Checa o retorno da impressora e alguma pendencia
RTIME1:	LDIW	Z,PonUart2	;Ponteiro da Uart2 (emulada)
	RCALL	VerRx
	LDIW	Z,PonUart2	;Ponteiro do buffer
	RCALL	VerTx
	LDIW	Z,PONCOM2	;Ponteiro da com2
	RCALL	SERIAL		;Bloqueio da com2
	LDIW	Z,PonUart3	;Ponteiro da uart3 (emulada)	;so para teste @@@
	RCALL	ReplUart3	;Retorna para a saida o que foi lido na entrada da uart3 emulada	;so para teste @@@
	POPW	Z
;
	RCALL	WRITEP		;rotina de gravacao de EPPROM
;	RCALL	OUTPARALELA	;Saida da porta paralela.
	RCALL	FIMCUR
	LDDW	rp18,Y+tmpsys
	ADDIW	rp18,1
	STDW	Y+tmpsys,rp18
;	RCALL	LEITOK		;Sinal autorizando o avanco do trasnportador BS
	RCALL	PISTAO_Ilha	;Verifica o sinal de saida do start entre eixo
	rcall	VRFPRT		;Verifica sinal de impressao
	RCALL	LDSTAT		;Atualiza o status em funcao do movimento
	rcall	start		;Verifica sinal de start
	SBRC	FLAGI,4		;Acelerando ?
	rjmp	MOVMOV		;Sim
	SBRC	FLAGI,5		;Desacelerando ?
	rjmp	MOVMOV		;Sim
;
;Motor parado
	LDD	rp16H,Z+CTRSER	;Controle via serial
	BREQ	RTIME3		;Se start externo
    ;Sem Start externo
RTIME2:	RCALL	staut		;Start automatico ?
	BREQ	IniMov		;Sim
	RJMP	RTIME5		;Sem start testa start entre eixo
RTIME3:	SBRC	rp16H,SerPausa	;Pausa serial ?
	RJMP	RTIME2		;Pausa serial e start entre eixo
    ;Com Start externo
	RCALL	staut		;Start automatico ?
	BRCS	IniMov		;Não
	BRNE	RTIME4		;Ainda temporizando, Ignora o start esterno
	LDD	rp18H,Y+masceL	;Mascara de erro
	SBR	rp18H,1<<eSinStaO	;Erro do sinal de start
	STD	Y+masceL,rp18H	;Mascara de erro
	RJMP	IniMov		;Não
    ;Start automatico temporizando
RTIME4:	LDD	rp18H,Y+masceL	;Mascara de erro
	SBR	rp18H,1<<eSinStaO	;Erro do sinal de start
	STD	Y+masceL,rp18H	;Mascara de erro
RTIME5:	RCALL	STARTY		;Verifica start entre eixo
	LDD	rp16H,Z+CTRSER	;Controle via serial
	BRCS	IniMov		;Sim
    ;Nenhum start testa o start serial
	sbrs	rp16H,SerPausa	;Pausa serial ?
	RJMP	RTIME6		;Nao, Verifica o start serial
	sbrs	rp16H,SerManual	;Modo manual ?
	RET			;Nao, retorna
	ldd	rp18L,Y+statusL
	sbrc	rp18L,Referenciando	;Referenciando ?
	RJMP	RTIME6		;sim, aguarda referenciar
	cbi	PORTC,7		;Nao, desernegisa o motor
	RJMP	VRFZD		;Rinicializa o stautus do motor
RTIME6:	sbrs	rp16H,SerStart	;Start serial ?
	ret			;Nao
	LDIW	rp18,0
	STDW	Y+cntaut,rp18
;	RJMP	INIMOV		;Sim
;
;Inicializa o movimento do motor
INIMOV:	CBR	rp16H,(1<<SerStart)+(1<<SerStop)	;Sinal de start e stop serial
	STD	Z+CTRSER,rp16H	;Controle via serial
	CBR	FlagI,1<<2	;Desabilita o sinal de impresao
	RCALL	REFER
	breq	INIMV4		;Se posicao alcancada
	LDDW	rp16,Y+Vmin	;Velocidade minima
	STDW	Y+velatu,rp16
	brcc	INIMV1		;Se movimento positivo
	cbi	PORTC,DIRMOT	;portc(3)=0, movimento negativo
	RJMP	INIMV2		;Se modo passo a passo
INIMV1:	sbi	PORTC,DIRMOT	;portc(3)=1, movimento posivivo
INIMV2:	RCALL	CalDiv_Ilha	;Calculo do divisor
	STDW	Y+ndiv,rp18
	ldd	Cmotor,Y+Vmotor	;Carrega Valor do divisor do motor
	mov	Ctaco,Vtaco	;Carrega Valor do divisor do taco
	ldi	CdivH,2*Kpresc+1	;So para enganar
	MOVEW	Vdiv,rp18
	clr	CdivH
	sbi	PORTC,1		;Aumenta nivel de corrente do motor
	sbi	PORTC,7		;Energisa o motor
	LDD	rp16L,Z+Flagg	;Flag de Uso Geral
	SBRS	rp16L,StaEntEixP	;Start entre eixo pendente ?
	RJMP	IniMv3		;OK
	CBR	rp16L,1<<StaEntEixP	;Limpa start entre eixo pendente
	STD	Z+Flagg,rp16L	;Flag de Uso Geral
	LDD	rp18L,Y+masceL	;Mascara de erro
	SBR	rp18L,1<<eSinStaO	;Erro do sinal de start
	STD	Y+masceL,rp18L	;Mascara de erro
IniMv3:	SBR	FlagI,1<<4	;Liga a aceleracao
INIMV4:	ret
;
;Tratamento para o motor em movimento
MOVMOV:	brne	MOVMV0		;Se nao start
	ldd	rp18L,Y+masceL	;Mascara de erro
	SBR	rp18L,1<<eSinStaO	;Erro do sinal de start
	std	Y+masceL,rp18L	;Mascara de erro
MOVMV0:	RCALL	STARTY		;Verifica start entre eixo
	RCALL	VRFZINDEX
	LDD	rp18L,Z+CTRSER	;Controle via serial
	sbrc	rp18L,SerPausa	;Sinal de pausa serial
	sbrs	rp18L,SerStop	;Sinal de stop serial
	RJMP	MOVMV1
	CBR	rp18L,(1<<SerStart)+ (1<<SerStop)	;Sinal de start e stop serial
	STD	Z+CTRSER,rp18L	;Controle via serial
	CBR	FlagI,1<<4	;Desliga a aceleracao
	SBR	FlagI,1<<5	;Liga a desaceleracao
MOVMV1:	LDDW	rp16,Y+velatu
	ldd	rp14L,Y+velatuF
	sbrs	FlagI,4		;Aceleracao ligada ?
	RJMP	FIMMOV		;Nao, aceleracao desligada
	LDDW	rp18,Y+Vmax	;Velocidade maxima
	CPW	rp16,rp18
	brcc	MOVMV3		;Se velocidade >= que a maxima
	ldd	rp14H,Y+VincL	;Incremento de Velocidade
	add	rp14L,rp14H
	ldd	rp14H,Y+VincH
	adc	rp16L,rp14H
	clr	rp14H
	adc	rp16H,rp14H
	CPW	rp16,rp18
	brcs	MOVMV2		;Se velocidade < que a maxima
	MOVEW	rp16,rp18
	clr	rp14L
	SBR	FlagI,1<<5	;Liga a desaceleracao, para indicar fim da aceleracao
	RJMP	MOVMV7		;ou seja velocidade constante e maxima
MOVMV2:	CBR	FlagI,1<<5	;Desliga a desaceleracao
MOVMV7:	STDW	Y+velatu,rp16
	std	Y+velatuF,rp14L
	RCALL	CalDiv_Ilha	;Calculo do divisor
	STDW	Y+ndiv,rp18
MOVMV3:	LDDW	rp14,Y+Pramp	;Posicao do inicio da rampa
	LDWINT	rp18,Y+Patua	;Posicao atual
	CPZW	rp18,rp14,MOVMV5
	brcs	MOVMV4		;Se posicao atual menor que posicao da rampa
	sbic	PORTC,DIRMOT	;Verifica a direcao do movimento
	rjmp	MOVMV5		;Se portc(3)=1, movimento positivo
	ret
MOVMV4:	sbic	PORTC,DIRMOT	;Verifica a direcao do movimento
	ret			;Se portc(3)=0, movimento positivo
MOVMV5:	CBR	FlagI,1<<4	;Desliga aceleracao
	SBR	FlagI,1<<5	;Liga a desaceleracao
	ret
;
;Motor em movimento e aceleracao desligada
FIMMOV:	LDDW	rp18,Y+Vmin	;Velocidade minima
	CPW	rp16,rp18
	brcs	FIMMV3		;Velocidade < que minima
	brne	FIMMV0		;Velocidade > que minima
	tst	rp14L		;Parte fracionaria da velocidade
	BREQ	FIMMV3		;Velocidade = que minima
FIMMV0:	ldd	rp14H,Y+VincL	;Incremento de Velocidade
	sub	rp14L,rp14H
	ldd	rp14H,Y+VincH
	sbc	rp16L,rp14H
	sbci	rp16H,0
	brcs	FIMMV1		;Velocidade negativa
	CPW	rp16,rp18
	brcc	FIMMV2		;Velocidade > que minima
FIMMV1:	MOVEW	rp16,rp18	;Faz velocidade = velocidade minima
	clr	rp14L
FIMMV2:	STDW	Y+velatu,rp16
	std	Y+velatuF,rp14L
	RCALL	CalDiv_Ilha	;Calculo do divisor
	STDW	Y+ndiv,rp18
FIMMV4:	RET
FIMMV3:	CBR	FlagI,1<<5	;Desliga a desaceleracao
	ldd	rp18L,Z+FLAGPH	;Flag de habilitacao do programa
	SBRC	rp18L,REDCOR	;Reducao do nivel de corrente em repouso ?
	CBI	PORTC,1		;Sim, Diminue nivel de corrente do motor
	RCALL	VRFREF		;Verifica a referencia
	BRCS	FIMMV4		;Se referenciando
	LDD	rp18L,Y+statusL
	SBRS	rp18L,ReferenciaOk	;Referenciado ?
	RJMP	VRFRF3		;Nao, Perdido a referencia
	RCALL	Pista0_Ilha
;	RJMP	TstSta		;Verifica os start automatico do movimentador de cabecote
;
;-----------------------------------------------------------------------------------------------/
;	Rotina para ser colocada na rotina do final do movimento (fimMov)			/
;-----------------------------------------------------------------------------------------------/
;   Se Modo continuo ?										/
;   Sim												/
;	Se (Direcao = Avanco) ?									/
;	Sim											/
;	    Se STAUTR = Ligado									/
;	    Sim											/
;		Se STAUTA = Ligado ?								/
;	    	Sim										/
;		    Se Pausa = Ligada ?								/
;	    	    Não										/
;			Inicializa o temporizador do start automatico				/
;	    	Não										/
;		    Inicializa o temporizador do start automatico				/
;	Não (Retorno)										/
;	    Se STAUTA = Ligado									/
;	    Sim											/
;		Se STAUTR = Ligado ?								/
;	    	Sim										/
;		    Se Pausa = Ligada ?								/
;	    	    Não										/
;			Inicializa o temporizador do start automatico				/
;	    	Não										/
;		    Inicializa o temporizador do start automatico				/
;   Não (Modo passo a passo)									/
;	Se (Direcao = Avanco) ?									/
;	Sim											/
;	    Se Pexec = PosFim ?									/
;	    Sim											/
;		Se STAUTR = Ligado								/
;		Sim										/
;		    Se STAUTA = Ligado ?							/
;	    	    Sim										/
;			Se Pausa = Ligada ?							/
;	    		Sim									/
;			    Se (STautPP = Ligado) ?						/
;			    Sim									/
;				Inicializa o temporizador do start automatico com start pas/pas	/
;			Não									/
;			    Se (STautPP = Ligado) ?						/
;			    Sim									/
;				Inicializa o temporizador do start automatico com start pas/pas	/
;				Liga start automatico pendente					/
;			    Não									/
;				Inicializa o temporizador do start automatico			/
;	    	    Não										/
;			Se (STautPP = Ligado) ?							/
;			Sim									/
;			    Inicializa o temporizador do start automatico com start pas/pas	/
;			    Liga start automatico pendente					/
;			Não									/
;			    Inicializa o temporizador do start automatico			/
;		Não										/
;		    Se (STautPP = Ligado) ?							/
;		    Sim										/
;			Inicializa o temporizador do start automatico com start pas/pas		/
;	    Não											/
;		Se STautPP = Ligado ?								/
;		Sim										/
;		    Inicializa o temporizador do start automatico				/
;	Não (Retorno)										/
;	    Se Pexec = PosIni ?									/
;	    Sim											/
;		Se STAUTA = Ligado								/
;		Sim										/
;		    Se STAUTR = Ligado ?							/
;	    	    Sim										/
;			Se Pausa = Ligada ?							/
;	    		Sim									/
;			    Se (STautPP = Ligado) ?						/
;			    Sim									/
;				Inicializa o temporizador do start automatico com start pas/pas	/
;			Não									/
;			    Se (STautPP = Ligado) ?						/
;			    Sim									/
;				Inicializa o temporizador do start automatico com start pas/pas	/
;				Liga start automatico pendente					/
;			    Não									/
;				Inicializa o temporizador do start automatico			/
;	    	    Não										/
;			Se (STautPP = Ligado) ?							/
;			Sim									/
;			    Inicializa o temporizador do start automatico com start pas/pas	/
;			    Liga start automatico pendente					/
;			Não									/
;			    Inicializa o temporizador do start automatico			/
;		Não										/
;		    Se (STautPP = Ligado) ?							/
;		    Sim										/
;			Inicializa o temporizador do start automatico com start pas/pas		/
;	    Não											/
;		Se STautPP = Ligado ?								/
;		Sim										/
;		    Inicializa o temporizador do start automatico				/
;////////////////////////////////////////////////////////////////////////////////////////////////
;Verifica os start automatico do movimentador de cabecote
TstSta:	LDDW	rp16,Z+FLAGP	;Flag de habilitacao do programa
	SBRC	rp16H,MODPP	;Modo passo a passo ?
	RJMP	TstSt2		;Sim
    ;Modo Continuo
	CLR	rp18H
	STD	Y+nummen,rp18H
	SBIS	PORTC,DIRMOT	;Direcao deste movimento ?
	RJMP	TstSt0		;Negativo
	;Positivo
	CBI	PORTC,DIRMOT	;proximo movimento deve ser negativo
	SBRS	rp16L,STAUTR	;Start automatico no retorno ?
	RET			;Desligado
	SBRS	rp16L,STAUTA	;Start automatico no avanco ?
	RJMP	StAut0		;Desligado, somente Start automatico no retorno
	RJMP	TstSt1		;Controle via serial
	;Negativo
TstSt0:	SBI	PORTC,DIRMOT	;proximo movimento deve ser positivo
	SBRS	rp16L,STAUTA	;Start automatico no avanco ?
	RET			;Desligado
	SBRS	rp16L,STAUTR	;Start automatico no retorno ?
	RJMP	StAut0		;Desligado, somente Start automatico no avanco
TstSt1:	LDD	rp16L,Z+CtrSer	;Controle via serial
	SBRS	rp16L,SerPausa	;Pausa serial ?
	RJMP	StAut0		;Desligado, somente Start automatico no avanco
	RET			;Ligada
    ;Modo passo a passo ?
TstSt2:	LDDW	rp4,Y+Pexec	;Sim Posicao de execucao
	LDD	rp16H,Z+FLAGPE	;Flags de habilitacao especial do programa
	SBIS	PORTC,DIRMOT	;Direcao do movimento ?
	RJMP	TstSt5		;Negativo
	;Positivo
	LDDW	rp18,Z+posfim
	CPW	rp4,rp18	;Pexec >= PosFim
	BRCS	TstSt4		;Não
	    ;Pexec >= PosFim
	SBRS	rp16L,STAUTR	;Start automatico no retorno ?
	RJMP	TstSt4		;Desligado
	SBRS	rp16L,STAUTA	;Start automatico no avanco ?
	RJMP	TstSt6		;Desligado, somente Start automatico no retorno
TstSt3:	LDD	rp16L,Z+CtrSer	;Controle via serial
	SBRS	rp16L,SerPausa	;Pausa serial ?
	RJMP	TstSt6		;Desligado
	    ;PosIni <Pexec < PosFim
TstSt4:	SBRC	rp16H,STautPP	;Start automatico passo a passo ?
	RJMP	TstSt7		;Sim, Retardo para o start entre eixo
	RET			;Não
	;Negativo
TstSt5:	LDDW	rp14,Z+posIni
	CPW	rp14,rp4	;PosIni >= Pexec
	BRCS	TstSt4		;Não
	SBRS	rp16L,STAUTA	;Start automatico no avanco ?
	RJMP	TstSt4		;Desligado
	SBRC	rp16L,STAUTA	;Start automatico no retorno ?
	RJMP	TstSt3		;Os 2 start automatico ligado, Verifica a pausa
TstSt6:	SBRS	rp16H,STautPP	;Start automatico passo a passo ?
	RJMP	StAut0		;Não
	LDD	rp16L,Z+Flagg	;Flag de Uso Geral
	SBR	rp16L,1<<StaAutPe	;Start automatico pendente ?
	STD	Z+Flagg,rp16L	;Flag de Uso Geral
TstSt7:	LDIW	rp18,0
	LDD	rp16L,Y+FLGpis	;Flag de controle do pistao
	SBRS	rp16L,ImpressOk	;é uma posicao de impressão ?
	RJMP	StAut1		;Não
	LDDW	rp18,Z+TempPP	;Retardo para o start automatico passo a passo
	RJMP	StAut1
;
;Start automatico
staut:	LDDW	rp18,Y+cntaut
	SUBIW	rp18,1
	BRCS	staut3
	BRNE	staut2
	LDD	rp16L,Z+Flagg	;Flag de Uso Geral
	SBRS	rp16L,StaAutPe	;Start automatico pendente ?
	RJMP	staut2		;Nao
	CBR	rp16L,1<<StaAutPe	;Limpa o start automatico pendente
	STD	Z+Flagg,rp16L	;Flag de Uso Geral
StAut0:	LDDW	rp18,Z+TmpAut	;Tempo para o start automatico
StAut1:	ADDIW	rp18,1
	SEZ
staut2:	STDW	Y+CntAut,rp18	;Contador para o start automatico
staut3:	RET
;
;Atualiza o status em funcao do movimento
LDSTAT:	LDD	rp18L,Y+statusL
	CBR	rp18L,(1<<sttDirPos) +(1<<sttAceler) +(1<<sttDesacel)
	SBIC	PORTC,DIRMOT	;direcao positiva ?
	SBR	rp18L,1<<sttDirPos	;Sim, portc(3)=1
	SBRC	FLAGI,4		;Aceleracao Ligada ?
	SBR	rp18L,1<<sttAceler	;Sim
	SBRC	FLAGI,5		;Desaceleracao Ligada ?
	SBR	rp18L,1<<sttDesacel	;Sim
	LDD	rp18H,Y+masceL	;Mascara de erro
	TST	rp18H
	BREQ	LDSTT0
	SBR	rp18L,1<<sttErro	;Se erro
LDSTT0:	STD	Y+statusL,rp18L	;Flag de status
	LDD	rp18H,Z+FLAGPH	;Flag de habilitacao do programa
	BST	rp18H,LOGIMP	;Logica do sinal de impressao
	BLD	flagI,3
	sbrs	rp18L,ReferenciaOk
	RET			;Sem Referencia retorna ok
	SBRC	FLAGI,4		;Aceleracao ligada ?
	RET			;Sim
	SBRC	FLAGI,5		;Desaceleracao ligada ?
LDSTT1:	RET			;Sim
	SBRS	rp18H,MODPP	;Modo passo a passo ?
	RJMP	INVMEN		;Nao, Transmite para a impressora as strings
	LDDW	rp16,Z+CNTPT	;Retardo para o sinal de impressao
	SUBIW	rp16,1
	BRCC	LDSTT1		;Contando retardo do sinal de impressao
	LDDW	rp16,Y+cntprt	;Tempo para largura do tempo do pulso
	SUBIW	rp16,1
	BRCC	LDSTT1		;Contando largura do sinal de impressao
	RJMP	INVMEN		;Nao, Transmite para a impressora as strings
;
;Copia sinal de impressao pPrtRv,3 para PORTA,5 para o dosador
dosado:	sbrc	FlagI,3		;Logica do sinal de impressao ?
	rjmp	dosad0		;Ativo com 1
	sbic	pPrtRv,sPrintGo	;Ativo com 0, Sinal ativo ?
	rjmp	dosad1		;Nao
	rjmp	dosad2		;Sim
dosad0:	sbic	pPrtRv,sPrintGo	;Ativo com 1, Sinal ativo ?
	rjmp	dosad2		;Sim
dosad1:	sbi	PORTA,5		;Desliga sinal do dosador
	ret
dosad2:	cbi	PORTA,5		;Desliga sinal do dosador
	ret
;
;************************************************************************
;*									*
;* "VRFPRT"	Testa o sinal de impressao				*
;*									*
;* Se estiver ativo e timer nao estiver ativo carrega novo timer	*
;* Se estiver ativo e timer terminou desativa o sinal de impressao e	*
;* carrega novo timer							*
;* Se estiver desativo e timer terminou verifica o proximo sinal de	*
;* impressao								*
;* Se estiver desativo e timer nao estiver ativo retorna		*
;* OBS se o tempo do sinal de impressao for zero e o sinal de impressao	*
;* estiver ativo este ficara ativo indefinidamente			*
;*									*
;* Number of words	:76 instrucao					*
;* Number of cycles	:?						*
;* Low registers used	:2 (rp14)					*
;* High registers used	:4 (rp18,rp16)					*
;************************************************************************
;Se tempo de impressao terminado desativa o sinal de impressao
VRFPRT:	RCALL	PRTRET		;Verifica o retardo do sinal de impressao
	sbrc	FlagI,3		;Verifica logica do sinal de de impressao
	rjmp	VrfPt0		;Sinal de impressao ativo com 1
	sbic	pPrtRv,sPrintGo	;Verifica sinal de impressao
	rjmp	VrfPt3		;Sinal de impressao desativo
	rjmp	VrfPt1		;Sinal de impressao ativo
VrfPt0:	sbis	pPrtRv,sPrintGo	;Verifica sinal de impressao
	rjmp	VrfPt3		;Sinal de impressao desativo
;Sinal de impressao ativo
VrfPt1:	RCALL	COMIMP		;Comunicacao com impressora em curso ?
	rcall	DECPRT
	brcs	VrfPt2		;Se tempo ja era zero
	brne	VrfPt6		;Se nao terminado
	sbrc	FlagI,3		;Verifica logica do sinal de de impressao
	cbi	pPrtRv,sPrintGo	;Desativa o sinal de impressao com 0
	sbrs	FlagI,3		;Verifica logica do sinal de de impressao
	sbi	pPrtRv,sPrintGo	;Desativa o sinal de impressao com 1
VrfPt2:	LDDW	rp16,Z+tmpprt	;Largura do sinal de impressao
	ADDIW	rp16,1
	STDW	Y+cntprt,rp16	;Tempo para largura do tempo do pulso
	RET
;Sinal de impressao desativo
VrfPt3:	rcall	DECPRT
	breq	VrfPt5		;Se terminado
	brcc	VrfPt6		;Se nao terminado
;Se tempo ja era zero, verifica se teste de impressao via serial
	LDD	rp18L,Z+CTRSER	;Controle via serial
	sbrs	rp18L,SerTstImp	;Sinal de teste de impressao
	rjmp	VrfPt4
	cbr	rp18L,1<<SerTstImp	;Limpa o sinal de teste de impressao
	STD	Z+CTRSER,rp18L	;Restaura
	RCALL	prtgo0		;Sim, liga o sinal de impressao
	LDDW	rp16,Z+tmpprt	;Largura do sinal de impressao
	ADDIW	rp16,1
	STDW	Y+cntprt,rp16	;Tempo para largura do tempo do pulso
VrfPt4:	SBRC	FLAGI,4		;Aceleracao ligada ?
	RET			;Sim
	SBRC	FLAGI,5		;Desaceleracao ligada ?
	RET			;Sim
	LDD	rp16H,Y+statusL
	SBRC	rp16H,ReferenciaOk	;Referenciado ?
	RCALL	ProMen		;Sim, Proxima mensagem
	RET
;Se referenciado verifica nova posicao de impressao
VrfPt5:	ldd	rp16H,Y+statusL
	sbrs	rp16H,ReferenciaOk
VrfPt6:	RET			;Sem Referencia retorna ok
	LDD	rp16H,Y+nummen	;Sim
	LDD	rp16L,Z+nMenRt	;Numero de mensagem no retorno
	SBIC	PORTC,DIRMOT	;direcao positiva ?
	LDD	rp16L,Z+nMenAv	;Sim, Numero de mensagem no avanco
	CPI	rp16L,1
	BRCS	VrfPt6		;Se nenhuma impressao
	BREQ	VrfPtA		;Se uma e ultima impressao
	CP	rp16H,rp16L	;Ultima impressao
	BRCC	VrfPtA		;Sim
;Se motor estiver andando verifica nova posicao de impressao
	LDD	rp18H,Z+FLAGPH	;Flag de habilitacao do programa
	SBRC	rp18H,MODPP	;Modo passo a passo ?
	RJMP	ProMen		;Sim, Proxima mensagem
	SBRC	FLAGI,4		;Aceleracao ligada ?
	RJMP	VrfPt7		;Sim
	SBRS	FLAGI,5		;Desaceleracao ligada ?
	RET			;Não, Parado
;Proximo sinal de impressao para o modo continuo
VrfPt7:	SBIC	PortC,DirMot	;Direção ?
	RJMP	VrfPt8		;positiva
	;Negativo
	LDDW	rp18,Z+pPrtRt	;Primeira impressao programada/Retorno
	LDDW	rp14,Z+uPrtRt	;Ultima impressao programada/Retorno
		;rp16H =rp16L-(rp16H-1)
	SUB	rp16H,rp16L
	SUBI	rp16H,-1
	NEG	rp16H		;=/rp16H +1 =/(rp16H-1)
	RCALL	VrfPtB		;Nova posição de impressao
	CPW	rp18,rp16
	BRCC	VrfPt9		;Ja passo pela posição de impressao
	RJMP	ProMen		;Não, Proxima mensagem
	;Positivo
VrfPt8:	LDDW	rp14,Z+pPrtAv	;Primeira impressao programada/avanco
	LDDW	rp18,Z+uPrtAV	;Ultima impressao programada/avanco
	RCALL	VrfPtB		;Nova posição de impressao
	CPW	rp16,rp18	;Já passou pela posição de impressao ?
	BRCC	VrfPt9		;Sim, erro
	RJMP	ProMen		;Não, Proxima mensagem
	;
VrfPt9:	ldd	rp18L,Y+masceL	;Mascara de erro
	SBR	rp18L,1<<eSinImpr	;Seta erro do sinal de impressao
	std	Y+masceL,rp18L	;Mascara de erro
	LDI	rp16L,1		;Prepara para proximo sinal de impressao
	std	Y+cntprtL,rp16L	;no proximo rtime
	ret
;
VrfPtA:	LDD	rp18H,Z+FLAGPH	;Flag de habilitacao do programa
	SBRS	rp18H,MODPP	;Modo passo a passo ?
	RCALL	VrfPtC		;Não, Incrementa mensagem
	RCALL	ProMen		;Não, Proxima mensagem
	RJMP	INVMEN		;Sim
;
VrfPtB:	RCALL	CALCUTIL_Ilha	;rp18=rp14+rp16H*(rp18-rp14)/(rp16L-1) ;nPexec=pIa+NumMen*(uIa-pIa)/(nMenAvs/Ret-1)
	STDW	Y+prt,rp18	;Nova posicao de impressao
	CLI
	SBR	FlagI,1<<2	;Habilita o sinal de impresao
	LDDW	rp16,Y+Patua	;Pocedimento para ler a Posicao atual
	SEI			;habilita interrupcoes globais
VrfPtC:	LDD	rp14L,Y+NUMmen	;Numero de mensagem corrente
	INC	rp14L
	STD	Y+NUMmen,rp14L	;Numero de mensagem corrente
	RET
;
;Verifica se fim do tempo do sinal de impressao
DECPRT:	LDDW	rp16,Y+cntprt	;Tempo para largura do tempo do pulso
	SUBIW	rp16,1
	BRCS	DECPR0		;Ja era zero
        STDW    Y+cntprt,rp16	;Tempo para largura do tempo do pulso
DECPR0:	ret			;(Nao zero 20/14)(Se zero ou carry 14)
;
;Proximo numero de mensagem
;Camada no termino de cada impressao ou quando parado e não tiver impressao em andamento.
ProMen:	LDD	rp18H,Y+nummen
	TST	rp18H
	BREQ	ProMe0
	DEC	rp18H
ProMe0:	LDD	rp18L,Y+FLGpis	;Flag de controle do pistao
	SBRC	rp18L,ImpressOk	;Incrementa a mensagem ?
	INC	rp18H		;Sim
	SBIC	PORTC,DIRMOT	;direcao positiva ?
	RJMP	ProMe3		;Sim
	LDD	rp18L,Z+nMenRt	;Numero de mensagem no retorno
	CP	rp18L,rp18H	;ultima mensagem do retorno ?
	BREQ	Prome1		;Sim
	BRCC	Prome2		;Não
Prome1:	LDD	rp18L,Z+iMenAv	;Sim, Numero de mensagem no avanco
	RJMP	Prome7
Prome2:	LDD	rp18L,Z+iMenRt	;Não, Numero de mensagem no retorno
	LDD	rp16H,Z+FLAGPE	;Flags de habilitacao especial do programa
	SBRS	rp16H,SelMenDecRet	;Decrementa o numero da mensagem no retorno ?
	RJMP	ProMe6		;Não
	SUB	rp18L,rp18H
	RJMP	ProMe7
ProMe3:	LDD	rp18L,Z+nMenAv	;Sim, Numero de mensagem no avanco
	CP	rp18L,rp18H	;ultima mensagem do avanco ?
	BREQ	Prome4		;Sim
	BRCC	Prome5		;Não
Prome4:	LDD	rp18L,Z+iMenRt	;Sim, Numero de mensagem no retorno
	RJMP	Prome7
Prome5:	LDD	rp18L,Z+iMenAv	;Sim, Numero de mensagem no avanco
ProMe6:	ADD	rp18L,rp18H
ProMe7:	LDD	rp18H,Y+iMensag	;Numero da mensagem corrente
	CP	rp18L,rp18H
	BREQ	ProMe9
	STD	Y+iMensag,rp18L	;Numero da proxima mensagem
	LDD	rp16H,Z+FLAGPE	;Flags de habilitacao especial do programa
	SBRS	rp16H,SelParalela ;Selecao de mensagem pela paralela ?
	RJMP	ProMe8		;Não
	COM	rp18L
	LDI	rp16L,0		;Limpa o valor da porta
	SBRC	rp18L,0		;Bit 0 do valor
	SBR	rp16L,1<<sP0	;Bit 0 da porta
	SBRC	rp18L,1		;Bit 1 do valor
	SBR	rp16L,1<<sP1	;Bit 1 da porta
	SBRC	rp18L,2		;Bit 2 do valor
	SBR	rp16L,1<<sP2	;Bit 2 da porta
	SBRC	rp18L,3		;Bit 3 do valor
	SBR	rp16L,1<<sP3	;Bit 3 da porta
	CLI
	IN	rp18H,pPrtRv
	CBR	rp18H,(1<<sP3) +(1<<sP2) +(1<<sP1) +(1<<sP0)
	OR	rp18H,rp16L	;Atualiza o valor da porta
	OUT	pPrtRv,rp18H
	SEI
ProMe8:	LDD	rp18H,Z+FLAGPH	;Flag de habilitacao do programa
	SBRC    rp18H,SELSER
	RCALL	SelMenSer	;Seleciona a mensagem via serial
ProMe9:	RET
SelMenSer:
	RET
;
;Verifica o retardo do sinal de impressao
PRTRET:	LDD	rp18L,Z+FLAGPH	;Flag de habilitacao do programa
	SBRS	rp18L,MODPP	;Modo passo a passo ?
	RET			;Nao
	LDDW	rp18,Z+CNTPT	;Retardo para o sinal de impressao
	SUBIW	rp18,1
	BRCS	PRTRE0
	STDW	Z+CNTPT,rp18	;Contador do retardo para o sinal de impressao
	BRNE	PRTRE0
	RCALL	prtgo0		;Sim, liga o sinal de impressao
PRTRE0:	RET
;
;Verifica de comunicacao com impressora em curso
COMIMP:	LDD	rp16L,Z+FLAGPH	;Flag de habilitacao do programa
	SBRC	rp16L,SELSER	;Selecao de impressao via serial ?
	RJMP	COMIP0		;Selecao Ligada, transmite strings
	SBRS	rp16L,REVSER	;Reversao de impressao via serial ?
	RET			;Selecao e reversao desLigada
COMIP0:	LDS	rp16L,PONCOM1+RXFLAG	;Estado rotina de leitura do protocolo
	TST	rp16L
	BREQ	COMIP1
	LDD	rp18L,Y+masceL	;Mascara de erro
	SBR	rp18L,1<<eSerCom1	;Erro de comunicacao da com1
	STD	Y+masceL,rp18L	;Mascara de erro
COMIP1:	RET
;
; Comanda a saida de reversao de mensagem  pPrtRv,1 e a saida serial.
; O flag de zero ativo indica que o sinal de reverso ja estava no nivel correto
; e por isso nao ouve comunicacao o registro rp18L contem a condicao para forcar
; a comunicacao.
INVMEN:	LDD	rp16L,Z+nMenAv	;Numero de mensagem no avanco
	LDD	rp16H,Z+nMenRt	;Numero de mensagem no retorno
	LDD	rp18H,Z+FLAGPH	;Flag de habilitacao do programa
	CLC			;Limpa o carry
	TST	rp16L		;Impressao no avanco ?
	BRNE	INVME0		;Sim
	TST	rp16H		;Impressao no retorno ?
	BRNE	INVME2		;Sim, seta para o retorno
	CLZ			;Limpa o flag de zero
	RET			;Sem impressao, sai
INVME0:	TST	rp16H		;Impressao no retorno ?
	BREQ	INVMEA		;Nao, seta para o avanco
;Se impressao no avanco e retorno
	LDDW	rp14,Y+Pexec	;Posicao de execucao
	LDDW	rp16,Z+posini
	CPW	rp16,rp14	;Retornando ?
	BREQ	INVMEA		;Sim, seta para o avanco
	LDDW	rp16,Z+posfim
	CPW	rp16,rp14	;Avancando ?
	BREQ	INVMER		;Sim, seta para o retorno
	RET
INVMEA:	SBRC	rp18H,LOGREV	;Reverso ?
	RJMP	INVME3		;Ligada no avanco
INVME1:	LDI	rp18L,'A'	;Indica que o reverso foi ligado
	SBIC	pPrtRv,sInvMen	;Print reverso ?
	RET			;Nao
	SBI	pPrtRv,sInvMen	;Sim
	RJMP	INVME4		;Nao, e mudanca no reverso transmite a strings
;
INVME2:	SEZ			;Seta o flag de zero
INVMER:	SBRC	rp18H,LOGREV	;Reverso ?
	RJMP	INVME1		;Ligado no avanco
INVME3:	LDI	rp18L,'R'	;Indica que o reverso foi desligado
	SBIS	pPrtRv,sInvMen	;Print reverso ?
	RET			;Sim
	CBI	pPrtRv,sInvMen	;Nao
INVME4:	RCALL	ENVIMPRES	;Nao, e mudanca no reverso transmite a strings
	CLZ			;Limpa o flag de zero
	RET
;
;************************************************************************
;									*
;			Inicializacao do Programa			*
;									*
;************************************************************************
RESET:
	LDIW	rp16,RAMEND	;Inicializa pilha
	OUTW	SP,rp16
	LDIW	Z,RAMPRG	;Endereco dos parametros do programa
	LDIW	Y,RAMINT	;Endereco dos parametros da interrupcao
;Limpa a memoria
	LDIW	X,RAMINT	;Inicializa pilha
	LDI	rp16L,0
RESET0:	ST	X+,rp16L
	CPIW	X,RAMEND+1
	BRNE	RESET0
;Verifica os parametros da eeprom e ou flasch
	rcall	iniprg		;Carrega programa da eprom
	RCALL	inipar		;Inicializa os parametros essenciais
;
;Configuracao das portas (0=entrada 1=saida)
	ldi	rp16H,0B01110000	;=$70h
	out	DDRA,rp16H
	ldi	rp16H,0B00000000
	ldi	rp16H,0B11111110	;=$FE
	out	DDRB,rp16H
	ldi	rp16H,0B10011011	;=$9B
	out	DDRC,rp16H
	ldi	rp16H,0B01100110	;=$66
	out	DDRD,rp16H
	ldi	rp16H,0B00000000	;=$0
	out	DDRE,rp16H		;3 pinos a mais que o at8515
;
	ldi	FlagI,$05	;Habilidado impressao com1 e zero index (0D)
	ldd	rp18L,Z+FLAGPH	;Flag de habilitacao do programa
	BST	rp18L,LOGIMP	;Logica do sinal de impressao
	BLD	flagI,3
	sbrc	FlagI,3		;Verifica logica do sinal de de impressao
	cbi	pPrtRv,sPrintGo	;Desativa o sinal de impressao com 0
	sbrs	FlagI,3		;Verifica logica do sinal de de impressao
	sbi	pPrtRv,sPrintGo	;desativa o sinal de impressao com 1
	sbic	pinc,2		;Verifica o estado do sinal do zero index
	SBR	flagI,1<<1	;Atualiza o bit do zero index
;
	ldd	rp18H,Z+FLAGPL	;Flag de habilitacao do programa
	ldd	rp18L,Y+FlgStaX	;Flag de habilitacao auxiliar
	sbic	PINA,3		;Sinal de start, era PINA,0
	SBR	rp18L,1<<7	;Inicializa o bit do start anterior
	sbrs	rp18H,LSEXTE	;Logica do sinal de start em FLAGPL
	SUBI	rp18L,1<<7	;Logica do sinal, de 1 para 0 inverte
	std	Y+FlgStaX,rp18L
;
	LDD	rp18L,Y+FlgStaY	;Flag de habilitacao auxiliar
	SBIC	PINA,2		;Sinal de start entre eixo
	SBR	rp18L,1<<7	;Inicializa o bit do start anterior
	SUBI	rp18L,1<<7	;Logica do sinal, de 1 para 0 inverte
	STD	Y+FlgStaY,rp18L
;
	sbi	PORTA,5		;Desliga ok para o PLC BAHIA SUL
	SBI	PORTA,6		;Sim, desliga o pistao ??Bahia sul verificar??
	ldi	rp16H,0B00100000	;Fim de curso menos invertido
	STD	Z+CONFC,rp16H	;Logica dos pinos da porta C
;
;Valor do comparador A para divisao do contador 1
	LDIW	rp16,511	;Valor low do divisor
	MOVEW	Vdiv,rp16
	STDW	Y+ndiv,Vdiv
	MOVEW	Cdiv,Vdiv
;
;reseta movimento do motor
;	cbi	PORTC,0		;Modo de passo = 200
	sbi	PORTC,0		;Modo de passo = 400
	CBR	FLAGI,(1<<4)+(1<<5)	;Desliga a aceleracao e a desaceleracao, motor parado
	cbi	PORTC,1		;Diminue o nivel de corrente do motor.
	cbi	PORTC,4		;Zera o clock do motor.
	cbi	PORTC,7		;Desenergisa o motor.
;
;Inicializa as porta serial.
	LDIW	Z,PONCOM1	;Ponteiro da com1
	RCALL	INICOM1		;Inicializa os parametros da porta serial com1
	LDIW	Z,PonUart2	;Ponteiro da Uart2
	RCALL	IniUart2	;Inicializa a Uart2
	LDIW	Z,PonUart3	;Ponteiro da Uart3
	RCALL	IniUart3	;Inicializa a Uart3
;	RCALL	PartidaQuente3	;Sai enviando dado ;so para teste @@@
	LDIW	Z,PONCOM2	;Ponteiro da com2
	RCALL	INICOM2		;Inicializa os parametros da porta serial com2
	;As duas linhas abaixo fixa a taxa de comunicacao da com2 como uma constante de programa.
	LDIW	rp16,(2*FCLOCK/BAUD2/nAmost+1)/2	;Divisor para 2400 baud Rate
	STDW	Z+DivCom,rp16
;	RCALL	TesteCom	;Sai com um bloco em ponto de bala para enviar ;so para teste @@@
;
	LDIW	Z,RAMPRG	;Endereco dos parametros do programa
	in	rp18H,PINC
	LDD	rp18L,Z+CONFC	;Logica dos pinos da porta C
	EOR	rp18H,rp18L
	STD	Z+FLAGC,rp18H	;Salva porta C
;
	IN	rp18L,pPrtRv
	SBR	rp18L,(1<<sP3) +(1<<sP2) +(1<<sP1) +(1<<sP0)
	OUT	pPrtRv,rp18L
;
	LDI	rp18L,1<<SerManual
	STD	Z+CTRSER,rp18L	;Controle via serial
;
	LDIW	rp18,$FFFF
	STDW	Y+SobraIntTmp,rp18	;Menor tempo de sobra da rotina intTmp
	STDW	Y+tmpint,rp18	;Restante do tempo que restante da interrupcao
	LDI	rp18L,1<<ZerIndInv	;Bit de valor do zero index invalido
	STD	Z+Flagg,rp18L	;Inicializa Flag de Uso Geral

;Inicializa o contador 1, comparador A, comparador B
	CLRW	rp16
	out	TCCR1A,rp16H	;Timer/Conter Constrol Register
	OUTW	TCNT1,rp16
	LDIW	rp16,10
	OUTW	OCR1A,rp16	;Comparador A
	;LDIW	rp16,Ftimer	;Inicializa o valor do Rtimer
	OUTW	OCR1B,rp16	;Comparador B
;
;Configura a interrupcao do comparador A sem prescaler
	ldi	rp16H,(1<<OCIE1A)	;Liga a interupcao dos comparadores (Bit 6)
	out	TIMSK,rp16H	;Habilita a interrupcao do comparador A
	ldi	rp16H,1<<CS10	;Liga o contador 1 Sem prescaler
	out	TCCR1B,rp16H
	sei			;habilita interrupcoes globais
forever:
	rjmp	forever
;
;--------------------------------------------------------------------------
;Inicializa as variaveis programadas
;--------------------------------------------------------------------------
iniprg:	LDIW	rp16,PROGINI	;Posicao inicial do programa na EEPROM
	LDIW	rp18,PROGFIM	;Posicao final do programa na EEP.
	LDIW	Z,RAMPRG	;Endereco dos parametros do programa
	RCALL	ReadEE		;Leitura da eprom e guarda na ram
	LDIW	Z,RAMPRG	;Endereco dos parametros do programa
;Inicializa as variaveis de exeucao
	ldd	rp16L,Z+Ptaco	;Valor do divisor do taco
	mov	Vtaco,rp16L	;Carrega Valor do divisor do taco
	mov	Ctaco,Vtaco	;Valor do divisor do taco
	ldd	rp16L,Z+Pmotor	;Valor do divisor do motor
	mov	Cmotor,rp16L	;Carrega Valor do divisor do motor
	std	Y+Vmotor,Cmotor	;Carrega Valor do divisor do motor
	LDIW	rp16,200
	STDW	Y+prt,rp16

	LDIW	rp16,$8000
	STDW	Y+Patua,rp16
	STDW	Y+PINDE,rp16
	STDW	Z+POSINDE,rp16
	STDW	Y+Pexec,rp16	;Posicao de execucao = posicao inicial
	ret
;
;--------------------------------------------------------------------------
;Leitura	da eprom
;rp16 = Endereco inicial de leitura da EEPROM
;rp18 = Endereco final da leitura da EEPROM
;	Z = Area da sram a ser salvado
;--------------------------------------------------------------------------
ReadEE:	ReadEEP	rp14L,rp16,ReadEE	;Leitura da eprom
	ST	Z+,rp14L
	SUBIW	rp16,-1		;increment address da eeprom
;	INC	rp16L		;increment address
;	BRNE	Reade0
;	inc	rp16H
Reade0:	CPW	rp16,rp18
	brcs	ReadEE
	ret
;
;--------------------------------------------------------------------------
;Escrita da eprom dos parametros
;rp16 = Endereco inicial de escrita da EEPROM
;rp18 = Endereco final da escrita da EEPROM
;	Z = Area da sram a ser salvado
;--------------------------------------------------------------------------
WRITEP:	LDD	rp18L,Z+FLAGG
	SBRC	rp18L,GrvEprAnd	;Gravacao da eprom2 em andamento ?
	RJMP	WRITE0		;Sim
	LDD	rp18H,Z+CTRSER	;Controle via serial
	SBRS	rp18H,SerGrvEpr	;Comando p/ gravacao do programa ?
	RJMP	WRITE6		;Nao
	CBR	rp18H,1<<SerGrvEpr
	STS	RAMPRG+CTRSER,rp18H	;Controle via serial
	SBR	rp18L,1<<GrvEprAnd	;Indica gravacao da eprom2 em andamento
	CBR	rp18L,1<<GrvBlkEpr	;Limpa gravacao de bloco na eprom2
	STS	RAMPRG+FLAGG,rp18L	;Flag de uso geral
WRITE0:	SBRC	rp18L,GrvBlkEpr	;Gravacao de bloco na eprom2 em andamento ?
	RJMP	WRITE1		;sim
	PUSHW	Z		;Sim inicializa a gravacao
	LDIW	Z,RAMPRG	;Primeiro byte a ser gravado parametros do programa
	LDIW	rp16,PROGINI	;Posicao inicial do programa na EEPROM
	LD	rp14L,Z+
	WRITEE	rp16,rp14L,WRITE5	;Grava primeiro byte
	SBR	rp18L,1<<GrvBlkEpr	;Indica gravacao de bloco na eprom2
	STS	RAMPRG+FLAGG,rp18L	;Flag de uso geral
	RJMP	WRITE4
WRITE1:	PUSHW	Z
	LDSW	Z,CNTgEP
WRITE2:	CPI	ZL,low(RAMPRG+fimprg)	;Ultimo byte do usuario, ja gravado ?
	BREQ	WRITE7		;Sim
	INW	rp16,eear	;Nao, Proximo endereco
	ADDIW	rp16,1
	LD	rp14L,Z+
	WRITEE	rp16,rp14L,WRITE5	;Grava proximo byte
WRITE4:	STSW	CNTgEP,Z
WRITE5:	POPW	Z
WRITE6:	RET
WRITE7:	CBR	rp18L,(1<<GrvEprAnd) +(1<<GrvBlkEpr)	;Limpa gravacao da eprom2 em andamento e a gravacao de bloco na eprom2
	STS	RAMPRG+FLAGG,rp18L	;Flag de uso geral
	RJMP	WRITE5
;
;--------------------------------------------------------------------------
;	Leitura otimizada do start externo
;--------------------------------------------------------------------------
start:	ldd	rp18H,Z+FLAGPL	;Flag de habilitacao do programa
	LDI	rp16L,4		;Filtro do sinal
	CLC			;Logica do sinal, de 0 para 1
	sbrs	rp18H,LSEXTE	;Logica do sinal de start em FLAGPL
	SEC			;Logica do sinal, de 1 para 0
	SBIC	PINA,3		;porta e pino do sinal de start
	SBR	rp16L,1<<7	;Nivel atual do sinal
	LDD	rp16H,Y+FlgStaX	;Flag de habilitacao auxiliar
	RCALL	SINsRT		;Verifica o sinal do sensor
	STD	Y+FlgStaX,rp16H	;Flag de habilitacao auxiliar
	BRCC	start3		;Sem sinal
	CLZ			;Limpa flag de zero
	sbrs	rp18H,HSEXTE	;Start externo habilitado ?
	RET			;Limpa flag de zero
	RCALL	start3
	BRCS	start2		;Não esta temporizando, Temporiza
	BRNE	start1		;Esta temporizando, Erro
	RCALL	start2
	BRNE	start0
	LDD	rp18L,Y+masceL	;Mascara de erro
	SBR	rp18L,1<<eSinStaO	;Erro do sinal de start
	STD	Y+masceL,rp18L	;Mascara de erro
start0:	SEZ			;Seta o flag de zero
	RET
start1:	LDD	rp18L,Y+masceL	;Mascara de erro
	SBR	rp18L,1<<eSinStaO	;Erro do sinal de start
	STD	Y+masceL,rp18L	;Mascara de erro
	CLZ			;Limpa o flag de zero
	RET
start2:	LDDW	rp16,Z+tmpext	;Tempo para o start externo
	CPIW	rp16,0
	RJMP	start4
start3:	LDDW	rp16,Y+cntsta
	SUBIW	rp16,1
	BRCS	start5
start4:	STDW	Y+cntsta,rp16
start5:	RET
;
;------------------------------------------------------------------------
; Verifica sinal sem retardo						|
; Entradas:								|
;    carry flag indica a logica do sinal				|
;    rp16L,7 = Valor atual  bit 6 a 0 Valor do filtro			|
;    rp16H,7 = Valor anterior bit 6 a 0 Contador do filtro		|
;    Valor do filtro, minimo=0, maximo=127				|
; Saida:								|
;    carry ativo indica transicao do sinal valido (na logica correta)	|
;    rp16H, bit7=Valor atual, bit0 a 3 contador de repeticao		|
;    rp16L alterado.							|
;------------------------------------------------------------------------
SINsRT:	BRCC	SINsR0		;Ou exclusivo entre o sinal atual e a logica
	SUBI	rp16L,$80	;Complementa o bit 7
SINsR0:	SBRC	rp16L,7		;Ou exclusivo entre o atual e o anterior
	SUBI	rp16H,$80	;Complementa o bit 7
	CLC
	SBRS	rp16H,7		;Mudanca do nivel do sinal ?
	RJMP	SINsR2		;Nao
	DEC	rp16H		;Overflow
	BRVS	SINsR1		;Sim
	ANDI	rp16L,1<<7	;Limpa todos bits exeto o bit 7
	SBR	rp16H,1<<7
	EOR	rp16H,rp16L
	RET
SINsR1:	SBRC	rp16L,7
	SEC
SINsR2:	MOV	rp16H,rp16L
	RET
;	
;--------------------------------------------------------------------------
;Rotina de Verificacao do Zero Index
;--------------------------------------------------------------------------
VRFZINDEX:
	LDD	rp16L,Z+FLAGPH
	SBRS	FlagI,0		;Verifica rotina de Zero Index
	rjmp	VRFZ3		;Se novo valor de Z.Index
	SBRS	rp16L,ZERIHP	;zero index para protecao ?
	RET			;Nao, abandona
	LDWINT	rp14,Y+patua
	LDDW	rp18,Z+posinde
	LDDW	rp16,Z+npulso
	SUBW	rp14,rp18	;rp14=Patua - posinde
	brcc	VRFZ0
	ADDW	rp14,rp16
	BRCS	VRFZ2
	NEGW	rp14		;Complemento de dois |rp14|
	RJMP	VRFZ1
VRFZ0:	SUBW	rp14,rp16	;rp14=|Patua-posinde|-npulso
	BRCS	VRFZ2		;rp14=|Patua-posinde|-npulso < 0
VRFZ1:	LDDW	rp16,Z+janela
	CPW	rp16,rp14
	BRCC	VRFZ2		;Janela >= |Patua-posinde| - npulsos
	ldd	rp18L,Y+masceL	;Mascara de erro
	SBR	rp18L,1<<eSinIndx2	;Erro do zero index
	RJMP	VRFZC		;Janela < |Patua-posinde| - npulsos
VRFZ2:	CLC
	ret
;
;Verifica se condicao para o zeroindex da referencia
VRFZ3:	SBRS	rp16L,ZERIHP	;zero index para protecao ?
	SBRC	rp16L,ZERIHC	;zero index para correcao ?
	RJMP	VRFZZ3		;protecao ou correcao
	RET			;Nao, abandona
VRFZZ3:	LDDW	rp18,Y+pinde
	SBR	Flagi,1<<0	;habilita rotina de z.index
	SBRS	FlagI,4		;Aceleracao ligada ?
	RJMP	VRFZ4		;nao
	sbis	PORTC,DIRMOT	;Direcao positiva ?
	RJMP	VRFZ4		;Nao, direcao negativa
	LDD	rp16H,Z+FLAGC	;Valor anterior da porta C
	SBRS	rp16H,5		;Sinal anterior de fc-
	RJMP	VRFZ4		;Sinal de fc-=0
	ldd	rp16H,Y+statusL
	sbrs	rp16H,Referenciando	;Referenciando ?
	RJMP	VRFZ4		;nao
	LDD	rp16L,Z+FLAGG
	SBRC	rp16L,FinalizRef	;Primeira posicao apos referenciar ?
	RJMP	VRFZ5		;Sim
	SBR	FlagI,1<<5	;Sim, liga a desaceleracao
	CBR	FlagI,1<<4	;Desliga a aceleracao
	RJMP	VRFZF
;
VRFZ4:	LDD	rp16L,Z+FLAGG
	SBRS	rp16L,ZerIndInv		;valor do zero index valido
	RJMP	VRFZ5		;Sim
VRFZF:	CBR	rp16L,1<<ZerIndInv	;Valida o valor do zero index
	STD	Z+FLAGG,rp16L
	STDW	Z+POSINDE,rp18
	ret
;
VRFZ5:	LDDW	rp14,Z+POSINDE
	LDDW	rp16,Z+npulso
	SUBW	rp14,rp18	;rp14=Posinde-Pinde
	BREQ	VRFZB
	LDDW	rp18,Z+janela
	brcc	VRFZ8
	NEGW	rp18		;Complemento de dois da janela
	CPW	rp14,rp18
	BRCC	VRFZB		;(Posinde-Pinde) >= -Janela
	ADDW	rp14,rp16	;rp14=(Posinde-Pinde)+npulso
	BRCS	VRFZ6		;Janela positiva
	CPW	rp14,rp18
	BRCC	VRFZ7		;(Posinde-Pinde)+npulso <= -Janela, OK
	RJMP	VRFZG		;(Posinde-Pinde)+npulso < -Janela, erro
VRFZ6:	NEGW	rp18		;Complemento de dois da janela
	CPW	rp18,rp14
	BRCC	VRFZ7		;(Posinde-Pinde) <= Janela, erro
	RJMP	VRFZG		;(Posinde-Pinde) > Janela, erro
VRFZ7:	LDDW	rp18,Z+POSINDE
	ADDW	rp18,rp16
	STDW	Z+POSINDE,rp18	;Novo valor do zeroindex
VRFZB:	LDD	rp18H,Y+statusL
	ANDI	rp18H,(1<<ReferenciaOk) +(1<<PosExecutada) +(1<<Referenciando) ;limpa tudo exeto esses
	BREQ	VRFZE
	STDW	Y+tstind,rp14	;Valor do erro de posicao
VRFZE:	RET
;
VRFZ8:	CPW	rp18,rp14
	BRCC	VRFZB		;(Posinde-Pinde) <= Janela
	SUBW	rp14,rp16		;rp14=(Posinde-Pinde)-npulso
	brcc	VRFZ9		;(Posinde-Pinde) - npulso >=0
	NEGW	rp18		;Complemento de dois da janela
	CPW	rp14,rp18
	BRCC	VRFZA		;(Posinde-Pinde)-npulso >= -Janela, erro
	RJMP	VRFZG		;(Posinde-Pinde)-npulso < -Janela, erro
VRFZ9:	CPW	rp18,rp14
	BRCS	VRFZG		;(Posinde-Pinde) > Janela, Erro
VRFZA:	LDDW	rp18,Z+POSINDE
	SUBW	rp18,rp16
	STDW	Z+POSINDE,rp18	;Novo valor do zeroindex
	RJMP	VRFZB
;
VRFZG:	LDD	rp18H,Z+FLAGPH
	SBRS	rp18H,ZERIHP	;zero index para protecao ?
	RET			;Nao, abandona
	LDD	rp18L,Y+masceL	;Mascara de erro
	SBR	rp18L,1<<eSinIndx3	;Erro do zero index
VRFZC:	LDD	rp18H,Y+statusL
	ANDI	rp18H,(1<<ReferenciaOk) +(1<<PosExecutada) +(1<<Referenciando) ;limpa tudo exeto esses
	BREQ	VRFZD		;Esta linha habilita o teste do zero index ???&&&???
	STDW	Y+tstind,rp14	;So'para teste do zero index ???###???
	STD	Y+masceL,rp18L	;Mascara de erro
;	RET			;Esta linha cancela o teste do zero index ???&&&???
VRFZD:	ldd	rp18L,Y+statusL
	CBR	rp18L,(1<<ReferenciaOk) +(1<<PosExecutada) +(1<<Referenciando)	;Desliga
	std	Y+statusL,rp18L
	LDD	rp18L,Z+FLAGG
	CBR	rp18L,1<<FinalizRef	;Desliga a finalizacao da referencia
	STD	Z+FLAGG,rp18L
	LDD	rp18L,Z+CTRSER	;Controle via serial
	SBR	rp18L,1<<SerPausa	;Pausa serial
	STD	Z+CTRSER,rp18L	;Controle via serial
	sec
	SBRS	FlagI,4		;Aceleracao ligada ?
	RET			;nao
	SBR	FlagI,1<<5	;Sim, liga a desaceleracao
	CBR	FlagI,1<<4	;Desliga a aceleracao
	ret
;
;--------------------------------------------------------------------------
;Monitora Fim de Curso (chamado por RTimer)
;--------------------------------------------------------------------------
FIMCUR:	LDD	rp18H,Z+CONFC	;Logica dos pinos da porta C
	IN	rp18L,PINC
	eor	rp18H,rp18L
	ldd	rp18L,Z+FLAGC	;Valor anterior da porta C
	sbrs	rp18H,5		;Sinal de fc- atual
	rjmp	FIMCU0		;Se fc- atual igual a 0
	sbrc	rp18L,5		;Sinal anterior de fc-
	rjmp	FIMCU3		;Sinal de fc- de 1 para 1
;Sinal de fc- de 0 para 1, (saindo do fim de curso)
	SBR	rp18L,1<<5	;Sinal de fc- de 0 para 1
	STD	Z+FLAGC,rp18L	;Salva valor de fc-
	LDD	rp18H,Y+statusL
	SBRS	rp18H,Referenciando	;Referenciando ?
	RET			;Nao
	LDWINT	rp14,Y+Patua	;Salva a posicao atual na posicao de execucao
	STDW	Y+Pexec,rp14
	ldd	rp16L,Z+FLAGPH
	SBRS	rp16L,ZERIHP	;zero index para protecao ?
	SBRC	rp16L,ZERIHC	;zero index para correcao ?
	RET			;protecao ou correcao, Aguarda o zero index
	RJMP	FIMCU4	;Nem protecao nem correcao, (Salta para etapa final da ref)
;
FIMCU0:	sbrc	rp18L,5		;Sinal de fc- anterior
	RJMP	FIMCU1		;Sinal de FC- de 1 para 0 freia
;
;Sinal de FC de 0 para 0, (Encima do fim de curso)
	SBRC	FLAGI,4		;Aceleracao ligada ?
	ret			;Sim
	SBRC	FLAGI,5		;Desaceleracao ligada ?
	ret			;Sim
	LDDW	rp16,Y+cntaut
	SUBIW	rp16,1
	brcc	FIMCU2		;Se start automatico, retorna
FIMCU2:	RET
;
;Sinal de FC- de 1 para 0 (Entrando no fim de curso)
FIMCU1:	CBR	rp18L,1<<5
	STD	Z+FLAGC,rp18L	;Salva Fc- atual
	ldd	rp18H,Y+statusL
	sbrs	rp18H,Referenciando	;Referenciando ?
	RJMP	FIMCU2		;Nao
	LDD	rp18L,Z+FLAGG	;Sim
	sbrc	rp18L,FinalizRef	;Finalizacao da referencia ?
	RET			;Sim
	CBR	rp18H,1<<ReferenciaOk	;zera bit de Referenciado ###???###
	STD	Y+statusL,rp18H	;Salva:	nao referenciado
FIMCU4:	SBRS	FlagI,4		;Aceleracao ligada ?
	RET			;nao
	SBR	FlagI,1<<5	;Sim, liga a desaceleracao
	CBR	FlagI,1<<4	;Desliga a aceleracao
;	ret
;
;Sinal de fc- de 1 para 1
FIMCU3:	ret			;nao
;
;--------------------------------------------------------------------------
;Esta rotina e' executada sempre antes de o motor entrar em movimento
;--------------------------------------------------------------------------
REFER:	LDD	rp16H,Y+statusL		;
	sbrc	rp16H,ReferenciaOk	;Referenciado ?
	JMP	CALCPE		;Sim, nova posicao de execucao
;
	sbrc	rp16H,Referenciando	;Referenciando ?
	RJMP	REFER0		;Sim
	LDIW	rp18,$8000
	STDW	Y+Patua,rp18
	STDW	Y+PINDE,rp18
	STDW	Z+POSINDE,rp18
	LDI	rp18L,1<<ZerIndInv	;Bit de valor do zero index invalido
	STD	Z+Flagg,rp18L	;Inicializa Flag de Uso Geral
	ldd	rp16L,Z+FLAGC	;Valor anterior da porta C
	sbrs	rp16L,5
	RJMP	REFER1		;fc- anterior 1, direcao positiva
;
;fc- anterior 0, direcao negativa
	LDIW	rp18,0
	RCALL	REFER2
	SEC
	RET
;
REFER0:	ldd	rp16L,Z+FLAGC	;Valor anterior da porta C
	SBRC	rp16L,5
	RJMP	REFER3		;fc- anterior 0, direcao negativa
;
;Direcao positiva
REFER1:	LDIW	rp18,$FFFF
	RCALL	REFER2
	CLC
	RET
REFER2:	SBR	rp16H,1<<Referenciando	;Indica referenciando
	STD	Y+statusL,rp16H	;Flag de status
	STDW	Y+Pramp,rp18	;Posicao do inicio da rampa
	LDDW	rp2,Z+Arefer	;Aceleracao para referencia
	rcall	CincVe		;Velocidade incremental e velocidade minima
	LDDW	rp16,Z+Vrefer	;Velocidade de referencia
	STDW	Y+Vmax,rp16	;Velocidade maxima
	CLZ			;Limpa o flag de zero
	RET
;
;Aqui ja esta referenciado so falta ir para posicao inicial
REFER3:	LDD	rp18L,Z+FLAGG	;Finalizacao da referencia
	SBR	rp18L,1<<FinalizRef
	STD	Z+FLAGG,rp18L
	lddw	rp14,Z+VALREF	;Sim, posicao atual = VALREF
	LDDW	rp16,Y+Pexec
	SUBW	rp14,rp16	;Valor a ser somado a PATUA
;
	LDDW	rp16,Y+Patua	;Salva a posicao atual na posicao de execucao
	ADDW	rp16,rp14
	STDW	Y+Patua,rp16
;
	LDDW	rp16,Y+PINDE
	ADDW	rp16,rp14
	STDW	Y+PINDE,rp16
;
	LDDW	rp16,Z+POSINDE
	ADDW	rp16,rp14
	STDW	Z+POSINDE,rp16
;
;Primeira posicao de execucao
	ldd	rp18L,Z+FLAGPL	;Flag de habilitacao do programa
	sbrs	rp18L,STAUTA	;Start automatico no avanco ?
	RJMP	REFER4		;Desligado, vai para posicao inicial
	sbrc	rp18L,STAUTR	;Start automatico no retorno ?
	RJMP	REFER4		;Se ligado, posicao inicial
	LDDW	rp14,Z+posfim	;Se desligado, posicao final
	RJMP	REFER5		;Se modo continuo
REFER4:	LDDW	rp14,Z+posini
REFER5:	STDW	Y+PEXEC,rp14	;na posicao de execucao
	RCALL	INIPOS		;Sim, inicializa o movimento
	BRNE	REFER7
	RCALL	VRFREF		;Se já esta na posicao
	CP	rp18L,rp18L	;Limpa o flag de zero
REFER7:	RET
;
;--------------------------------------------------------------------------
;Apo's o fim do movimento, verifica se esta referenciando
;--------------------------------------------------------------------------
VRFREF:	LDD	rp18L,Y+statusL
	CLC			;Limpa o carry
	SBRS	rp18L,Referenciando	;Referenciando ?
	RJMP	VRFRF3		;Nao
VRFRF0:	LDD	rp18H,Z+FLAGG
	SBRS	rp18H,FinalizRef	;Finalizacao da referencia ?
	RJMP	VRFRF4		;Nao
	CBR	rp18H,1<<FinalizRef	;Sim, desliga finalizacao da referencia
	STD	Z+FLAGG,rp18H
	CBR	rp18L,1<<Referenciando	;Desliga referenciando
	SBR	rp18L,1<<ReferenciaOk	;Liga referenciado
	LDDW	rp16,Y+Pexec	;Posicao de execucao
	LDDW	rp14,Z+posini
	CPW	rp14,rp16
	BRNE	VRFRF1
	SBI	PORTC,DIRMOT	;Seta direcao positiva
	RJMP	VRFRF2
VRFRF1:	CBI	PORTC,DIRMOT	;Seta direcao negativa
VRFRF2:	CLR	rp18H
	STD	Y+nummen,rp18H
	SEC			;Seta o carry
VRFRF3:	CBR	rp18L,1<<PosExecutada	;Posicao executada
	STD	Y+statusL,rp18L	;Flag de status
	RET
VRFRF4:	LDIW	rp16,100	;Tempo para o start automatico p/ referencia
	STDW	Y+cntaut,rp16	;Contador para o start automatico
	SEC			;Seta o carry
	RET
;
;------------------------------------------------------------------------
;	Leitura otimizada do start externo				/
;	Na saida o carry ativo indica sinal de start OK			/ 
;------------------------------------------------------------------------
STARTY:	LDD	rp18H,Z+FLAGPL	;Flag de habilitacao do programa
	CLC			;Limpa flag de zero
	SBRS	rp18H,ESENTR	;Start entre eixo habilitado ?
	RET			;Nao
	LDI	rp16L,4		;Filtro do sinal
	SEC			;Logica do sinal, de 1 para 0
	SBIC	PINA,2		;porta e pino do sinal do start entre eixo
	SBR	rp16L,1<<7	;Nivel atual do sinal
	LDD	rp16H,Y+FlgStaY	;Flag de habilitacao auxiliar
	RCALL	SINsRT		;Verifica o sinal do sensor
	STD	Y+FlgStaY,rp16H	;Flag de habilitacao auxiliar
	LDD	rp16L,Z+Flagg	;Flag de Uso Geral
	BRCC	STARY0		;Sem sinal
	SBRS	rp16L,StaEntEixP	;Start entre eixo pendente ?
	RJMP	STARY1		;Não, OK
	LDD	rp18L,Y+masceL	;Mascara de erro
	SBR	rp18L,1<<eSinStaO	;Erro do sinal de start
	STD	Y+masceL,rp18L	;Mascara de erro
	RJMP	STARY2
STARY0:	SBRC	rp16L,StaEntEixP	;start entre eixo pendente ?
	RJMP	STARY2		;Sim
	RET			;Não
STARY1:	SBR	rp16L,1<<StaEntEixP	;Ativa start entre eixo pendente
	STD	Z+Flagg,rp16L	;Flag de Uso Geral
STARY2:	CLC
	SBRC	FLAGI,4		;Motor acelerando ?
	RJMP	STARY3		;Sim
	SBRC	FLAGI,5		;Motor desacelerando ?
	RJMP	STARY3		;Sim
	CBR	rp16L,1<<StaEntEixP	;Limpa start entre eixo pendente
	STD	Z+Flagg,rp16L	;Flag de Uso Geral
	LDD	rp18L,Y+statusL
	SBRS	rp18L,ReferenciaOk	;Referenciado ?
	RET			;Nao, retorna
	SEC
STARY3:	RET
;
CalDiv_Ilha:	RJMP	CalDiv
PISTAO_Ilha:	RJMP	PISTAO
Pista0_Ilha:	RJMP	Pista0
.include "NovaSer0.bib"
CALCUTIL_Ilha:	RJMP	CALCUTIL
.include "..\BIBN\CODEBOX8.bib"	;Biblioteca de comunicacao com a Domino
.include "..\BIBN\serial39.bib"
.include "..\BIBN\movretu9.bib"	;****
.include "..\BIBN\operac4B.bib"
;
;--------------------------------------------------------------------------------
;	Pistao Fornece:								/
;	Sinal de start para o outro eixo					/
;	Saida para o pistao pnelmatico						/
;	Sinal de impressão passo a passo					/
;--------------------------------------------------------------------------------
;   Se (Direcao = Avanco) ?							/
;   Sim										/
;	Se (Modo= Continuo) ?							/
;	Sim									/
;	    Se SSAUTA = Ligado ?						/
;	    Sim									/
;		Se Pexec <> PosFim ?						/
;	    	Sim								/
;		    Indica erro de parametros alterado durante o ciclo		/
;		Força a saida de start para o outro eixo			/
;	Não (Modo Passo a passo)						/
;	    processa o sinal de impressao passo a passo				/
;	    Se (Sinal de impressao inicializado) e (Se SstaPP = Ligado) ?	/
;	    Sim									/
;		Força a saida de start para o outro eixo			/
;	    Não									/
;		Se (Pexec >= PosFim) e (SSAUTA = Ligado) ?			/
;		Sim								/
;		    Força a saida de start para o outro eixo			/
;   Não (Direcao = Retorno) ?							/
;	Se (Modo= Continuo) ?							/
;	Sim									/
;	    Se SSAUTR = Ligado ?						/
;	    Sim									/
;		Se Pexec <> PosIni ?						/
;	    	Sim								/
;		    Indica erro de parametros alterado durante o ciclo		/
;		Força a saida de start para o outro eixo			/
;	Não (Modo Passo a passo)						/
;	    processa o sinal de impressao passo a passo				/
;	    Se (Sinal de impressao inicializado) e (Se SstaPP = Ligado) ?	/
;	    Sim									/
;		Força a saida de start para o outro eixo			/
;	    Não									/
;		Se (Pexec <= PosIni) e (SSAUTA = Ligado) ?			/
;		Sim								/
;		    Força a saida de start para o outro eixo			/
;--------------------------------------------------------------------------------
;Entrada normal
Pistao:	LDD	rp18L,Y+statusL
	SBRS	rp18L,ReferenciaOk	;Referenciado ?
	RET			;Nao
	RCALL	StaOut		;Verifica o start entre eixo
	LDD	rp18H,Y+FLGpis	;Flag de controle do pistao
	SBRC	FLAGI,4		;Motor acelerando ?
	RJMP	Pista1		;Sim
	SBRC	FLAGI,5		;Motor desacelerando ?
	RJMP	Pista1		;Sim
	CBR	rp18H,(1<<AntecipOk)	;Limpa pistão
	STD	Y+FLGpis,rp18H	;Flag de controle do pistao
	RET			;Nao, Motor parado
;Entrada forçada
Pista0:	LDD	rp18H,Y+FLGpis	;Flag de controle do pistao
	SBRC	rp18H,AntecipOk	;Já passou pela posicao de antecipação ?
	RET			;Sim
	LDDW	rp4,Y+Pexec	;Posicao de execucao
	SBIS	PORTC,DIRMOT	;Direcao do movimento ?
	RJMP	Pista5		;Negativo
	RJMP	Pista2		;Positivo
Pista1:	SBRC	rp18H,AntecipOk	;Já passou pela posicao de antecipação ?
	RET			;Sim
	LDDW	rp4,Y+Pexec	;Posicao de execucao
	LDDW	rp2,Z+Antcin	;Cota de antecipacao do start entre eixos (pinelmatico)
	LDWINT	rp16,Y+Patua	;Posicao atual
	SBIS	PORTC,DIRMOT	;Direcao do movimento ?
	RJMP	Pista4		;Negativo
    ;Pistao para direcao positiva
	ADDW	rp16,rp2	;Chegou na posicao do start entre eixo ?
	BRCS	Pista2		;Sim
	CPW	rp16,rp4
	BRCS	PistaA		;Nao, sai
Pista2:	LDDW	rp16,Z+FLAGP	;Flags de habilitacao do programa
	SBRC	rp16H,MODPP	;Modo passo a passo ?
	RJMP	Pista3		;Sim
	SBRS	rp16L,SSAUTA	;Saida de start para o outro eixo no avanco ?
	RJMP	Pista9		;Não, Sai
	RJMP	Pista8		;Sim, Forca saida de start entre eixo
	;Modo passo a passo no avanco
Pista3:	RCALL	ImpPaP		;Verifica se sinal de impressao
	LDD	rp16H,Z+FLAGPE	;Flags de habilitacao especial do programa
	SBRC	rp16H,SstaPP	;Força ?
	BRCS	Pista8		;Sim
	LDD	rp16L,Z+FLAGPL	;Flags de habilitacao do programa
	CPW	rp4,rp18	;Pexec >= PosFim ?
	BRCS	Pista9		;Não
	SBRC	rp16L,SSAUTA	;Saida de start para o outro eixo no avanco ?
	RJMP	Pista8		;Sim
	RJMP	Pista7		;Não
    ;Pistao para direcao negativa
Pista4:	SUBW	rp16,rp2	;Chegou na posicao do start entre eixo ?
	BRCS	Pista5		;Sim
	CPW	rp4,rp16
	BRCS	PistaA		;Nao, Sai
Pista5:	LDDW	rp16,Z+FLAGP	;Flags de habilitacao do programa
	SBRC	rp16H,MODPP	;Modo passo a passo ?
	RJMP	Pista6		;Sim
	SBRS	rp16L,SSAUTR	;Saida de start para o outro eixo no retorno ?
	RJMP	Pista9		;Não, Sai
	RJMP	Pista8		;Sim, Forca saida de start entre eixo
	;Modo passo a passo no retorno
Pista6:	RCALL	ImpPaP		;Verifica se sinal de impressao
	LDD	rp16H,Z+FLAGPE	;Flags de habilitacao especial do programa
	SBRC	rp16H,SstaPP	;Força ?
	BRCS	Pista8		;Sim
	LDD	rp16L,Z+FLAGPL	;Flags de habilitacao do programa
	CPW	rp14,rp4	;PosIni >= Pexec ?
	BRCS	Pista9		;Não
	SBRC	rp16L,SSAUTR	;Saida de start para o outro eixo no retorno ?
	RJMP	Pista8		;Sim
Pista7:	SBRC	rp16H,STautPP	;Start automatico passo a passo ?
	RJMP	Pista9		;Sim, Não interfere
	LDD	rp18L,Y+FlgStaY	;Não, forca um start entre eixo interno
	SBR	rp18L,1<<4	;Força entrada de start entre eixo
	STD	Y+FlgStaY,rp18L	;Flag de habilitacao auxiliar
	RJMP	Pista9
Pista8:	CBI	PORTA,6		;Liga o start entre eixo
Pista9:	LDD	rp18L,Y+FLGpis	;Flag de controle do pistao
	SBR	rp18L,1<<AntecipOk	;Seta antecipacao OK
	STD	Y+FLGpis,rp18L	;Flag de controle do pistao
PistaA:	RET
;
StaOut:	LDD	rp18H,Z+CntPist	;Contador do tempo para start entre eixo
	SUBI	rp18H,1
	BRCS	StaOu1		;O valor ja era zero
	STD	Z+CntPist,rp18H	;Contador do tempo para start entre eixo
	BRNE	StaOu0		;Contando tempo
	SBI	PORTA,6		;Sim, desliga o pistao
StaOu0:	RET
StaOu1:	SBIC	PORTA,6		;Pistao Ligado
	RET			;Não
	LDI	rp18H,10	;Largura do start entre eixo
	STD	Z+CntPist,rp18H	;Contador da largura do start entre eixo
	RET	
;
;--------------------------------------------------------------------------------
;		Inicializa o sinal de impresão passo a passo			/
;--------------------------------------------------------------------------------
;   Se (Modo = Passo a passo) ?							/
;   Sim										/
;	Se (PosIni > Pexec) ou (Pexec > PosFim)					/
;	Sim									/
;	    Indica erro de parametros alterado durante o ciclo			/
;	Se (Direcao = Avanco) ?							/
;	Sim									/
;	    Se Pexec >= PosFim ?						/
;	    Sim									/
;		Se (nMenAvs > 0) ?						/
;		Sim								/
;		    Se nMenAvs = 1 ?						/
;		    Sim								/
;			Se (PosIni > pIa) ou (pIa > PosFim)			/
;			Sim							/
;			    pImp = PosIni					/
;			Não							/
;			    pImp = pIa						/
;			Se Pexec = pImp ?					/
;			Sim							/
;			    Inicializa o retardo do sinal de impressão		/
;		    Não	(nMenAvs >q 1)						/
;			Se (uIa > PosFim) ou (PosIni > uIa) ?			/
;			Sim							/
;			    uImp = PosFim					/
;			Se Pexec = uImp ?					/
;			Sim							/
;			    Inicializa o retardo do sinal de impressão		/
;	    Não (Pexec < PosFim)						/
;		Se (nMenAvs > 0) ?						/
;		Sim								/
;		    Inicializa o retardo do sinal de impressão			/
;	Não (Retorno)								/
;	    Se Pexec <= PosIni ?						/
;	    Sim									/
;		Se (nMenRet > 0) ?						/
;		Sim								/
;		    Se nMenRet = 1 ?						/
;		    Sim								/
;			Se (PosIni > pIr) ou (pIr > PosFim)			/
;			Sim							/
;			    pImp = PosFim					/
;			Não							/
;			    pImp = pIr						/
;			Se Pexec = pImp ?					/
;			Sim							/
;			    Inicializa o retardo do sinal de impressão		/
;		    Não	(nMenRet >q 1)						/
;			Se (uIr < PosIni) ou (uIa > PosFim) ?			/
;			Sim							/
;			    uImp = PosIni					/
;			Se Pexec = uImp ?					/
;			Sim							/
;			    Inicializa o retardo do sinal de impressão		/
;	    Não (Pexec > PosIni)						/
;		Se (nMenRet > 0) ?						/
;		Sim								/
;		    Inicializa o retardo do sinal de impressão			/
;--------------------------------------------------------------------------------
; So para o modo passo a passo							/
; Entrada: rp4=Pexec								/
; Saidas: rp14=PosIni, rp18=PosFim, Se carry ativo Posicao de impresão OK	/
;--------------------------------------------------------------------------------
ImpPaP:	LDDW	rp18,Z+posfim
	LDDW	rp14,Z+posini
	MOVEW	rp2,rp4		;rp2 =Pexec
	RCALL	ImpPa9		;Se carry PosImp é PosIni ou PosFim
	BRCC	ImpPa0
	RCALL	ErMudPar	;Indica mudanca de parametros no instante errado (Modifica rp16H)
ImpPa0:	SBIS	PORTC,DIRMOT	;Direcao do movimento ?
	RJMP	ImpPa7		;Negativo
    ;Direção positiva
	LDD	rp16L,Z+nMenAv	;Numero de mensagem no avanco
	CPW	rp4,rp18	;Pexec >= PosFim ?
	BRCS	ImpPa5		;Nao
	;Pexec >= PosFim
	CPI	rp16L,1
	BRCS	ImpPa6		;Se nMenAv=0
	BRNE	ImpPa3		;Se nMenAv>1
	    ;nMenAv=1
	RCALL	AjPrAv		;rp2 =Primeira impressao no avanco ajustada
ImpPa1:	CPW	rp2,rp4
	BRNE	ImpPa6
ImpPa2:	LDD	rp16L,Y+FLGpis	;Flag de controle do pistao
	SBR	rp16L,1<<ImpressOk	;Indica que é uma posicao de impressão
	STD	Y+FLGpis,rp16L	;Flag de controle do pistao
	LDDW	rp16,Z+TEMPPT	;Retardo para o sinal de impressao
	ADDIW	rp16,1
	STDW	Z+CNTPT,rp16	;Contador do retardo para o sinal de impressao
	SEC
	RET
	    ;Se nMenAv>1
ImpPa3:	LDDW	rp2,Z+uPrtAV	;Ultima impressao programada/avanco
	RCALL	ImpPa9		;Se carry PosImp é PosIni ou PosFim
	BRCC	ImpPa4
	MOVEW	rp2,rp18	;Mensagem = PosFim
ImpPa4:	CPW	rp4,rp2		;Pexec = uImp ?
	BREQ	ImpPa2
	RJMP	ImpPa6
	;Pexec < PosFim
ImpPa5:	TST	rp16L
	BRNE	ImpPa2		;Se nMenAv>0
ImpPa6:	CLC
	RET			;Não
    ;Direção negativa
ImpPa7:	LDD	rp16L,Z+nMenRt	;Numero de mensagem no retorno
	CPW	rp14,rp4	;PosIni >= Pexe  ?
	BRCS	ImpPa5		;Nao
	;PosIni >= Pexe  ?
	CPI	rp16L,1
	BRCS	ImpPa6		;Se nMenAv=0
	BRNE	ImpPa8		;Se nMenAv>1
	    ;nMenRt=1
	RCALL	AjPrRt		;rp2 =Primeira impressao no retorno ajustada
	RJMP	ImpPa1
ImpPa8:	LDDW	rp2,Z+uPrtRt	;Ultima impressao programada/avanco
	RCALL	ImpPa9		;Se carry PosImp é PosIni ou PosFim
	BRCC	ImpPa4
	MOVEW	rp2,rp14	;Mensagem = PosIni
	RJMP	ImpPa4
	;Se carry PosImp é PosIni ou PosFim
ImpPa9:	CPW	rp2,rp14	;Mensagem <q PosIni ?
	BRCS	ImpPaA		;Sim
	CPW	rp18,rp2	;PosFim <q Mensagem ?
ImpPaA:	RET

;
;---------------------------------------------------------------------------------------/
;	Funcões dos start automatico e da saida de start				/
;---------------------------------------------------------------------------------------/
; - Start automatico do avanco tem efeito:						/
;	- No avanco do modo continuo							/
;	- Pexec =PosFim no modo passo a passo						/
; - Start automatico do retorno tem efeito:						/
;	- No avanco do modo continuo							/
;	- Pexec =PosIni no modo passo a passo						/
; - Start automatico passo a passo :							/
;	- Não tem nenhum efeito no modo continuo					/
;	- Tem efeito em todas posicoes de impressoes no modo passo a passo		/
;	- Se ouver sobreposicão com o start automatico no avanco ou retorno		/
;	este será tratado como start automatico pendente quando terminar o		/
;	retardo do start automatico passo a passo.					/
; - Saida de start no avanco:								/
; 	- só tem efeito avancando para a posicao final					/
; - Saida de start no retorno:								/
; 	- só tem efeito retornando para a posicao inicial				/
; - saida de start passo a passo:							/
;	- Não tem nenhum efeito direto no modo continuo					/
;	- Tem efeito em todas posicoes de impressoes no modo passo a passo		/
;	- Se ouver sobreposião com a saida de start no avanco ou retorno apenas		/
;	um deles será considerado.							/
; Obs:											/
; - Nas posicoes iniciais e finais são necessario dois start um para inverter a		/
; direcao (que pode ser qualquer um dos start) e outro que pode ser um start		/
; externo ou automatico que startar propriamente o eixo.				/
;---------------------------------------------------------------------------------------/
;
;---------------------------------------------------------------------------------------/
;	Rotina para ser colocada na rotina de calculo da posicao executada		/
;---------------------------------------------------------------------------------------/
;Avancando e recebe um start nMenAva >q 0						/
;    Se Pexec <= PosIni ?								/
;    Sim										/
;	Se NumMen > 0 ?									/
;	Sim										/
;	    Indica erro de parametros alterado durante o ciclo				/
;       Não										/
;	    Se Pexec < PosIni ?								/
;		Indica erro de parametros alterado durante o ciclo			/
;	NumMen = 1									/
;	pImp =PIa									/
;	Se PosIni > pIa ?								/
;	Sim										/
;	    pImp =PosIni								/
;	Se Pexec < pImp ?								/
;	Sim										/
;	    Executa Pexec = pImp							/
;	Nao										/
;	    Inicializa retardo da impressao						/
;	    Verifica Saida de start passo a passo					/
;	    Verifica start automatico passo a passo					/
;    Nao										/
;	Se Pexec >= PosFim ?								/
;	Sim										/
;	    Se NumMen <> nMenAvs ?							/
;	    Sim										/
;		Indica erro de parametros alterado durante o ciclo			/
;	    Seta a direcão de retorno							/
;	    NumMen = 0									/
;	    Se (Start automatico não processado) e (Start automatico no retorno) ?	/
;	    Sim										/
;		Inicializa retardo do start automatico					/
;	Nao (PosIni < Pexec < PosFim)							/
;	    Se (NumMen = nMenAvs) ?							/
;	    Sim										/
;		Executa Pexec = PosFim							/
;		?????									/
;	    Nao										/
;		Se (NumMen = 0) ou (NumMen > nMenAvs) ?					/
;		Sim									/
;		    Indica erro de parametros alterado durante o ciclo			/
;		nPexec = pIa +NumMen*(uIa-pIa)/(nMenAvs-1)				/
;		Inc(NumMen)								/
;		Se nPexec <= Pexec ?							/
;		Sim									/
;		    Indica erro de parametros alterado durante o ciclo			/
;		    Força um start para o proximo rtime					/
;		Não									/
;		    Executa nPexec							/
;											/
;Retornando e recebe um start nMenRet >q 0						/
;    Se Pexec >= PosFim ?								/
;    Sim										/
;	Se NumMen > 0 ?									/
;	Sim										/
;	    Indica erro de parametros alterado durante o ciclo				/
;	    NumMen = 0									/
;       Não										/
;	    Se Pexec < PosFim ?								/
;		Indica erro de parametros alterado durante o ciclo			/
;	NumMen = 1									/
;	pImp =PIr									/
;	Se PosFim < pIr ?								/
;	Sim										/
;	    pImp =PosFim								/
;	Se Pexec > pImp ?								/
;	Sim										/
;	    Executa Pexec = pImp							/
;	Nao										/
;	    Inicializa retardo da impressao						/
;	    Verifica Saida de start passo a passo					/
;	    Verifica start automatico passo a passo					/
;    Nao										/
;	Se Pexec <= PosIni ?								/
;	Sim										/
;	    Se NumMen <> nMenAvs ?							/
;	    Sim										/
;		Indica erro de parametros alterado durante o ciclo			/
;	    Seta a direcão de Avanço							/
;	    NumMen = 0									/
;	    Se (Start automatico não processado) e (Start automatico no retorno) ?	/
;	    Sim										/
;		Inicializa retardo do start automatico					/
;	Nao (PosIni < Pexec < PosFim)							/
;	    Se (NumMen = nMenAvs) ?							/
;	    Sim										/
;		Executa Pexec = PosIni							/
;		?????									/
;	    Nao										/
;		Se (NumMen = 0) ou (NumMen > nMenAvs) ?					/
;		Sim									/
;		    Indica erro de parametros alterado durante o ciclo			/
;		nPexec = pIr -NumMen*(pIr-uIr)/(nMenRet-1)				/
;		Inc(NumMen)								/
;		Se nPexec >= Pexec ?							/
;		Sim									/
;		    Indica erro de parametros alterado durante o ciclo			/
;		    Força um start para o proximo rtime					/
;		Não									/
;		    Executa nPexec							/
;											/
;---------------------------------------------------------------------------------------/
;************************************************************************
;*									*
;* "Calcpe"	- Calculo da posicao de execucao para o modo continuo	*
;*		e passo a passo						*
;* Formula:								*
;*	Passo/passo	Pini+[(NdaParada)*(Pfim-Pini)/(NdeParada)]	*
;*	Continuo	Pexec=Pini se Pexec=Pfim e vice versa		*
;*									*
;* entrada:	rp14=posicao inicial					*
;*		rp18=posicao final					*
;*		rp16H=Numero de parada corrente				*
;*		rp16L=Numero total de parada				*
;* saida:	rp18=Posicao da proxima parada				*
;*									*
;* Number of words	:???						*
;* Number of cycles	:(Max/Min) 240/224				*
;* Low registers used	:6 (rp2,rp4,rp14)				*
;* High registers used	:4 (rp18,rp16)					*
;************************************************************************
CALCPE:	LDD	rp16L,Y+FLGpis	;Flag de controle do pistao
	CBR	rp16L,1<<ImpressOk	;Indica que a mensagem já foi incrementada
	STD	Y+FLGpis,rp16L	;Flag de controle do pistao
	LDD	rp16L,Z+FLAGPH	;Flag de habilitacao do programa
	LDDW	rp4,Y+Pexec	;Posicao de execucao
	LDDW	rp18,Z+posfim
	LDDW	rp14,Z+posini
	SBRC	rp16L,MODPP	;Modo passo a passo ?
	RJMP	CALCP6		;Sim
;Modo Continuo
	SBIS	PORTC,DIRMOT	;Direcao do movimento ?
	RJMP	CalcP2		;Negativo
    ;Direção positiva
CalcP0:	CPW	rp4,rp14	;Pexec = PosIni ?
	BREQ	CalcP1		;Sim, busca PosFim
	RCALL	ErMudPar	;Indica mudanca de parametros no instante errado (Modifica rp16H)
	CPW	rp4,rp18	;Pexec = PosFim ?
	BREQ	CalcP3		;Sim, busca PosIni
CalcP1:	STDW	Y+PEXEC,rp18	;Executa a posicao rp18
	LDDW	rp14,Z+pPrtAv	;Primeira impressao programada/avanco
	LDD	rp16L,Z+nMenAv	;Numero de mensagem no avanco
	RJMP	CalcP4
    ;Direção negativa
CalcP2:	CPW	rp4,rp18	;Pexec = Posfim ?
	BREQ	CalcP3		;Sim, busca PosIni
	RCALL	ErMudPar	;Indica mudanca de parametros no instante errado (Modifica rp16H)
	CPW	rp4,rp14	;Pexec = PosIni ?
	BREQ	CalcP1		;Sim, busca PosFim
CalcP3:	STDW	Y+PEXEC,rp14	;Executa a posicao inicial
	LDDW	rp14,Z+pPrtRt	;Primeira impressao programada/Retorno
	LDD	rp16L,Z+nMenRt	;Numero de mensagem no retorno
CalcP4:	STDW	Y+prt,rp14	;Primeira posicao de impressao
	TST	rp16L		;Numero de mensagem no avanco
	BREQ	CalcP5
	SBR	FlagI,1<<2	;habilita o sinal de impresao
CalcP5:	LDI	rp16H,1
	STD	Y+NUMmen,rp16H	;Numero de mensagem corrente
	RJMP	INIPOS
;Modo passo a passo
CALCP6:	LDD	rp16H,Y+NUMmen	;Numero de mensagem corrente
	SBIS	PORTC,DIRMOT	;Direcao do movimento ?
	RJMP	DirNeg		;Negativo
    ;Direção positiva
DirPos:	LDD	rp16L,Z+nMenAv	;Numero de mensagem no avanco
	CPW	rp14,rp4	;PosIni < Pexec
	BRCS	DirPo6		;Sim
	;Pexec <= PosIni
	BREQ	DirPo0		;Se PosIni = Pexec, Ok
	RCALL	ErMudPar	;Indica mudanca de parametros no instante errado (Modifica rp16H)
DirPo0:	TST	rp16L
	BREQW	DirPoB		;Se nenhuma impressao (nMenAv =0)
DirPo1:	RCALL	AjPrAv		;rp2 =Primeira impressao no avanco ajustada
	CPW	rp4,rp2		;Pexec < pImp ?
	BRCSW	DirNe3		;Sim, Executa rp2
	LDD	rp16H,Y+NUMmen	;Numero de mensagem corrente
	CPI 	rp16H,1		;NUMmen ?
	BRCS	DirPo3		;NUMmen=0
	BREQ	DirPo2		;NUMmen=1
	RCALL	ErMudPar	;NUMmen>1, Indica mudanca de parametros no instante errado (Modifica rp16H)
	LDI 	rp16H,1		;NUMmen
	STD	Y+NUMmen,rp16H	;Numero de mensagem corrente
DirPo2:	CPI	rp16L,2
	BRCC	DirPoE		;nMenRt >=2)
	RJMP	DirPoC
DirPo3:	LDI 	rp16H,1		;NUMmen
	STD	Y+NUMmen,rp16H	;Numero de mensagem corrente
	LDDW	rp16,Z+TEMPPT	;Retardo para o sinal de impressao
	ADDIW	rp16,1
	STDW	Z+CNTPT,rp16	;Contador do retardo para o sinal de impressao
	LDD	rp18H,Z+FLAGPE	;Flags de habilitacao especial do programa
	SBRS	rp18H,SstaPP	;Saida de start passo a passo ?
	RJMP	DirPo4		;Desligado
	CBI	PORTA,6		;Ligado, Liga o start entre eixo
	SBRS	rp18H,STautPP	;Start automatico passo a passo ?
	RJMP	DirPo5		;Não
DirPo4:	LDDW	rp16,Z+TempPP	;Retardo para o start automatico passo a passo
	ADDIW	rp16,1
	STDW	Y+CntAut,rp16	;Contador para o start automatico
DirPo5:	CP	rp16L,rp16L
	RET
DirPo6:	CPW	rp4,rp18	;Pexec < PosFim
	BRCS	DirPo9		;Sim
	;Pexec >= PosFim
	BRNE	DirPo7		;Se Pexec > PosFim, Erro
	CP	rp16H,rp16L	;NUMmen = nMenAv ?
	BREQ	DirPo8		;Sim
	DEC	rp16H		
	CP	rp16H,rp16L	;(NUMmen-1) = nMenAv ?
	BREQ	DirPo8		;Sim
DirPo7:	RCALL	ErMudPar	;Indica mudanca de parametros no instante errado (Modifica rp16H)
	    ;Inverte a direção
DirPo8:	CBI	PORTC,DIRMOT	;Seta direcao de movimento de retorno
	SUB	rp16H,rp16H	;rp16H=0
	STD	Y+NUMmen,rp16H	;Numero de mensagem corrente
	RET
	;PosIni < Pexec < PosFim
DirPo9:	TST	rp16L
	BREQ	DirPoB		;Se nenhuma impressao (nMenAv =0)
	CP	rp16H,rp16L	;NUMmen < nMenAv ?
	BRCS	DirPoD		;Sim
	BREQ	DirPoA		;NUMmen = nMenAv, OK
	RCALL	ErMudPar	;Indica mudanca de parametros no instante errado (Modifica rp16H)
	RJMP	DirPoC
DirPoA:	INC	rp16L		;rp16L=rp16H
DirPoB:	STD	Y+NUMmen,rp16L	;Numero de mensagem corrente
DirPoC:	STDW	Y+PEXEC,rp18	;Executa a posicao rp18 =PosFim
	RJMP	INIPOS
DirPoD:	TST	rp16H		;NUMmen = 0 ?
	BRNE	DirPoE		;Não, Ok
	RCALL	ErMudPar	;Indica mudanca de parametros no instante errado (Modifica rp16H)
	RJMP	DirPo1
	    ;Calculo da nova posição
DirPoE:	RCALL	AjPrAv		;rp2 =Primeira impressao no avanco ajustada
	RCALL	AjUlAv		;rp4 =Ultima impressao avanco ajustada
	MOVEW	rp14,rp2
	MOVEW	rp18,rp4
	RCALL	CALCUTIL	;rp18=rp14+rp16H*(rp18-rp14)/(rp16L-1) ;nPexec=pIa+NumMen*(uIa-pIa)/(nMenAvs-1)
	BRCSW	Calcp7
	LDD	rp16H,Y+NUMmen	;Numero de mensagem corrente
	INC	rp16H
	STD	Y+NUMmen,rp16H	;Numero de mensagem corrente
	LDDW	rp4,Y+Pexec	;Posicao de execucao
	CPW	rp4,rp18	;Pexec < novo Pexec em rp18
	BRCS	DirPoC		;Sim, Executa novo Pexec
	    ;Nao Indica erro e força novo start
DirPoF:	RCALL	ErMudPar	;Indica mudanca de parametros no instante errado (Modifica rp16H)
	LDIW	rp16,1
	STDW	Y+CntAut,rp16	;Contador para o start automatico
	RJMP	DirPo5
    ;Direção negativa
DirNeg:	LDD	rp16L,Z+nMenRt	;Numero de mensagem no retorno
	CPW	rp4,rp18	;Pexec < PosFim
	BRCS	DirNe6		;Sim
	;Pexec >= PosFim
	BREQ	DirNe0		;Se Pexec > PosFim, Erro
	RCALL	ErMudPar	;Indica mudanca de parametros no instante errado (Modifica rp16H)
DirNe0:	TST	rp16L
	BREQ	DirNeB		;Se nenhuma impressao (nMenRt =0)
DirNe1:	RCALL	AjPrRt		;rp2 =Primeira impressao no retorno ajustada
	CPW	rp2,rp4		;pImp < Pexec ?
	BRCS	DirNe3		;Sim, Executa rp2
	LDD	rp16H,Y+NUMmen	;Numero de mensagem corrente
	CPI 	rp16H,1		;NUMmen ?
	BRCSW	DirPo3		;NUMmen=0
	BREQ	DirNe2		;NUMmen=1
	RCALL	ErMudPar	;NUMmen>1, Indica mudanca de parametros no instante errado (Modifica rp16H)
	LDI 	rp16H,1		;NUMmen
	STD	Y+NUMmen,rp16H	;Numero de mensagem corrente
DirNe2:	CPI	rp16L,2
	BRCC	DirNeE		;nMenRt >=2)
	RJMP	DirNeC
DirNe3:	LDD	rp16H,Y+NUMmen	;Numero de mensagem corrente
	Tst 	rp16H		;NUMmen = 0
	BREQ	DirNe4		;Sim Ok
	RCALL	ErMudPar	;Indica mudanca de parametros no instante errado (Modifica rp16H)
DirNe4:	LDI 	rp16H,1		;NUMmen
	STD	Y+NUMmen,rp16H	;Numero de mensagem corrente
	STDW	Y+PEXEC,rp2	;Sim, Executa a posicao rp2
	RJMP	INIPOS
DirNe6:	CPW	rp14,rp4	;Posini < Pexec
	BRCS	DirNe9		;Sim
	;Pexec <= PosIni
	BRNE	DirNe7		;Se Pexec > PosFim, Erro
	CP	rp16H,rp16L	;NUMmen = nMenRt ?
	BREQ	DirNe8		;Sim
	DEC	rp16H		
	CP	rp16H,rp16L	;(NUMmen-1) = nMenAv ?
	BREQ	DirNe8		;Sim
DirNe7:	RCALL	ErMudPar	;Indica mudanca de parametros no instante errado (Modifica rp16H)
	    ;Inverte a direção
DirNe8:	SBI	PORTC,DIRMOT	;Seta direcao de movimento de avanço
	SUB	rp16H,rp16H	;rp16H=0
	STD	Y+NUMmen,rp16H	;Numero de mensagem corrente
	RET
	;PosIni < Pexec < PosFim
DirNe9:	TST	rp16L
	BREQ	DirNeB		;Se nenhuma impressao (nMenRt =0)
	CP	rp16H,rp16L	;NUMmen < nMenRt ?
	BRCS	DirNeD		;Sim
	BREQ	DirNeA		;NUMmen = nMenRt, OK
	RCALL	ErMudPar	;Indica mudanca de parametros no instante errado (Modifica rp16H)
	RJMP	DirNeC
DirNeA:	INC	rp16L		;rp16L=rp16H
DirNeB:	STD	Y+NUMmen,rp16L	;Numero de mensagem corrente
DirNeC:	STDW	Y+PEXEC,rp14	;Executa a posicao rp14 =PosIni
	RJMP	INIPOS
DirNeD:	TST	rp16H		;NUMmen = 0 ?
	BRNE	DirNeE		;Não, Ok
	RCALL	ErMudPar	;Indica mudanca de parametros no instante errado (Modifica rp16H)
	RJMP	DirNe1
	    ;Calculo da nova posição
DirNeE:	RCALL	AjPrRt		;rp2 =Primeira impressao no retorno ajustada
	RCALL	AjUlRt		;rp4 =Ultima impressao retorno ajustada
	MOVEW	rp18,rp2
	MOVEW	rp14,rp4
		;rp16H =rp16L-(rp16H-1)
	SUB	rp16H,rp16L
	SUBI	rp16H,-1
	NEG	rp16H		;=/rp16H +1 =/(rp16H-1)
		;
	RCALL	CALCUTIL	;rp18=rp14+rp16H*(rp18-rp14)/(rp16L-1) ;nPexec=pIa+NumMen*(uIa-pIa)/(nMenRet-1)
	BRCS	Calcp7
	LDD	rp16H,Y+NUMmen	;Numero de mensagem corrente
	INC	rp16H
	STD	Y+NUMmen,rp16H	;Numero de mensagem corrente
	LDDW	rp4,Y+Pexec	;Posicao de execucao
	CPW	rp18,rp4	;novo Pexec em rp18 < Pexec
	BRCSW	DirPoC		;Sim, Executa novo Pexec
	RJMP	DirPoF	    ;Nao Indica erro e força novo start
;
Calcp7:	RCALL	ErMudPar	;Indica mudanca de parametros no instante errado (Modifica rp16H)
	CP	rp16H,rp16H
	RET
;
ErMudPar:
	LDD	rp16H,Y+masceL	;Mascara de erro
	SBR	rp16H,1<<eMudPar	;Mudanca de parametros no instante errado
	STD	Y+masceL,rp16H	;Mascara de erro
	RET
;	
AjPrAv:	LDDW	rp2,Z+pPrtAv	;Primeira impressao programada/avanco
	CPW	rp2,rp14	;pPrtAv < PosIni ?
	BRCS	AjPrA1		;Sim
	CPW	rp18,rp2	;PosFim < pPrtAv ?
	BRCC	AjPr00		;Não
	CPI	rp16L,1		;Numero de mensagem no avanco
	BRNE	AjPrA1		;>q 1
AjPrR1:	MOVEW	rp2,rp18	;=1, pPrtAv = PosFim
AjPr00:	RET
;
AjPrRt:	LDDW	rp2,Z+pPrtRt	;Primeira impressao programada/retorno
	CPW	rp18,rp2	;PosFim < pPrtRt ?
	BRCS	AjPrR1		;Sim
	CPW	rp2,rp14	;pPrtAv < PosIni ?
	BRCC	AjPr00		;Não
	CPI	rp16L,1		;Numero de mensagem no avanco
	BRNE	AjPrR1		;>q 1
AjPrA1:	MOVEW	rp2,rp14	;Não, pPrtAv = PosIni
	RET
;
AjUlAv:	LDDW	rp4,Z+uPrtAv	;Ultima impressao programada/avanco
	CPW	rp18,rp4	;PosFim < uPrtAv ?
	BRCS	AjUlA0		;Sim
	CPW	rp4,rp14	;uPrtAv < PosIni ?
	BRCC	AjUl00		;Não
AjUlA0:	MOVEW	rp4,rp18	;=1, pPrtAv = PosFim
AjUl00:	RET
;
AjUlRt:	LDDW	rp4,Z+uPrtRt	;Ultima impressao programada/retorno
	CPW	rp18,rp4	;PosFim < uPrtRt ?
	BRCS	AjUlR0		;Sim
	CPW	rp4,rp14	;uPrtRt < PosIni ?
	BRCC	AjUl00		;Não
AjUlR0:	MOVEW	rp4,rp14	;Não, pPrtAv = PosIni
	RET
;************************************************************************
;*									*
;* "Calcutil"	- Util para o calculo da posicao de execucao no modo	*
;*		passo a passo, e para o calculo da posicao do sinal de	*
;*		impressao no modo continuo				*
;*									*
;* Formula:								*
;*	rp18 = rp14+[(rp16H)*(rp18-rp14)/(rp16L)]			*
;*									*
;* Number of words	:???						*
;* Number of cycles	:(Max/Min) (247/228/102)			*
;* Low registers used	:2 (rp14L,rp14H)				*
;* High registers used	:4 (rp18H:rp18L,rp16H,rp16L)			*
;************************************************************************
CALCUTIL:
	SUBI	rp16L,1
	BRCS	CALCU2
	SUBW	rp18,rp14
	RCALL	Mult16x8	;rp0L:rp18 =rp18*rp16H
	MOV	rp16H,rp16L
	CP	rp0L,rp16H
	BRCC	CALCU3		;Resulta valor > que 65536
	PUSH	rp14H		;Salva valor menor
	MOV	rp14H,rp0L
	RCALL	DIVIR8		;rp18H=rp14H:rp18H/rp16H
	MOV	rp16L,rp18H	;Salva divisao (MSB)
	MOV	rp18H,rp18L	;Restaura Multiplicacao LSB
	RCALL	DIVIR8		;rp18H=rp14H:rp18H/rp16H e rp14H=resto
	MOV	rp18L,rp18H	;Dicisao MSB e LSB em rp18
	MOV	rp18H,rp16L
	MOV	rp16L,rp14H	;Salva o resto
	POP	rp14H
	ADDW	rp18,rp14
	BRCS	CALCU2		;Se erro
	ADD	rp16L,rp16L
	BRCS	CALCU0		;Arredonda
	CP	rp16L,rp16H
	BRCS	CALCU1		;Nao arrendonda
CALCU0:	ADDIW	rp18,1
	BRNE	CALCU1		;Se OK
	SEC
	RET
CALCU1:	CLC			;Limpa i carry
CALCU2:	RET
CALCU3:	SEC
	RET			;Resulta valor > que 65536
;
;******************************************************************************
;		Rotinas nao utilizadas
;******************************************************************************
;
;Sinal autorizando o avanco do trasnportador da Bahia Sul
;	LEITOK: LDD	rp18L,Y+tmpsysL
;		ANDI	rp18L,7		;Multiplo de 8 ?
;		BRNE	LEITK3		;Nao
;		LDD	rp18L,Z+CTRSER	;Controle via serial
;		SBRS	rp18L,SerLeitOkBhs	;Sinal de anvanco OK ?
;		RJMP	LEITK2		;Nao, Reseta erro
;	;
;		LDD	rp18H,Z+cntbh	;Contador de tempo de pulso para BS
;		SUBI	rp18H,1		;Fim do tempo ?
;		BRCC	LEITK0		;Talves
;		LDI	rp18H,1000/8	;Inicio do tempo = 1 segundo
;		TST	rp18H		;Se tempo = 0 ?
;		BREQ	LEITK1		;Nao, retorna
;		STD	Z+cntbh,rp18H	;Contador de tempo de pulso para BS
;		SBI	PORTA,6		;Nao, retorna
;		RET
;	LEITK0:	STD	Z+cntbh,rp18H	;Contador de tempo de pulso para BS
;		BRNE	LEITK3		;Nao fim do tempo
;	LEITK1:	CBR	rp18L,1<<SerLeitOkBhs	;Sinal de anvanco OK ?
;		STD	Z+CTRSER,rp18L	;Controle via serial
;		CBI	PORTA,6		;Nao, retorna
;	LEITK3:	RET
;	LEITK2:	CBI	PORTA,6		;Nao, retorna
;		LDI	rp18H,0
;		STD	Z+cntbh,rp18H	;Contador de tempo de pulso para BS
;		RET
;	;
;	;Verifica nova posicao de selecao para o modo passo a passo
;	VSELEC:	LDD	rp16L,Y+NUMmen	;Numero de mensagem corrente
;		SBRC	FLAGI,4		;Aceleracao ?
;		RET			;Ligada
;		SBRC	FLAGI,5		;Desaceleracao ?
;		RET			;Ligada
;	VSELE0:	LDDW	rp14,Y+Pexec	;Posicao de execucao
;		LDDW	rp18,Z+posini
;		SBIC	PORTC,DIRMOT	;Direcao do movimento ?
;		rjmp	VSELE1		;Positivo
;		CPW	rp18,rp14	;Final do movimento ?
;		BRCC	VSELE2		;Sim, Pexec <= PosIni
;		DEC	rp16L
;		RET
;	VSELE1:	LDDW	rp18,Z+posfim
;		CPW	rp14,rp18	;Final do movimento ?
;		BRCC	VSELE2		;Sim, Pexec >= PosFim
;		INC	rp16L
;	VSELE2:	RET
;	;
;	;Saida para a porta paralela, somente para o modo passo a passo
;	OUTPARALELA:
;		LDD	rp18H,Y+statusL
;		SBRS	rp18H,ReferenciaOk	;Referenciado ?
;		rjmp	outparalela0	;Nao, Nada faz
;		sbis	PINA,1		;Sinal de impressao bloqueado ?
;		cbr	FlagI,1<<2	;Sim, desabilita a impressao
;		ldd	rp16H,Y+nummen	;Nao
;		ldi	rp16L,0		;Limpa o valor da porta
;		sbrc	rp16H,0		;Bit 0 do valor
;		SBR	rp16L,1<<sP0	;Bit 0 da porta
;		sbrc	rp16H,1		;Bit 1 do valor
;		SBR	rp16L,1<<sP1	;Bit 1 da porta
;		sbrc	rp16H,2		;Bit 2 do valor
;		SBR	rp16L,1<<sP2	;Bit 2 da porta
;		sbrc	rp16H,3		;Bit 3 do valor
;		SBR	rp16L,1<<sP3	;Bit 3 da porta
;		cli
;		IN	rp16H,pPrtRv
;		CBR	rp16H,(1<<sP3) +(1<<sP2) +(1<<sP1) +(1<<sP0)
;		or	rp16H,rp16L	;Atualiza o valor da porta
;		out	pPrtRv,rp16H
;		sei
;		ldd	rp16H,Z+FLAGPH	;Flag de habilitacao do programa
;		SBRS	rp16H,MODPP	;Modo passo a passo ?
;		RJMP	outparalela3	;Nao
;		ldd	rp16H,Y+nummen	;Sim
;		tst	rp16H
;		brne	outparalela0
;	outparalela3:
;		SBRC	rp18H,sttAceler	;Acelerando ?
;		rjmp	outparalela2	;Sim
;		SBRC	rp18H,sttDesacel	;Desacelerando ?
;		rjmp	outparalela2	;Sim
;		sbi	porta,4		;Desativa o sinal de movimentando
;		cbi	PORTA,5		;Ativa pronto para iniciar o ciclo
;		ret
;	outparalela0:
;		SBRC	rp18H,sttAceler	;Acelerando ?
;		rjmp	outparalela2	;Sim
;		SBRC	rp18H,sttDesacel	;Desacelerando ?
;		rjmp	outparalela2	;Sim
;		sbi	porta,4		;Desativa o sinal de movimentando
;		sbi	PORTA,5		;Desativa pronto para iniciar o ciclo
;		ret
;	outparalela2:
;		cbi	porta,4		;Ativa o sinal de movimentando
;		sbi	PORTA,5		;Desativa pronto para iniciar o ciclo
;		ret
;
;	Atualiza mensagem na porta paralela e serial
;	SELMEN:	LDD	rp18H,Y+statusL
;		SBRS	rp18H,ReferenciaOk	;Referenciado ?
;		RET			;Nao, Nada faz
;		LDD	rp16H,Y+NUMmen	;Numero de mensagem corrente corrente
;		LDD	rp18L,Z+FLAGPH	;Flag de habilitacao do programa
;		SBRC	rp18L,MODPP	;Modo passo a passo ?
;		RJMP	SELME0		;Sim
;		SBIS	PORTC,DIRMOT	;direcao do motor ?
;		RJMP	SELME2		;Negativa
;		MOV	rp16L,rp16H
;		LDD	rp16H,Z+nMenAv	;Numero de mensagem no avanco
;		SUB	rp16H,rp16L
;		RJMP	SELME3
;	SELME0:	SBIC	PORTC,DIRMOT	;direcao do motor ?
;		RJMP	SELME1		;Positiva
;		RJMP	SELME1		;Negativa, falta debugar
;	SELME1:	TST	rp16H		;Zero
;		BRNE	SELME3
;	SELME2:	INC	rp16H
;	SELME3:	LDD	rp16L,Y+NUMmenA	;Valor anterior
;		CP	rp16L,rp16H
;		BREQ	SELME4
;		STD	Y+NUMmenA,rp16H	;Numero de mensagem corrente
;		INC	rp16H
;		COM	rp16H
;		LDI	rp16L,0		;Limpa o valor da porta
;		SBRC	rp16H,0		;Bit 0 do valor
;		SBR	rp16L,1<<sP0	;Bit 0 da porta
;		SBRC	rp16H,1		;Bit 1 do valor
;		SBR	rp16L,1<<sP1	;Bit 1 da porta
;		SBRC	rp16H,2		;Bit 2 do valor
;		SBR	rp16L,1<<sP2	;Bit 2 da porta
;		SBRC	rp16H,3		;Bit 3 do valor
;		SBR	rp16L,1<<sP3	;Bit 3 da porta
;		CLI
;		IN	rp18H,pPrtRv
;		CBR	rp18H,(1<<sP3) +(1<<sP2) +(1<<sP1) +(1<<sP0)
;		OR	rp18H,rp16L	;Atualiza o valor da porta
;		OUT	pPrtRv,rp18H
;		SEI
;		LDI	rp18L,'A'	;Indica que o proximo movimento sera' de avanco
;		LDD	rp18H,Z+FLAGPH	;Flag de habilitacao do programa
;		RCALL	ENVIMPRES	;Selecao Ligada, transmite strings
;	SELME4:	RET
;
;Sofware Cmpp00LG tamanho =1C33	=7219 bytes =3610 Word	Sobra =486
;Este software cmpp09ad	 =1E11	=7697 bytes =3849 Word	Sobra =247

;  	Devem ser consertado
;- Quando se para na posicao final no avanco ou posiçao inicial no retorno e não for uma
;  posiçao de impressao não se deve contar totalmento o start automatico passo a passo (Testando)
;- A cota de antecipaçao quando zero tem que funcionar	(Testando)

;  	Devem ser criado os parametros
;- O numero da primeira mensagem no avanco
;- O numero da primeira mensagem no retorno
;- A direção de contagem de impressao no retorno
;- Seleçao por impressao/Direçao simples
;- retardo do start entre eixo
;- Tempo bico 1
;- Tempo bico 2
;- Tempo bico 3

;- Numero de multipla impressao
;- Passo de multipla impressão
;- Selecão por impressao multipla

;- Passo da contagem da mensagem
;- Impressoes adicionais no avanço
;- Passar o processador para o AtMega8515
;	LDD	rp18L,Z+iMenAv	;Sim, Numero de mensagem no avanco
;	STD	Y+iMensag,rp18L	;Numero da proxima mensagem
; Total utilizado por programa 31 parametros e 37 bytes

;Eliminar a variavel "NUMmenA"

;---------------------------------------------------------
;Se tiver uma composicao entre a mensagem X e Y
;Apos a ultima impressao do movimento X, o eixo solicita a mensagem corrente do eixo Y

;Se a mensagem for independente
;Só o eixo X:
;	Já possue a mensagem e a direcao para a comunicação (ok).
;Só o eixo Y:
;	Falta a direçao do eixo X para o reverso se necessario
;	A direçao deve ser fornecida pelo eixo X
;	O instante da comunicacao deve ser avisado pelo eixo X apos a ultima impressao do movimento
;	O instante da comunicacao pode ser definido pelo retardo do sinal de impressao
;
;A troca da mensagem do eixo Y deve ocorrer apos a ultima impressao do movimento X
;
;
;1 2 3 4 5 6 7 8 9
;
;Start no avanco
;Start no retorno
;Apos o start deve ser avisado a direçao do movimento
;Apos a ultima impressao dever ser enviado do movimento deve
;
; Fornece start Ts=3mS	1110000
; Assim que recebe um start
;	Fornece direcao positiva	Tp=5ms 111110000
;	Fornece direcao negativa	Tn=7ms 11111110000

;C = A*(T/2)²	C=Curso total	A=Aceleraçao	T=tempo do deslocamento


; 3Tt = 4Tr	Tr/Tt=3/4 =0,75
;
;
;			Tcnt	rH rL rx
;In	rH,Ocr1aH	00FF	00 xx xx
;In	rL,Ocr1aL	0100	00 00 xx
;In	rx,Ocr1aH	0101	00 00 01
;cpse	rx,rH		0102
;Mov	rH,rX		0203	01 00 01

;			Tcnt	rH rL rx
;In	rH,Ocr1aH	00FE	00 xx xx
;In	rL,Ocr1aL	00FF	00 FF xx
;In	rx,Ocr1aH	0100	01 FF 01
;cpse	rx,rH		0102
;Mov	rH,rX		0203	01 00 01

;			Tcnt	rH rL rx C	Tcnt	rH rL rx C	Tcnt	rH rL rx C	Tcnt	rH rL rx C	
;In	rx,Ocr1aL	00FD	xx xx FD x	00FE	xx xx FE x      00FF	xx xx FF x	0100	xx xx 00 x	
;In	rH,Ocr1aH	00FE	00 xx FD x	00FF	00 xx FE x      0100	01 xx FF x	0101	01 xx 00 x	
;In	rL,Ocr1aL	00FF	00 FF FD x	0100	00 00 FE x      0101	01 01 FF x	0102	01 02 00 x	
;SUB	rX,rL		0100	00 FF FE 1	0101	00 00 FE 0      0102	01 01 FE 0	0103	01 02 FE C 	
;BRCC	Pula		0101			0102		        0103			0104			
;In	rH,Ocr1aH	0102			0103	01 00	        0104    01 01 		0105			

;Tempo para interrupcão:
;	Apos a interrupcao conta os 2 estados seguintes para o processamento da interrupçao
;	O numero de estados da intrucao seguinte apos o processamento da interrupção
;	E mais 3 estados do CALL da interrupão proprimamente dito
;	Tempo minimo de uma interrupão = 2 +1 +3 =6 estados
;
;Ocr1A	Tcnt1	CycleCounter
;60B4	60B3	30346	B5
;	60B5	30348	B7
;	60BC	30355	7              8
;
;62A8	62A7	30846	A9
;	62A9	30848	AB
;	62AE	30853	5              6
;
;649C	649A	31345	9C
;	649C	31347	9E
;	649E	31349	A0
;	64A3	31354	5              7
;
;-----------------------------------------
;
;Ocr1A	Tcnt1	CycleCounter
;60B4	60B3	30346	B4	;15
;	60B4	30347	B5	;16
;	60B5	30348	B6	;17
;	60B6	30349	B7	;18
;	60BA	30353	4              6
;				;19
;
;62A8	62A7	30846	A8	;19
;	62A8	30847	A9	;20
;	62A9	30848	AB	;Forever
;	62AE	30853	5              6
;				;01
;649C	649A	31345	9C
;	649C	31347	9D	;01
;	649D	31348	9E	;02
;	649E	31349	9F	;03
;	64A2	31353	4              6
;				;04
;
;-----------------------------------------
;
;Ocr1A	Tcnt1	CycleCounter		Ciclos par concluir a intrução
;60B3	60B3	30346	Call	B6	3
;	60BA	30353		7
;			Ret
;
;62A8	62A7	30846	Call	AA	2
;	62AE	30853		7
;			Ret
;
;649C	649A	31345	Call	9D	1
;	649E	31349	Ret	A2
;	64A5	31356		7
;			Rjmp
;
;6690	6690	31847	Rjmp	92	2
;	6692	31849	Call	95
;	6699	31856		7
;			Ret
;
;6884	6885	32348	Call	88	3+1
;	688C	32355		7
;			Ret
;
;
;6A78	6A78	32847	Call	7B	3
;	6A7F	32355		8
;			Ret
;
;6C6C	6C6D	33348	Ret	71	4+1
;	6C74	33355		8
;			Ret
;
;00		LDD	itmpL,Y+flagZ
;02		ADD	itmpL,itmpL
;03		SBIC	pinc,2		;Zero index ?
;04		SBR	itmpL,1<<0	;Se 1, Seta bit0
;05		STD	Y+flagZ,itmpL
;07		AndI	itmpL,$0F
;08		SBRS	FlagI,1		;Zero index anterior ?
;09		RJMP	Winde0 ;(11)	;=1
	;Se nivel corrente é 1
;10		BRNE	Winde2	;(13)	;O nivel se manteve
;11		CBR	flagI,1<<1	;Zero index 1 para 0
;12		sbiS	PORTC,3		;Direcao do movimento ?
;13		Ret		;(18)	;Negativa
;14		LDD	ItmpL,Y+Patua
;16		RJMP	Winde1	;18
	;Se nivel corrente é 0
;11	Winde0:	CPI	itmpL,15
;12		BRNE	Winde2	;(14)	;O nivel se manteve
;13		SBR	flagI,1<<1	;Zero index 0 para 1
;14		sbiC	PORTC,3		;Direcao do movimento ?
;15		Ret		;(18)	;Positiva
;16		LDD	ItmpL,Y+Patua
;18		ADDIW	Itmp,4
;20/18	Winde1:	STDW	Y+Pinde,Itmp	;Salva posicao atual no zero index
;24		CBR	flagI,1<<0	;Desabilita o Zero index
;25	Winde2:	RET	;(29/27)(17/18)

;Se Ocr1A deve sempre acontecer depois de Ocr1B ou Ocr1A-Ocr1B>50
;Clock	BaudRat	Divisor	Pescal	OCRO	Erro
;8mHZ	2400	833,33	8	104	-0,16%
;8mHZ	3600	555,55	8	69	-0,64%
;8mHZ	4800	416,66	8	52	-0,16%
;8mHZ	7200	277,77	8	35	-0,80%
;8mHZ	9600	208,33	8	26	-0,16%

;A interrupção de Ocr1A não pode ser retardada, por isso se ela ocorrer apos ocr0 tem que ter
;tempo suficiente para ocr0 processar a parte critica e só pode acontecer
;apos ou ocorrer 
;0 < (Ocr1A-Tcnt1)-8*(Ocr0-Tcnt0) < 60	CycleCounter

;Rotina de interrupçao principal para a saida de taco
;09	IntTac:	IN	ssreg,sreg	;Salva os flags
;10		DEC	RegPresTaco
;11		BRNE	IntTa1	;(13)
;12		LDD	RegPresTaco,MenPresTaco	;Novo prescaler
;14		LDDW	RegDivTaco,MenDivTaco	;Novo divisor
;18		SBIC	PortTac,PinTac
;19		RJMP	IntTa0	;(21)
;20		SBI	PortTac,PinTac
;22		RJMP	IntTa1	;(24)
;21	IntTa0:	CBI	PortTac,PinTac
;24/13	IntTa1:	IN	tmpax,TiFr	;(25/14);Verifica se interrupção
;25		INW	Itmp,OCR1b
;27		ADDW	Itmp,RegDivTaco
;29		OUTW	OCR1b,Itmp
;31		SBRS	tmpax,Ocf1A
;32		RJMP	IntMo8		;34/23+5
;33		LDI	ItmpH,1<<Ocf1A
;34		OUT	TIFR,ItmpH	;Limpa a interrupcao do comparador1A
;35		RJMP	IntMo0		;37/26
;
;	;Rotina de interrupçao principal para a saida do motor
;09	IntMot:	IN	ssreg,sreg	;Salva os flags
;10	IntMo0:	DEC	RegPresMot
;11		BRNE	IntMo7	;(13)
;12		LDD	RegPresMot,MenPresMot	;Novo prescaler
;14		LDDW	RegDivMot,MenDivMot	;Novo divisor
;18		SBIS	PortMot,PinMot
;19		RJMP	IntMo4	;(21)
;20		CBI	PortMot,PinMot
;22		LDDW	Itmp,Y+Patua
		;Sinal de impresão
;26		sbrs	FlagI,2		;Verifica se sinal de impressao esta habilitado
;27		RJMP	IntMo1	;(29)	;Se sinal de impresao desabilitado
;28		LDD	tmpax,Y+prtH
;30		CPSE	tmpax,ItmpH	;Verifica posicao atual com posisao/impressao
;31		RJMP	IntMo1	;(33)	;Se diferente
;32		LDD	tmpax,Y+prtL
;34		CPSE	tmpax,ItmpL	;Verifica posicao atual com posisao/impressao
;35		RJMP	IntMo1	;(37)	;Se diferente
;36		CBR	FlagI,1<<2	;Desabilita o sinal de impresao
;37		SBRC	FlagI,3		;Verifica logica do sinal de de impressao
;38		SBI	pPrtRv,sPrintGo	;Ativa o sinal de impressao com 1
;40		SBRS	FlagI,3		;Verifica logica do sinal de de impressao
;41		CBI	pPrtRv,sPrintGo	;Ativa o sinal de impressao com 0
;		;Contagem das posicao
;43/29	IntMo1:	SBIC	PORTC,3		;Verifica a direcao do movimento
;44		RJMP	IntMo2	;(46/32);Se portc(3)=1, movimento positivo
;45		SUBIW	Itmp,1
;47		RJMP	IntMo3	;(49/35);Se portc(3)=1, movimento positivo
;46/32	IntMo2:	ADDIW	Itmp,1
;49/34	IntMo3:	STDW	Y+Patua,Itmp
;53/38		RJMP	IntMo7	;(55/40)
;21	IntMo4:	SBI	PortMot,PinMot
;		;Leitura do giro
;23		LDD	itmpL,Y+flagZ
;25		ADD	itmpL,itmpL
;26		SBIC	pinc,2		;Zero index ?
;27		SBR	itmpL,1<<0	;Se 1, Seta bit0
;28		STD	Y+flagZ,itmpL
;30		AndI	itmpL,$0F
;31		SBRS	FlagI,1		;Zero index anterior ?
;32		RJMP	IntMo5 	;(34)	;=1
			;Se nivel corrente é 1
;33		BRNE	IntMo7	;(35)	;O nivel se manteve
;34		CBR	flagI,1<<1	;Zero index 1 para 0
;35		SBIS	PORTC,3		;Direcao do movimento ?
;36		RJMP	IntMo7	;(38)	;Negativa
;37		LDDW	Itmp,Y+Patua
;41		RJMP	IntMo6	;(43)
		;Se nivel corrente é 0
;34	IntMo5:	CPI	itmpL,15
;35		BRNE	IntMo7	;(37)	;O nivel se manteve
;36		SBR	flagI,1<<1	;Zero index 0 para 1
;37		SBIC	PORTC,3		;Direcao do movimento ?
;38		RJMP	IntMo7	;(40)	;Positiva
;39		LDDW	Itmp,Y+Patua
;43		ADDIW	Itmp,4
;45/43	IntMo6:	STDW	Y+Pinde,Itmp	;Salva posicao atual no zero index
;49		CBR	flagI,1<<0	;Desabilita o Zero index
;55/13	IntMo7:	INW	Itmp,OCR1b
;57		ADDW	Itmp,RegDivMot
;59		OUTW	OCR1b,Itmp
;61	IntMo8:	OUT	SREG,SSreg	;restore Status register
;62		RETI	;(66/24)

;Prescaler <= (Fclock/DivMin)/VelMax
;Prescaler >= (Fclock/256/256)/VelMin
;Fclock=8Mz DivMin=100 VelMax=10000 VelMin=10 12,2<=Prescaler<=8 invalido
;Fclock=8Mz DivMin=100 VelMax=10000 VelMin=20  6,1<=Prescaler<=8

;DivMin=100 Prescaler =  1 VelMax=40000	VelMin=122
;DivMin=100 Prescaler =  8 VelMax=5000	VelMin=15
;DivMin=100 Prescaler = 64 VelMax=625	VelMin=2

;V= Vo+at
;e= at²/2
; e= pulso a=pulso/s²	t²=2e/a f=Raiz(a/2e)=Raiz(256*256/(0,5*2))=256

;Vmin= Raiz(2*CMin*A)
;Vmax =Raiz(2*CMax*A)
;Vmax/Vmin = Raiz(2*CMax*A)/Raiz(2*CMin*a) =Raiz(CMax/Cmin)
;CMax =2^16 CMin=0,5 Vmax/Vmin = Raiz(2^16/0,5) = 256*Raiz(2) 362




;Divisor = Fclock/(Velocidade*Prescaler)

;n  n-1	I T H S V N Z C
;00 FF	    1 1   1   1
;FF FE	      1   1
;F0 EF	    1 1   1
;EF EE	      1   1
;E0 DF	    1 1   1
;DF DE	      1   1
;D0 CF	    1 1   1
;CF CE	      1   1
;C0 BF	    1 1   1
;BF BE	      1   1
;B0 AF	    1 1   1
;AF AE	      1   1
;A0 9F	    1 1   1
;9F 9E	      1   1
;90 8F	    1 1   1
;8F 8E	      1   1
;80 7F	    1 1 1
;7F 7E
;70 6F	    1
;6F 6E
;60 5F	    1
;5F 5E
;50 4F	    1
;4F 4E
;40 3F	    1
;3F 3E
;30 2F	    1
;2F 2E
;20 1F	    1
;1F 1E
;10 0F	    1
;01 00               1
;00 FF	    1 1   1   1
;
;
;n  n-1	I T H S V N Z C
;7F 80	    1   1 1
;80 81	    0 1   1
;8F 90	    1 1   1
;9F A0	    1 1   1
;AF B0	    1 1   1
;BF C0	    1 1   1
;CF D0	    1 1   1
;DF E0	    1 1   1
;EF F0	    1 1   1
;FF 00	    1       1 1
;00 01	0 0 0 0 0 0 0 0
;0F 10	0 0 0 0 0 0 0 0

;Turbo 1 ciclo a cada 4 pulso
;half ciclo a cada 8 pulso

;S=0			S=1
;00+00=00 a 00+7F=7F	00+80=80 a 00+FF=FF
;01+00=01 a 01+7F=80	01+80=81 a 01+FE=FF
;01+FF=00 a 02+7F=81	02+80=82 a 02+FD=FF
;02+FE=00 a 03+7F=82	03+80=83 a 03+FC=FF
;03+FD=00 a 04+7F=83	04+80=84 a 04+FB=FF
;04+FC=00 a 05+7F=84	05+80=85 a 05+FA=FF
;05+FB=00 a 06+7F=85	06+80=86 a 06+F9=FF
;06+FA=00 a 07+7F=86	07+80=87 a 07+F8=FF

;MenDivMot	;Novo divisor
;MenDivTaco	;Novo divisor
;MenPresMot	;Novo prescaler
;MenPresTaco	;Novo prescaler

;Itmp
;RegDivMot
;RegDivTaco
;RegPresMot
;RegPresTaco
;SREG
;tmpax
