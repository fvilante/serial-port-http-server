
comportamento do CMPP (pratica/laboratorio)

SOFTWARE: CMPP00LG

- identificacao de parada, aceleracao, desaceleracao e movimento continuo
    através do statusL, quando acLigada e desacLigada estao ambos true entao é movimento continuo,
    quando ambos falso entao o equipamento esta parado.

- comportamento da referencia
    - quando o motor esta em estado
    - a referencia termina mas NAO significa que o motor estará parado na posicao inicial ou final
    TODO: E a corridinha que ele dá durante a referencia? dependendo da posicao final/inicial o final
        da referencia acontece numa posicao ou outra, mas parece ser um bug e nao é linearmente proporcional


- comportamento do start
    - se start duplo, entao um deles é usado para iniciar o movimento e o outro é acumulado e funciona
        como um start automatico para o fim do movimento.
        Os demais starts são ignorados enquanto o motor nao parar
        - este comportamento acima é util para permitindo uma programacao mais deterministica de trajetorias compostas
    - se o equipamento estiver desreferenciado um start ira referencia-lo.
        pode ser util criar uma rotina que apenas de start se o equipamento estiver referenciado