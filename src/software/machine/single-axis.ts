
import { Milimeter } from "../axis-controler";
import { AxisControler } from "../cmpp/controlers/axis-controler";
import {  makeCmppControler } from "../cmpp/controlers/cmpp-controler";
import { Kinematics, Moviment } from "../cmpp/controlers/core";
import { MovimentStatus } from "../cmpp/controlers/utils/moviment-status";
import { SmartReferenceParameters } from "../cmpp/controlers/utils/smart-reference";
import { Pulses, TicksOfClock } from "../cmpp/physical-dimensions/base";
import { PulsesPerTick, PulsesPerTickSquared } from "../cmpp/physical-dimensions/physical-dimensions";
import { CMPP00LG, LigadoDesligado } from "../cmpp/transport/memmap-CMPP00LG";
import { Tunnel } from "../cmpp/transport/tunnel";
import { exhaustiveSwitch } from "../core/utils";


//TODO: 
//      - Implement InitialConfig and range protection
//      - Implement Calculo da rampa
//      - add timeout where applicable
//      - create stop method (it differentiate from 'shutdown method' because stop does not make axis not energized)
//      - optimize commnication
//      - Make Speed and Acceleration unit as mm/s and mm/s2

//TODO: Deprecate PrintingPositions, and rename PrintingPositions2 to PrintingPositions, the difference is only the type cast
export type PrintingPositions2 = {
    readonly numeroDeMensagensNoAvanco: number;
    readonly numeroDeMensagensNoRetorno: number;
    readonly posicaoDaPrimeiraMensagemNoAvanco: Pulses;
    readonly posicaoDaUltimaMensagemNoAvanco: Pulses;
    readonly posicaoDaPrimeiraMensagemNoRetorno: Pulses;
    readonly posicaoDaUltimaMensagemNoRetorno: Pulses;
}

export type SingleAxisSetup = {
    axisName: string
    absoluteRange: {  // it will throw an error if target position gets outside this range
        min: Pulses
        max: Pulses
    },
    milimeterToPulseRatio: number
    smartReferenceParameters: SmartReferenceParameters
    defaultKinematics: Kinematics // velocity adopted if no kinematics is given for the target moviment
    nativeParameters: {     // after the reference this parameters is assured to be settled
        'Start externo habilitado': LigadoDesligado
        'Entrada de start entre eixo habilitado': LigadoDesligado
        'Saida de start no avanco': LigadoDesligado
        'Saida de start no retorno': LigadoDesligado
        'Start automatico no avanco': LigadoDesligado
        'Start automatico no retorno': LigadoDesligado
        'Reducao da corrente em repouso': LigadoDesligado
        'Giro com funcao de protecao': LigadoDesligado
        'Giro com funcao de correcao': LigadoDesligado
        'Pausa serial': LigadoDesligado
    },
    tolerance: Tolerance // accepted max tolerance on stop position.
}

export const defaultReferenceParameter: SmartReferenceParameters = {
    endPosition: Pulses(500),
    reference: {
        speed: PulsesPerTick(500),
        acceleration: PulsesPerTickSquared(5000)
    }
} 

export type AxisName = string

export type AxisRange = {
    min: Pulses
    max: Pulses
}

export type TimeStamp = number

export type Tolerance = readonly [lowerBound: Pulses, upperBound: Pulses]

//TODO: Solve this errors: 1) When you use this.goto to the same position consecutively, the programs get fatal error
//TODO: Optimize to cache some values instead of fetch from cmpp
//TODO: introduce an Axis Min and Max Length property, to avoid reach positions outside this range (avoid colisions). May use the autodetect length for that
//TODO: Add milimeter to pulse ratio
export class SingleAxis {
 
    // internal state
    isReadyToGo: boolean = false // indicate that axis has already been sucessfully initialized

    constructor(
        public tunnel: Tunnel, 
        public axisName: AxisName = 'Unamed_Axis',
        public milimeterToPulseRatio: number = 1, //TODO: This default value may be a wrong design decision (verify it, and update) 
        public tolerance: readonly [lowerBound: Pulses, upperBound: Pulses] = [Pulses(4), Pulses(4)] as const,
        public axisRange: AxisRange | undefined = undefined, 
        public referenceParameters: SmartReferenceParameters = defaultReferenceParameter,
        public transportLayer = CMPP00LG(tunnel),
        //public initialConfig: InitialConfig
        ) { }

    protected __convertMilimetersToPulse = (_: Milimeter): Pulses => {
        const milimeter = _.value
        const pulses = milimeter / this.milimeterToPulseRatio
        return Pulses(pulses)
    }

    protected __convertMovimentPositionToPulses = (_: Moviment): Pulses => {
        const { position } = _
        const kind = _.position.kind
        switch (kind) {
            case 'Milimeter': {
                return this.__convertMilimetersToPulse(_.position)
            }
            case 'Pulses': {
                return _.position
            }
            default:
                return exhaustiveSwitch(kind)
        }
    }

    public waitUntilConditionIsReached = async (hasReached: (_:SingleAxis) => Promise<boolean>): Promise<void> => {
        const hasNotReched = async () => !(await hasReached(this))
        while( await hasNotReched() ) {
            // infinite loop
            // TODO: introduce a timeout for this loop
        }
    }

    private __doesPositionMatch = (currentPosition_: Pulses, expectedPosition_: Pulses, tolerance: Tolerance):boolean => {
        const [a, b] = tolerance
        const lowerDelta = a.value
        const upperDelta = b.value
        const expectedPosition = expectedPosition_.value
        const lowerBound = expectedPosition - lowerDelta
        const upperBound = expectedPosition + upperDelta
        const currentPosition = currentPosition_.value 
        const isOutOfRange = currentPosition < lowerBound || currentPosition > upperBound
        return !isOutOfRange
    }
    
    public checkCurrentPosition = async (expectedPosition: Pulses,tolerance = this.tolerance): Promise< {isActualPositionAsExpected: boolean, currentPosition: Pulses, expectedPosition: Pulses}> => {
        const currentPosition = await this.getCurrentPosition()
        const isActualPositionAsExpected = this.__doesPositionMatch(currentPosition, expectedPosition, tolerance)
        return { isActualPositionAsExpected, currentPosition, expectedPosition }
        
    }

    public waitToStop = (): Promise<void> => {
        // TODO: add timeout
        return this.waitUntilConditionIsReached( axis => 
            new Promise( resolve => { 
                axis.getMovimentStatus()
                .then( status => status.isStopped ? resolve(true) : resolve(false)) 
            })
        )
    }

    public setPrintings = async (data: PrintingPositions2) => {
        const { 
            numeroDeMensagensNoAvanco,
            numeroDeMensagensNoRetorno,
            posicaoDaPrimeiraMensagemNoAvanco,
            posicaoDaPrimeiraMensagemNoRetorno,
            posicaoDaUltimaMensagemNoAvanco,
            posicaoDaUltimaMensagemNoRetorno,
        } = data
        const { set } = this.transportLayer
        await set('Numero de mensagem no avanco',numeroDeMensagensNoAvanco)
        await set('Numero de mensagem no retorno', numeroDeMensagensNoRetorno)
        await set('Posicao da primeira impressao no avanco', posicaoDaPrimeiraMensagemNoAvanco)
        await set('Posicao da primeira impressao no retorno', posicaoDaPrimeiraMensagemNoRetorno)
        await set('Posicao da ultima mensagem no avanco', posicaoDaUltimaMensagemNoAvanco)
        await set('Posicao da ultima mensagem no retorno', posicaoDaUltimaMensagemNoRetorno)
    }

    public resetPrintings = async () => {
        const { set } = this.transportLayer
        await set('Numero de mensagem no avanco', 0)
        await set('Numero de mensagem no retorno', 0)
        
    }

    public startSerial = async () => {
        const { set } = this.transportLayer
        await set('Modo manual serial', 'desligado')
        await set('Stop serial', 'desligado')
        await set('Pausa serial','desligado')
        await set('Start serial', 'ligado')
    }

    public isReferenced = async () => {
        const status = await this.getMovimentStatus()
        const isReferenced = status.isReferenced
        this.isReadyToGo = isReferenced
        return isReferenced
    }

    /** Imediately power off the axis, even if it is currently in moviment. NOTE: Take care to avoid colisions! */
    public shutdown = async () => {
        const { set } = this.transportLayer
        await set('Modo manual serial', 'ligado')
        await set('Stop serial', 'ligado')
        await set('Pausa serial','ligado')
        //
        this.isReadyToGo = false
    }

    /** assures the axis is prepered to receive new commands, returns current position after initialization */
    async initialize(referenceParameters: SmartReferenceParameters = this.referenceParameters):Promise<void> {

        const { set } = this.transportLayer

        const preConfig = async () => {         
            await set('Numero de mensagem no avanco', 0),
            await set('Numero de mensagem no retorno', 0),
            await set('Modo continuo/passo a passo', 'continuo'),
            //
            await set("Start automatico no avanco", 'desligado')
            await set("Start automatico no retorno", 'desligado')
            await set("Modo continuo/passo a passo", 'continuo')
            await set("Saida de start no avanco", 'desligado')
            await set("Saida de start no retorno", 'desligado')
            await set("Start externo habilitado", 'desligado') // TODO: Not sure this option should be on or off
            await set("Entrada de start entre eixo habilitado", 'desligado')
            await set("Tempo para o start automatico", TicksOfClock(10))
            await set("Tempo para o start externo",  TicksOfClock(10))
            await set("Referencia pelo start externo", 'desligado') // TODO: Not sure this option should be on or off
            await set('Giro com funcao de correcao', 'desligado')
            await set('Giro com funcao de protecao', 'ligado')
        }

        const setSmartReference = async (r: SmartReferenceParameters) => {
            const {reference, endPosition}  = r
            await set("Posicao inicial", endPosition)
            await set("Posicao final", Pulses(endPosition.value+10)) // defined here just to assure it is a valid position and it is different of "Posicao Inicial"
            //TODO? CAN I avoid send both (avanco and retorno) given just one of them will really be necessary?
            await set("Velocidade de avanco", reference.speed)
            await set("Velocidade de retorno", reference.speed)
            await set("Aceleracao de avanco", reference.acceleration)
            await set("Aceleracao de retorno", reference.acceleration)
            // perform reference proccess
            await set("Velocidade de referencia", reference.speed)
            await set("Aceleracao de referencia", reference.acceleration)
        }

        // TODO: add timeout
        const waitReferenceToConclude = ():Promise<void> =>{
            return this.waitUntilConditionIsReached( async axis => {
                const status = await axis.getMovimentStatus()
                return !status.isReferencing  
            })
            
        }

        const checkFinalStatus = async (r: SmartReferenceParameters):Promise<void> => {
            //check expected cmpp condition
            const expectedStatus = {
                isReferenced: true,
                isStopped: true,
                isReferencing: false,
                //direction: 'Avanco',
            }
            const status = await this.getMovimentStatus()
            const { isReferenced, isStopped, direction, isReferencing } = status
            const { isActualPositionAsExpected, currentPosition} = await this.checkCurrentPosition(r.endPosition)
            const isStatusOk = isReferenced && isStopped && !isReferencing //&& direction==='Avanco'
            if (isStatusOk) {
                if (isActualPositionAsExpected) {
                    return // Ok everything goes right, successful finish
                }
                else {
                    throw new Error(`Posicao ao final da referencia nao corresponde a desejada. Esperada=${r.endPosition.value}, atual=${currentPosition.value}.`)
                }
            } else {
                //TODO: Improve format of this error message
                const actualStatus = { isReferenced, isStopped, isReferencing/*, direction*/}
                const header = `During reference of axis ${this.axisName}.`
                const err = `'Something went wrong during referentiation proccess': Final condition expected was not attended. `
                const detail = `Expected=${JSON.stringify(expectedStatus)} actual=${JSON.stringify(actualStatus)}. `
                const msg = header + err + detail
                throw new Error(msg)
            }
        }
    

        const runSmartReference = async (r: SmartReferenceParameters) => {
            await this.shutdown()
            await preConfig()
            await setSmartReference(r)
            await this.startSerial()
            await waitReferenceToConclude()
            await checkFinalStatus(r)
        }
        
        //routine
        await runSmartReference(referenceParameters)
        this.isReadyToGo = true
        return 

    }

    //TODO: Implement a state report to be used alongside error messages and debuging
    public report = async() => {
        return
        const { get } = this.transportLayer
        const { direction } = await this.getMovimentStatus()
        const PI = await get('Posicao inicial')
        const PF = await get('Posicao final')
        const PA = await this.getCurrentPosition()
        console.table({
            axis: this.axisName,
            direction,
            PI: PI.value,
            PF: PF.value,
            PA: PA.value,
        })
    }

    //NOTE: Will throw if axis is not initialized
    //TODO: should be better implement to reduce time interval between movimentss
    //TODO: Improve error messages
    goto = async (target: Moviment , tolerance: Tolerance = this.tolerance): Promise<void> => {
        const { set, get } = this.transportLayer
        const {position, speed, acceleration} = target
        const positionInPulses = this.__convertMovimentPositionToPulses(target)

        const throwIfNotReadyToGo = () => {
            if(this.isReadyToGo===false) {
                throw new Error(`Axis=${this.axisName}: Cannot perform goto moviment, because axis is not initialized`)
            }
        }

        const setNextMoviment = async (m: Moviment) => {
            await set('Posicao final', positionInPulses)
            await set('Velocidade de avanco', m.speed)
            await set('Velocidade de retorno', m.speed)
            await set('Aceleracao de avanco', m.acceleration)
            await set('Aceleracao de retorno', m.acceleration)
        }

        const { startSerial, waitToStop } = this

        const checkFinalStateOrThrow = async (): Promise<void> => {
            const { isReferenced } = await this.getMovimentStatus()
            if(isReferenced===false) {
                throw new Error(`Axis=${this.axisName}: dereferentiated after attempt to perform a movimentks.`)
            }
            const { isActualPositionAsExpected, currentPosition, expectedPosition } = await this.checkCurrentPosition(positionInPulses, tolerance)
            if(isActualPositionAsExpected) {
                //await this.report()
                return // ok, everything goes right
            } else {
                const PI = await get('Posicao inicial')
                const PF = await get('Posicao final')
                throw new Error(`Axis=${this.axisName}: after attempt to perform a moviment, realized that actual position is not the expected position (including error tolerance). Expected=${expectedPosition.value}, current=${currentPosition.value}, tolerance=[${tolerance[0].value},${tolerance[1].value}], PI=${PI.value}, PF=${PF.value}`)
            }
        }

        const recipe = async () => {
            throwIfNotReadyToGo();
            // do nothing if you already at the exactly position you got to go. Because if 'posicao_corrent'==='posicao_final' in next start it will
            // go to 'posicao_inicial' that is what we want to prevent. Because this will raise an 'position in reached event'. Because we make 'posicao_inicial' static, and use 'posicao_final' as a dynamic target position to reach. 
            //do not perform anymoviment, we already are where we want. This prevent an undesired behavior of the physical axis
            const { isActualPositionAsExpected: isAlreadyInTargetPosition } = await this.checkCurrentPosition(positionInPulses, this.tolerance) 
            if(isAlreadyInTargetPosition===false) {
                //perform the moviment
                await setNextMoviment(target);
                await startSerial();
                await waitToStop();
                await checkFinalStateOrThrow();
            } else {
                // do nothing
                return
            }
            
        }

        //run
        await recipe()

    } 

    gotoRelative = async (target: Moviment , tolerance: Tolerance = this.tolerance): Promise<void> => {
        const currentPosition = await this.getCurrentPosition()
        const targetRelative: Moviment = {
            ...target,
            position: Pulses(currentPosition.value + target.position.value)
        }
        await this.goto(targetRelative, tolerance)
    }

    //TODO: should be better implement to reduce time interval between movimentss
    gotoMany = async (targets: Iterable<Moviment> , tolerance: Tolerance = this.tolerance): Promise<void> => {
        const itor = targets[Symbol.iterator]()
        let next = itor.next()
        while(!next.done) {
            const m = next.value
            await this.goto(m)
            next = itor.next();
        }
    } 


    async getMovimentStatus(): Promise<MovimentStatus> {
        const cmpp = makeCmppControler(this.tunnel)
        const axis = AxisControler(cmpp)
        const status = await axis.getMovimentStatus()
        return status
    }

    async getCurrentPosition(): Promise<Pulses> {
        //TODO: if axis has not move, why do not to use a cached value ?
        const cmpp = makeCmppControler(this.tunnel)
        const axis = AxisControler(cmpp)
        const currentPosition = await axis.getCurrentPosition()
        return currentPosition
    }

    

} 