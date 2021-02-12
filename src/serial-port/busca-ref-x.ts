import { executeInSequence, setParam_ } from "./cmpp-memmap-layer"
import { Driver } from "./mapa_de_memoria"

const X = setParam_('com1',9600,0)(Driver)


export const buscaRefX = (): Promise<void> => {

    
    const arr = [
        //() => Z('Posicao final', 100),
        () => X('Velocidade de referencia', 500),
        //() => Z('Aceleracao de referencia',5000),
        
        
        // Eixo Z por ser vertical precisa ter uma forca adicional, caso contrario a inercia pode fazer ele perder a referencia e desligar o motor (devido a perda da janela) isto fará o cabeçote despencar.
        //() => Z('Reducao do nivel de corrente em repouso', false),
        // perde a referencia
        () => X('Pausa serial', false),
        //() => Z('Modo manual serial', false), // bit de desliga o motor
        

        // busca a referencia
        //() => setParam('Pausa serial', true),
        //() => setParam('Modo manual serial', false), // bit de desliga o motor
        () => X('Start serial', true),
    ]
    return executeInSequence(arr)
    /*setTimeout( () => { 

        setInterval( () => executeInSequence(arr), 1000)
    }, 10000)*/
   

}

const ProgramaDeMovimentoX = (): Promise<void> => {

    const arr = [
        () => X('Posicao inicial', 1000),
        () => X('Posicao final', 1100),
        () => X('Velocidade de avanco', 1000),
        () => X('Velocidade de retorno', 1000),
        () => X('Aceleracao de avanco', 5000),
        () => X('Aceleracao de retorno', 5000),
        () => X('Posicao da primeira impressao no avanco', 1050), 
        () => X('Start automatico no avanco ligado', true),
        () => X('Start automatico no retorno ligado', true),
        //() => Z('Start automatico no avanco ligado', true),
        //() => Z('Start automatico no retorno ligado', true),
        
    ]
    return executeInSequence(arr)
}

const Timer = (milisec: number): Promise<void> => {
    return new Promise( (resolve) => {
        setTimeout( () => {resolve();}, milisec)
    })
}

const StartZ = (): Promise<void> => {
    
    const arr = [
        () => X('Start serial', true),
        
    ]
    return executeInSequence(arr)
}

const ficha = (): Promise<void> => new Promise( (resolve, reject) => {

    const arr = [
        () => buscaRefX(),
        //() => Timer(15000)(),
        //() => ProgramaDeMovimento(),
        //() => Timer(5000)(),
        //() => StartZ(),
        //Timer(1000),
        //StartZ,
        /*Timer(1000),
        StartZ,
        Timer(1000),
        StartZ,
        Timer(1000),
        StartZ,
        Timer(1000),
        StartZ,*/
        
        
    ]

    buscaRefX().then( () =>
        ProgramaDeMovimentoX().then( () => {       
            //Timer(5000).then( () => {
                StartZ().then( () => {
                    Timer(15000).then( () => {
                        //ProgramaDeMovimento().then( () => {
                            //Timer(5000).then( () => {
                                //StartZ().then( () => {
                                    //Timer(5000).then( () => {
                                        StartZ().then( () => {
                                            resolve()
                                        })
                                    //})
                                //})
                            //})
                        //})
                    })
                //})
            })
        })
    )

    //return executeInSequence(arr)

})

const TestNumMessageNoAvanco = () => {

    const arr = [
        () => X('Numero de mensagem no retorno', 11),     
    ]
    return executeInSequence(arr)

}

ficha();

//TestNumMessageNoAvanco();