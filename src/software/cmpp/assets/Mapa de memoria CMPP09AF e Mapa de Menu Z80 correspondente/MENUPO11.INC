;----------------------------------------------------------------
;	Estruturas de menus					-
;   Copia de MENUPOR0.INC, acresentando os seguites parametros	-
;   para o modo passo a passo:					-
; - Start automatico passo a passo				-
; - Saida de start passo a passo				-
; - Retardo de impressao passo a passo				-
; - Retardo do start passo a passo				-
;----------------------------------------------------------------
MENPRIN	DEFB	9
	DEFW	NUMEM+1
	DEFB	' Numero do programa para edicao  : ##   ',0Dh,0
	DEFW	REDICAO,RETORNA,0FF30h,EPROG,0
	DEFB	' Numero do programa do eixo X    : ##   ',0Dh,0
	DEFW	EXECUX,RETORNA,0FF38h,XPROG,0
	DEFB	' Numero do programa do eixo Y    : ##   ',0Dh,0
	DEFW	EXECUY,RETORNA,0FF40h,YPROG,0
	DEFB	' Copiar o programa numero : ## para: ## ',0Dh,0
	DEFW	COPIPRG,RETORNA,CopyPrg,CPROG,0
	DEFB	' Troca do nivel de acesso     [******** ',0Dh,0
	DEFW	TrocNiv,RETORNA,0FF60h,nSenha,MENSEN
	DEFB	' Configuracao do eixo X :      [******* ',0Dh,0
	DEFW	SUBMENX,RETORNA,0FF50h,EIXOX,MENHAB
	DEFB	' Configuracao do eixo Y :      [******* ',0Dh,0
	DEFW	SUBMENY,RETORNA,0FF58h,EIXOY,MENHAB
	DEFB	' Configuracao do equipamento ...        ',0Dh,0
	DEFW	SEQUIPO,RETORNA,0,0,0
	DEFB	' Rotinas de testes e verificacao ...    ',0Dh,0
	DEFW	SUBMENT,RETORNA,0,0,0
	DEFB	0Dh
PRISENH	EQU	0FF70h	;FF78, FF80, FF88 = Endereco das senhas
;
MEDICAO	DEFB	5
	DEFW	NUMEM+2
	DEFB	' Parametro de Movimento...              ',0Dh,0
	DEFW	SUBMENE,RETORNA,MMOVIM,0,0
	DEFB	' Parametros de Impressao...             ',0Dh,0
	DEFW	SUBMENE,RETORNA,MMENSAG,0,0
	DEFB	' Configuracao do Ciclo...               ',0Dh,0
	DEFW	SUBMENE,RETORNA,MCICLO,0,0
	DEFB	' Configuracao da impressora...          ',0Dh,0
	DEFW	SUBMENE,RETORNA,MIMPRES,0,0
	DEFB	' Intertravamento: dois eixos e pas/pas..',0Dh,0
	DEFW	SUBMENE,RETORNA,MINTRV,0,0
;	DEFB	' Parametros de Selecao de mensagem...   ',0Dh,0
;	DEFW	SUBMENE,RETORNA,MMENSAG,0,0
	DEFB	0Dh
MMOVIM	DEFB	6
	DEFW	NUMEM+3
	DEFB	' Posicao inicial               ### mm   ',0Dh,sPosIni	;00
	DEFW	SELPARP,CONVMM,8000h,POSINI,0
	DEFB	' Posicao final                #### mm   ',0Dh,sPosFim	;02
	DEFW	SELPARP,CONVMM,8003h,POSFIM,0
	DEFB	' Aceleracao de avanco         #### mm/s2',0Dh,sAcevan	;04
	DEFW	SELPARP,CONVMM0,8007h,ACEAVS,0
	DEFB	' Aceleracao de retorno        #### mm/s2',0Dh,sAceret	;06
	DEFW	SELPARP,CONVMM0,800Bh,ACERET,0
	DEFB	' Velocidade de avanco         #### mm/s ',0Dh,sVelAva	;08
	DEFW	SELPARP,CONVMM0,800Fh,VELAVS,0
	DEFB	' Velocidade de retorno        #### mm/s ',0Dh,sVelRet	;10
	DEFW	SELPARP,CONVMM0,8013h,VELRET,0
	DEFB	0Dh
MMENSAG	DEFB	7
	DEFW	NUMEM+4
	DEFB	' Numero de mensagem no avanco     ##    ',0Dh,snMenAv	;12
	DEFW	SELPARP,RETORNA,8017h,NUMAVS,0
	DEFB	' Numero de mensagem no retorno    ##    ',0Dh,snMenRt	;14
	DEFW	SELPARP,RETORNA,8019h,NUMRET,0
	DEFB	' Primeira mensagem no avanco    #### mm ',0Dh,spPrtAv	;16
	DEFW	SELPARP,CONVMM,801Bh,PRIAVS,0
	DEFB	' Primeira mensagem no retorno   #### mm ',0Dh,spPrtRt	;18
	DEFW	SELPARP,CONVMM,801Fh,PRIRET,0
	DEFB	' Ultima mensagem no avanco      #### mm ',0Dh,sUprtAV	;20
	DEFW	SELPARP,CONVMM,8023h,ULTAVS,0
	DEFB	' Ultima mensagem no retorno     #### mm ',0Dh,sUprtRT	;22
	DEFW	SELPARP,CONVMM,8027h,ULTRET,0
	DEFB	' Mensagem reversa ligada       [******* ',0Dh,sFlgPrg	;34
	DEFW	SELPARP,RETORNA,802Bh,DIRERS,MENDIR
;	DEFB	' Numero de multiplas impressoes   ##    ',0Dh,99h	;12
;	DEFW	SELPARP,RETORNA,80CAh,NumMul,0
;	DEFB	' passo das multiplas impressoes #### mm ',0Dh,99h	;12
;	DEFW	SELPARP,RETORNA,80CCh,PasMul,0
;SMENSAG	DEFB	6
;	DEFW	NUMEM+13
;	DEFB	' Numero da Prim mensagem do avanco  ### ',0Dh,99h	;12
;	DEFW	SELPARP,RETORNA,8032h,PrMAVS,0
;	DEFB	' Numero da prim mensagem do retorno ### ',0Dh,99h	;14
;	DEFW	SELPARP,RETORNA,8035h,PrMRET,0
;	DEFB	' Sentido de contagem no retorno [****** ',0Dh,99h	;34
;	DEFW	SELPARP,RETORNA,8038h,DirMeS,MeSent
;	DEFB	' Selecao por impressao         [******* ',0Dh,99h	;34
;	DEFW	SELPARP,RETORNA,803Eh,SelImp,MENDIR
;	DEFB	' Selecao por multiplos         [******* ',0Dh,99h	;34
;	DEFW	SELPARP,RETORNA,8045h,SelMul,MENDIR
;	DEFB	' Selecao paralela              [******* ',0Dh,99h	;34
;	DEFW	SELPARP,RETORNA,804Ch,SelPar,MENHAB
MIMPRES	DEFB	4
	DEFW	NUMEM+5
	DEFB	' Logica do sinal de impressao  [******* ',0Dh,sFlgPrg
	DEFW	SELPARP,RETORNA,8053h,LGIMPRE,MENLOG
	DEFB	' Largura do sinal dimpressao   #.### seg',0Dh,slaSiPr	;36
	DEFW	SELPARP,CONVSEG,805Ah,TMPIMPR,0
;	DEFB	' Largura do sinal do Bico2     #.### seg',0Dh,99h	;36
;	DEFW	SELPARP,CONVSEG,80D0h,TMPIMPR,0
;	DEFB	' Largura do sinal do Bico3     #.### seg',0Dh,99h	;36
;	DEFW	SELPARP,CONVSEG,80D5h,TMPIMPR,0
	DEFB	' Reversao dmensagem via serial [******* ',0Dh,sFlgPrg
	DEFW	SELPARP,RETORNA,805Fh,MENrevS,MENLIG
	DEFB	' Selecao de mensagem via serial[******* ',0Dh,sFlgPrg
	DEFW	SELPARP,RETORNA,8066h,MENselS,MENLIG
	DEFB	0Dh
MCICLO	DEFB	5
	DEFW	NUMEM+6
	DEFB	' Retardo no start automatico   #.### seg',0Dh,sStaAut	;24
	DEFW	SELPARP,CONVSEG,806Dh,RETAUT,0
	DEFB	' Retardo no start externo      #.### seg',0Dh,sStaExt	;26
	DEFW	SELPARP,CONVSEG,8073h,RETEXT,0
	DEFB	' Start automatico no avanco    [******* ',0Dh,sFlgPrg	;28
	DEFW	SELPARP,RETORNA,8078h,ASTAAVS,MENLIG
	DEFB	' Start automatico no retorno   [******* ',0Dh,sFlgPrg	;30
	DEFW	SELPARP,RETORNA,807Fh,ASTARET,MENLIG
	DEFB	' Modo de trabalho do eixo      [******* ',0Dh,sFlgPrg
	DEFW	SELPARP,RETORNA,8086h,MPASPAS,MENMOD
	DEFB	0Dh
MINTRV	DEFB	9
	DEFW	NUMEM+7
	DEFB	' Antecipacao da saida de start   #### mm',0Dh,sCotAnt	;32
	DEFW	SELPARP,CONVMM0,8094h,APISTAO,0
	DEFB	' Saida de Start no avanco      [******* ',0Dh,sFlgPrg
	DEFW	SELPARP,RETORNA,8098h,SSTAAVS,MENLIG
	DEFB	' Saida de Start no retorno     [******* ',0Dh,sFlgPrg
	DEFW	SELPARP,RETORNA,809Fh,SSTARET,MENLIG
	DEFB	' Entrada de start entre eixos  [******* ',0Dh,sFlgPrg
	DEFW	SELPARP,RETORNA,80A6h,ENSTART,MENLIG
;	DEFB	' Retardo do start entre eixo   #.### seg',0Dh,99h
;	DEFW	SELPARP,CONVSEG,80ADh,RetEix,0
	DEFB	' Start pelo teclado e externo X[******* ',0Dh,sFlgPrg
	DEFW	SELPARM,RETORNA,808Dh,StaTec,MENLIG
	DEFB	' Retardo no sinal de impressao #.### seg',0Dh,sRetImp
	DEFW	SELPARP,CONVSEG,80B2h,RETIMPR,0
	DEFB	' Retardo no start passo/passo  #.### seg',0Dh,sRetApp
	DEFW	SELPARP,CONVSEG,80B7h,RETPPAS,0
	DEFB	' Start automatico passo/passo  [******* ',0Dh,sFlgPrE
	DEFW	SELPARP,RETORNA,80BCh,STAUTPP,MENLIG
	DEFB	' Saida de start passo a passo  [******* ',0Dh,sFlgPrE
	DEFW	SELPARP,RETORNA,80C3h,SSTAPPA,MENLIG
	DEFB	0Dh
;	Posisao da ram de usuario vago de xxDAh a xxFDh, 23 bytes
;
MCONFX	DEFB	13
	DEFW	NUMEM+8
	DEFB	' Numero do canal X               ##     ',0Dh,0
	DEFW	SELPARM,RETORNA,0FD00h,XCANAL,0
	DEFB	' Numero de pulso do giro X       ####   ',0Dh,snPulso
	DEFW	SELPARM,RETORNA,0FD08h,NPULSX,0
	DEFB	' Janela de protecao do giro X    ####   ',0Dh,sJanela
	DEFW	SELPARM,RETORNA,0FD10h,JANELX,0
	DEFB	' Deslocamento/Giro do Motor X  [******* ',0Dh,0
	DEFW	SELPARM,RETORNA,0FD18h,FATGIRX,MENFAT
	DEFB	' Giro X com funcao de protecao [******* ',0Dh,sFlgPrg
	DEFW	SELPARM,RETORNA,0FD20h,GIROPX,MENLIG
	DEFB	' Giro X com funcao de correcao [******* ',0Dh,sFlgPrg
	DEFW	SELPARM,RETORNA,0FD28h,GIROCX,MENLIG
	DEFB	' Logica do start externo X     [******* ',0Dh,sFlgPrg
	DEFW	SELPARM,RETORNA,0FD30h,LGSTARX,MENLOG
	DEFB	' Valor da posicao da referencia  ####   ',0Dh,sValRef
	DEFW	SELPARM,RETORNA,0FD38h,POSRFX,0
	DEFB	' Velocidade para referencia X    ####   ',0Dh,sVelRef
	DEFW	SELPARM,RETORNA,0FD40h,VELRFX,0
	DEFB	' Aceleracao para referencia X    ####   ',0Dh,sAceRef
	DEFW	SELPARM,RETORNA,0FD48h,ACERFX,0
	DEFB	' Reducao da corrente em repouso[******* ',0Dh,sFlgPrg
	DEFW	SELPARM,RETORNA,0FD50h,REDCORX,MENLIG
	DEFB	' Referencia pelo start externo [******* ',0Dh,sFlgPrg
	DEFW	SELPARM,RETORNA,0FD58h,RFSTARX,MENLIG
	DEFB	' Modo Turbo X                  [******* ',0Dh,sFlgPrE
	DEFW	SELPARM,RETORNA,0FD60h,TURBOX,MENLIG
	DEFB	0Dh
;
MCONFY	DEFB	13
	DEFW	NUMEM+9
	DEFB	' Numero do canal Y               ##     ',0Dh,0
	DEFW	SELPARM,RETORNA,0FE00h,YCANAL,0
	DEFB	' Numero de pulso do giro Y       ####   ',0Dh,snPulso
	DEFW	SELPARM,RETORNA,0FE08h,NPULSY,0
	DEFB	' Janela de protecao do giro Y    ####   ',0Dh,sJanela
	DEFW	SELPARM,RETORNA,0FE10h,JANELY,0
	DEFB	' Deslocamento/Giro do Motor Y  [******* ',0Dh,0
	DEFW	SELPARM,RETORNA,0FE18h,FATGIRY,MENFAT
	DEFB	' Giro Y com funcao de protecao [******* ',0Dh,sFlgPrg
	DEFW	SELPARM,RETORNA,0FE20h,GIROPY,MENLIG
	DEFB	' Giro Y com funcao de correcao [******* ',0Dh,sFlgPrg
	DEFW	SELPARM,RETORNA,0FE28h,GIROCY,MENLIG
	DEFB	' Logica do start externo Y     [******* ',0Dh,sFlgPrg
	DEFW	SELPARM,RETORNA,0FE30h,LGSTARY,MENLOG
	DEFB	' Valor da posicao da referencia  ####   ',0Dh,sValRef
	DEFW	SELPARM,RETORNA,0FE38h,POSRFY,0
	DEFB	' Velocidade para referencia Y    ####   ',0Dh,sVelRef
	DEFW	SELPARM,RETORNA,0FE40h,VELRFY,0
	DEFB	' Aceleracao para referencia Y    ####   ',0Dh,sAceRef
	DEFW	SELPARM,RETORNA,0FE48h,ACERFY,0
	DEFB	' Reducao da corrente em repousY[******* ',0Dh,sFlgPrg
	DEFW	SELPARM,RETORNA,0FE50h,REDCORY,MENLIG
	DEFB	' Referencia pelo start externo [******* ',0Dh,sFlgPrg
	DEFW	SELPARM,RETORNA,0FE58h,RFSTARY,MENLIG
	DEFB	' Modo Turbo Y                  [******* ',0Dh,sFlgPrE
	DEFW	SELPARM,RETORNA,0FE60h,TURBOY,MENLIG
	DEFB	0Dh
;
MEQUIPO	DEFB	4
	DEFW	NUMEM+10
	DEFB	' Trocar a senha do nivel :    [******** ',0Dh,0
	DEFW	TrocSen,RETORNA,tSenha,0,MENSEN
	DEFB	' Configuracao da porta serial...        ',0Dh,0
	DEFW	SUBMENR,RETORNA,mPorSer,0,0
VERSAO	DEFB	' Software CPU Versao : @ArQuIv@ @ DaTa @',0Dh,0
	DEFW	RETORNA,RETORNA,0,0,0
	DEFB	' Software CPU Cheqsum:           $$$$h  ',0Dh,0
	DEFW	RETORNA,RETORNA,ChkCpu,CHEQSYS,0
	DEFB	' Softw. Eixo X Versao: DESCONHE 00/00/00',0Dh,0
	DEFW	RETORNA,RETORNA,0,0,0
	DEFB	' Softw. Eixo Y Versao: DESCONHE 00/00/00',0Dh,0
	DEFW	RETORNA,RETORNA,0,0,0
	DEFB	0Dh
;
;Configuração de serial
mPorSer	DEFB	6
	DEFW	NUMEM+13
	DEFB	' Taxa de comunicacao da porta   [****** ',0Dh,0
	DEFW	SELPARM,RETORNA,0FF90h,NumBald,MenBald
	DEFB	' Numero de bits da comunicao    [**     ',0Dh,0
	DEFW	SELPARM,RETORNA,0FF98h,nBitDat,MenBit
	DEFB	' Numero de stop bits            [**     ',0Dh,0
	DEFW	SELPARM,RETORNA,0FFA0h,StopBit,MenStoB
	DEFB	' Paridade                       [*******',0Dh,0
	DEFW	SELPARM,RETORNA,0FFA8h,ParytOn,Menlig
	DEFB	' Paridade tipo                  [****** ',0Dh,0
	DEFW	SELPARM,RETORNA,0FFB0h,ParyTip,MenPary
	DEFB	' Break                          [*******',0Dh,0
	DEFW	SELPARM,RETORNA,0FFB8h,mBreak,Menlig
	DEFB	0Dh
;
MTESTE	DEFB	12
	DEFW	NUMEM+11
	DEFB	' Verifica o parametro $$h da placa micrX',0Dh,0
	DEFW	VMICROX,RETORNA,BUFTST,BUFTST0,0
	DEFB	' Modifica o parametro $$h da placa micrX',0Dh,0
	DEFW	MMICROX,RETORNA,BUFTST,BUFTST0,0
	DEFB	' Verifica o parametro $$h da placa micrY',0Dh,0
	DEFW	VMICROY,RETORNA,BUFTST,BUFTST0,0
	DEFB	' Modifica o parametro $$h da placa micrY',0Dh,0
	DEFW	MMICROY,RETORNA,BUFTST,BUFTST0,0
	DEFB	' Modifica memoria CPU      Enderec=$$$$h',0Dh,0
	DEFW	MMICRO0,RETORNA,BUFTST,BUFTST0,0
	DEFB	' Verifica memoria da CPU, Enderec=$$$$h ',0Dh,0
	DEFW	VERMEMO,RETORNA,BUFTST,BUFTST0,0
	DEFB	' Verifica a recepcao serial do eixo X   ',0Dh,0
	DEFW	LerBlok,RETORNA,0,0,0
	DEFB	' Verifica memoria X        Endere=$$$$h ',0Dh,0
	DEFW	VERMEMX,RETORNA,BUFTST,BUFTST0,0
	DEFB	' Verifica memoria Y        Endere=$$$$h ',0Dh,0
	DEFW	VERMEMY,RETORNA,BUFTST,BUFTST0,0
	DEFB	' Verifica/Modifica EEPROM X Endere=$$$$h',0Dh,0
	DEFW	MEEPROX,RETORNA,BUFTST,BUFTST0,0
	DEFB	' Verifica/Modifica EEPROM Y Endere=$$$$h',0Dh,0
	DEFW	MEEPROY,RETORNA,BUFTST,BUFTST0,0
	DEFB	' Verifica/Modifica CANAL COM2 = $$h     ',0Dh,0
	DEFW	MODCAN2,RETORNA,BUFTST,BUFTST0,0
	DEFB	0Dh
;
;----------------------------------------------------------------
RETORNA	RET	NC
	CCF
	RET
;
MENTST	DEFB	4
	DEFW	NUMEM+12
	DEFB	' Teste do Teclado                       ',0Dh,0
	DEFW	TSTEC,RETORNA,0,0,0
	DEFB	' Porta de Entrada                       ',0Dh,0
	DEFW	TSINP,RETORNA,0,0,0
	DEFB	' Porta de Saida                         ',0Dh,0
	DEFW	TSOUT,RETORNA,0,0,0
	DEFB	' Teste de comunicacao, conector espelho ',0Dh,0
	DEFW	TSTESP,RETORNA,0,0,0
	DEFB	0Dh
;
;----------------------------------------------------------------
;	Palavras de opcoes					-
;----------------------------------------------------------------
MENLIG	DEFB	'Deslig]Ligado]',0Dh
MENDIR	DEFB	'Retorn]Avanco]',0Dh
MENHAB	DEFB	'Desabi]Habili]',0Dh	;Invertido temporariamente para teste
MENMOD	DEFB	'Contin]PasPas]',0Dh
MENLOG	DEFB	'Aberto]Fechad]',0Dh
MENSEN	DEFB	'Superv.]Manute.]Operac.]Proteg.]',0Dh
MeSent	DEFB	'Posit]Negat]',0Dh
MenBit  DEFB	'5]6]7]8]',0Dh
MenStoB	DEFB	'1]2]',0Dh
MenPary	DEFB	'  Odd] Even] Mark]Space]',0Dh


;----------------------------------------------------------------
;	Mensagens diversas					-
;----------------------------------------------------------------
MENINI	DEFB	' Selecione o modo de operacao desejado  '
	DEFB	'    MANUAL EXECUCAO OU PROGRAMACAO      ',0Dh
;
MENCOPI	DEFB	'Cuidado <enter> confirma e <esc> aborta ',0Dh,0
;
MENTRS	DEFB	'D0,D1=Nbits D2=StopBit D3=ParidadeAtiva '
	DEFB	'D4,D5=Parid. D6=int D7=HabCom :',0Dh
;
MENTBD	DEFB	' 06=19200  0C=9600  18=4800  30=2400    '
	DEFB	' 60= 1200  C0= 600  80= 300   :',0Dh
;
MENTBDH	DEFB	' 00=19200  00=9600  00=4800  00=2400    '
	DEFB	' 00= 1200  00= 600  01= 300   :',0Dh
;
MENTSA	DEFB	'Entre com o endereco da porta hexa =',0Dh
MENTS1	DEFB	'Entre com o valor para OUT       ',0Dh
;
MENNAO	DEFB	'Recebido/transmitido diferente    :',0Dh
;
MENMAN	DEFB	'    Ja em modo PAUSA, aperte a tecla    '
	DEFB	' ENTER libera o motor ou ESC para sair  ',0Dh
;
MENMA0	DEFB	'   MOTOR LIVRE para movimento manual    '
	DEFB	'    Aperte qualquer tecla para sair     ',0Dh
;
MENEXC	DEFB	'    * * * * * Modo execucao * * * * *   ',0Dh
;
MENRFX0	DEFB	' Aperte a tecla start para referenciar  ',0Dh
MENRFX1	DEFB	'    Por favor aguarde, referenciando    ',0Dh
;
MENRFY0	DEFB	'Aperte a tecla start para referenciar Y ',0Dh
MENRFY1	DEFB	'   Por favor aguarde, referenciando  Y  ',0Dh
;
DOWLDX	DEFB	'Por favor aguarde a carga do programa X ',0Dh
DOWLDY	DEFB	'Por favor aguarde a carga do programa Y ',0Dh
;
DOWCFX	DEFB	'Por favor aguarde a carga da configur X ',0Dh
DOWCFY	DEFB	'Por favor aguarde a carga da configur Y ',0Dh
;
TUSENHA	DEFB	'       Informe a sua senha   :',0Dh	;Tua senha
NVSENHA	DEFB	'Se desejar nova senha, informe:',0Dh	;Nova senha
CFSENHA	DEFB	'       Confirme a nova senha :',0Dh	;Confirma Nova senha
;
MENCAN2	DEFB	'Esta rotina so pode rodar com uma unica '
	DEFB	'placa de motor conectada. Cerfifique ?  ',0Dh
;
MenVerS	DEFB	'Aguarde recebendo dados da porta serialX',0Dh
;
;----------------------------------------------------------------
;			Mensagens de erro			-
;----------------------------------------------------------------
eMenIni	DEFB	'Erro 00 - Interrupcao externa           ',0Dh
	DEFB	'Erro 01 - Interrupcao serial            ',0Dh
	DEFB	'Erro 02 - Interrupcao relogio           ',0Dh
	DEFB	'Erro 03 - Interrupcao pendente          ',0Dh
	DEFB	'Erro 04 - Display                       ',0Dh
	DEFB	'Erro 05 - Ram sistema                   ',0Dh
	DEFB	'Erro 06 - Badram Erro power off         ',0Dh
	DEFB	'Erro 07 - Interrupcao externa falha     ',0Dh
	DEFB	'Erro 08 - Interrupcao serial falha      ',0Dh
	DEFB	'Erro 09 - Interrupcao relogio falha     ',0Dh
	DEFB	'Erro 10 - Interrupcao pendente falha    ',0Dh
	DEFB	'Erro 11 - Bateria descarregada          ',0Dh
	DEFB	'Erro 12 - Eprom defeito                 ',0Dh
	DEFB	'Erro 13 - Memoria perdida               ',0Dh
	DEFB	'Erro 14 - Memoria defeito               ',0Dh
	DEFB	'Erro 15 - Fim de curso de avanco        ',0Dh
	DEFB	'Erro 16 - Fim de curso de retorno       ',0Dh
	DEFB	'Erro 17 - Sem referencia aperte START   ',0Dh
	DEFB	'Erro 18 - Shift apertado                ',0Dh
	DEFB	'Erro 19 - Parametros                    ',0Dh
	DEFB	'Erro 20 - Parametros de mensagem/avanco ',0Dh
	DEFB	'Erro 21 - Parametros de mensagem/retorno',0Dh
	DEFB	'Erro 22 - Parametros de Deslocam/avanco ',0Dh
	DEFB	'Erro 23 - Parametros de Deslocam/retorno',0Dh
	DEFB	'Erro 24 - Velocidade (START)            ',0Dh
	DEFB	'Erro 25 - Fim de curso de avanco Y      ',0Dh
	DEFB	'Erro 26 - Fim de curso retorno Y        ',0Dh
	DEFB	'Erro 27 - Sem referencia aperte START Y ',0Dh
	DEFB	'Erro 28 - Shift apertado                ',0Dh
	DEFB	'Erro 29 - Parametros Y                  ',0Dh
	DEFB	'Erro 30 - Parametros mensagem/avanco Y  ',0Dh
	DEFB	'Erro 31 - Parametros mensagem/retorno Y ',0Dh
	DEFB	'Erro 32 - Parametros Deslocam/avanco Y  ',0Dh
	DEFB	'Erro 33 - Parametros Deslocam/retorno Y ',0Dh
	DEFB	'Erro 34 - Velocidad (START) Y           ',0Dh
;
;Acresentado da RIPASA
	DEFB	'Erro 35 - Porta serial com problema     ',0Dh	;era 22
	DEFB	'Erro 36 - Timer-in da interface serial  ',0Dh	;era 34
	DEFB	'Erro 37 - Break interrupt               ',0Dh	;era 26
	DEFB	'Erro 38 - Framing                       ',0Dh	;era 27
	DEFB	'Erro 39 - Paridade                      ',0Dh	;era 28
	DEFB	'Erro 40 - Overrun                       ',0Dh	;era 29
	DEFB	'Erro 41 - Cheqsum                       ',0Dh	;era 25
	DEFB	'Erro 42 - Protocolo de comunicacao      ',0Dh	;era 24
	DEFB	'Erro 43 - Buffer de recepcao cheio      ',0Dh	;era 30
	DEFB	'Erro 44 - timeout da transmissao        ',0Dh	;Nao existia
	DEFB	'Erro 45 - Comunicacao sem DCD           ',0Dh	;Nao existia
	DEFB	'Erro 46 - Comunicacao sem CTS           ',0Dh	;Nao existia
	DEFB	'Erro 47 - Cabo do motor X desconectado  ',0Dh	;Nao existia
	DEFB	'Erro 48 - Defeito da placa do motor X   ',0Dh	;Nao existia
	DEFB	'Erro 49 - Cabo do motor Y desconectado  ',0Dh	;Nao existia
	DEFB	'Erro 50 - Defeito da placa do motor Y   ',0Dh	;Nao existia
;
	DEFB	'Erro 51 - Start byte da serial          ',0Dh	;era 23
	DEFB	'Erro 52 - Start byte invalido           ',0Dh	;era 31
	DEFB	'Erro 53 - Stop byte invalido            ',0Dh	;era 32
	DEFB	'Erro 54 - Start byte invalido           ',0Dh	;era 33
	DEFB	'Erro 55 - Numero/bytes recebido invalid ',0Dh	;era 35
	DEFB	'Erro 56 - Recebido nao ACK              ',0Dh	;era 35
	DEFB	'Erro 57 - Resposta do canal invalido    ',0Dh	;era 35
	DEFB	'Erro 58 - Resposta do comando invalido  ',0Dh	;era 35
	DEFB	'Erro 59 - Bytes invalidos final d bloco ',0Dh	;era 35
	DEFB	'Erro 60 - Recebido comando no cheqsum   ',0Dh	;era 35
;
	DEFB	'Erro 61 - Menu de programacao           ',0Dh
	DEFB	'Erro 62 - Menu configuracao dos eixos   ',0Dh
	DEFB	'Erro 63 - Menu de configuracao do eixo X',0Dh
	DEFB	'Erro 64 - Menu de configuracao do eixo Y',0Dh	;era 35
;
	DEFB	'Erro 65 - Sinal de start X Velocidade   ',0Dh
	DEFB	'Erro 66 - Sinal de start X outro        ',0Dh
	DEFB	'Erro 67 - Sinal do giro X               ',0Dh
	DEFB	'Erro 68 - Sinal do giro X               ',0Dh
	DEFB	'Erro 69 - Sinal de impressao X          ',0Dh
	DEFB	'Erro 70 - Comunicacao X com a COM1      ',0Dh
	DEFB	'Erro 71 - Mudanca X no instante errado  ',0Dh
	DEFB	'Erro 72 - Parametros Passo a Passo X    ',0Dh
	DEFB	'Erro 73 - Mascara X bit08 invalida      ',0Dh
	DEFB	'Erro 74 - Mascara X bit09 invalida      ',0Dh
	DEFB	'Erro 75 - Mascara X bit10 invalida      ',0Dh
	DEFB	'Erro 76 - Mascara X bit11 invalida      ',0Dh
	DEFB	'Erro 77 - Mascara X bit12 invalida      ',0Dh
	DEFB	'Erro 78 - Mascara X bit13 invalida      ',0Dh
	DEFB	'Erro 79 - Mascara X bit14 invalida      ',0Dh
	DEFB	'Erro 80 - Mascara X bit15 invalida      ',0Dh
;
	DEFB	'Erro 81 - Sinal de start Y Velocidade   ',0Dh
	DEFB	'Erro 82 - Sinal de start Y outro        ',0Dh
	DEFB	'Erro 83 - Sinal do giro Y               ',0Dh
	DEFB	'Erro 84 - Sinal do giro Y               ',0Dh
	DEFB	'Erro 85 - Sinal de impressao Y          ',0Dh
	DEFB	'Erro 86 - Comunicacao Y com a COM1      ',0Dh
	DEFB	'Erro 87 - Mudanca Y no instante errado  ',0Dh
	DEFB	'Erro 88 - Parametros Passo a Passo Y    ',0Dh
	DEFB	'Erro 89 - Mascara Y bit08 invalida      ',0Dh
	DEFB	'Erro 90 - Mascara Y bit09 invalida      ',0Dh
	DEFB	'Erro 91 - Mascara Y bit10 invalida      ',0Dh
	DEFB	'Erro 92 - Mascara Y bit11 invalida      ',0Dh
	DEFB	'Erro 93 - Mascara Y bit12 invalida      ',0Dh
	DEFB	'Erro 94 - Mascara Y bit13 invalida      ',0Dh
	DEFB	'Erro 95 - Mascara Y bit14 invalida      ',0Dh
	DEFB	'Erro 96 - Mascara Y bit15 invalida      ',0Dh

	DEFB	'Erro 97 - Parametros de movimento       ',0Dh	;Mudado
	DEFB	'Erro 98 - Parametros de impressao       ',0Dh	;Mudado
	DEFB	'Erro 99 - Parametros de configura. ciclo',0Dh	;Mudado
	DEFB	'Erro 100- Parametros config. impressora ',0Dh	;Mudado
	DEFB	'Erro 101- Parametros intertravamento    ',0Dh	;Mudado

	DEFB	'Erro 102- Posicao real X muito grande   ',0Dh
	DEFB	'Erro 103- Posicao real Y muito grande   ',0Dh
	DEFB	'Erro 104- Memoria perdida (13)          ',0Dh
	DEFB	'Erro 105- Memoria perdida (13)          ',0Dh
	DEFB	'Erro 106- Configuracao da porta serial  ',0Dh
	DEFB	'Erro 107- Sistema operacional trocado   ',0Dh
	DEFB	'Erro 108- Versao do Sistema operacional ',0Dh
	DEFB	'Erro 109- Buffer de erro cheio          ',0Dh

	DEFB	'Erro 110- Parametros de movimento       ',0Dh
	DEFB	'Erro 111- Parametros de impressao       ',0Dh
	DEFB	'Erro 112- Parametros de configura. ciclo',0Dh
	DEFB	'Erro 113- Parametros config. impressora ',0Dh
	DEFB	'Erro 114- Parametros intertravamento    ',0Dh
	DEFB	'Erro 115- Comunicacao com o eixo X      ',0Dh

	DEFB	'Erro 116- Parametros de movimento       ',0Dh
	DEFB	'Erro 117- Parametros de impressao       ',0Dh
	DEFB	'Erro 118- Parametros de configura. ciclo',0Dh
	DEFB	'Erro 119- Parametros config. impressora ',0Dh
	DEFB	'Erro 120- Parametros intertravamento    ',0Dh
	DEFB	'Erro 121- Comunicacao com o eixo Y      ',0Dh

eMenFim	DEFB	'Erro 999- ***************************** ',0Dh
;
