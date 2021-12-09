
comportamento do CMPP (pratica/laboratorio)

SOFTWARE: CMPP00LG

- identificacao de parada, aceleracao, desaceleracao e movimento continuo
    através do statusL, quando acLigada e desacLigada estao ambos true entao é movimento continuo,
    quando ambos falso entao o equipamento esta parado.

- comportamento da referencia
    - qual a posicao em que o motor entrega o sistema apos a referencia?
        resposta: posicao inicial desde que ela seja menor do que 1291 pulsos (+/- 1 pulso), se a PI for maior do que este valor então a PI é temporariamente (a titulo de referencia) assumido como sendo 1292, e assim que o processo de referencia é concluido a PI correta é programada. 
        - porém no proximo start apos a referencia o eixo vai procurar a posicao final (PF) que estiver programada.
    - quais sao as etapas do processo de referencia?
        1) usando velocidade e aceleracao de referencia ele:
            a) busca sensor FC-, se encontrar então;
            b) muda a direcao do motor e busca o sensor giro
            c) uma vez alcançado então considera primeira eta para referencia concluida
            d) a segunda etapa da referencia é colocar o motor na Posicao Inicial, porém isto é feito
                com a velocidade e aceleração avanço/retorno e nao as de referencia;
                NOTA: Se a posicao inicial for maior do que 1291 pulsos então ele limita a PI temporariamente a 1292 e alcança esta posicao.
            e) neste momento o flag de statusL.referenciado é setado para true e o processo de referencia
                é considerado completo com sucesso.
    - qual o modo mais rapido de referenciar ?
        1) Se o movimentador esta em cima do FC- entao ele só precisa sair dele e detectar o giro. Ou seja, uma etapa já esta praticamnte feita neste caso.
            


- comportamento do start
    - acumulos de starts:
        se starts adicionais sao dados, apenas um deles é estocado e lançado automaticamente apos o termino do movimento corrente. Isto basicamente simula um start automatico no final do movimento.
    - se o equipamento estiver desreferenciado um start ira referencia-lo.
        TODO: verificar-> desde que a 'pausa serial' esteja 'desligada', caso contrario start externo
        nao referencia a maquina

- alcançar posicao:
    - sempre que o equipamento estiver parado na posicao final, é possível programa uma nova posicao final,
        e dar um novo start. Desta forma o movimentador usa a PF como se fosse uma próxima posicao a alcançar. Isto independe se a proxima PF está programada para a direita ou a esquerda da posicao final corrente.
        NOTE: Se a proxima PF estiver a menos de 1 pulso de distancia da PF corrente, então ao receber start ele vai entender que a PF proxima é igual a PF atual então vao buscar ao inves de PF a posicao inicial.