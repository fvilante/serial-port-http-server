import { executeInSequence, setParam_ } from "./cmpp-memmap-layer"
import { Driver } from "./mapa_de_memoria"

const Z = setParam_('com8',9600,0)(Driver)


export const buscaRefZ = (): Promise<void> => {

    
    const arr = [
        //() => Z('Posicao final', 100),
        () => Z('Velocidade de referencia', 200),
        //() => Z('Aceleracao de referencia',5000),
        
        
        // Eixo Z por ser vertical precisa ter uma forca adicional, caso contrario a inercia pode fazer ele perder a referencia e desligar o motor (devido a perda da janela) isto fará o cabeçote despencar.
        //() => Z('Reducao do nivel de corrente em repouso', false),
        // perde a referencia
        () => Z('Pausa serial', false),
        //() => Z('Modo manual serial', false), // bit de desliga o motor
        

        // busca a referencia
        //() => setParam('Pausa serial', true),
        //() => setParam('Modo manual serial', false), // bit de desliga o motor
        () => Z('Start serial', true),
    ]
    return executeInSequence(arr)
    /*setTimeout( () => { 

        setInterval( () => executeInSequence(arr), 1000)
    }, 10000)*/
   

}

const ProgramaDeMovimento = (): Promise<void> => {

    const arr = [
        () => Z('Posicao inicial', 750),
        () => Z('Posicao final', 1200),
        () => Z('Velocidade de avanco', 300),
        () => Z('Velocidade de retorno', 600),
        () => Z('Aceleracao de avanco', 1000),
        () => Z('Aceleracao de retorno', 3000),
        //() => Z('Start automatico no avanco ligado', true),
        () => Z('Start automatico no retorno ligado', false),
        
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
        () => Z('Start serial', true),
        
    ]
    return executeInSequence(arr)
}

const ficha = (): Promise<void> => new Promise( (resolve, reject) => {

    const arr = [
        () => buscaRefZ(),
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

    buscaRefZ().then( () =>
        ProgramaDeMovimento().then( () => {       
            //Timer(5000).then( () => {
                StartZ().then( () => {
                    Timer(10000).then( () => {
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

ficha();




