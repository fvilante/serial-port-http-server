import { AxisControler } from "../cmpp/controlers/axis-controler";
import { CmppControler, makeCmppControler } from "../cmpp/controlers/cmpp-controler";
import { Moviment } from "../cmpp/controlers/core";
import { setNext } from "../cmpp/controlers/utils/go-next";
import { MovimentStatus } from "../cmpp/controlers/utils/moviment-status";
import { SmartReferenceParameters } from "../cmpp/controlers/utils/smart-reference";
import { Position, Pulses, TicksOfClock } from "../cmpp/physical-dimensions/base";
import { PulsesPerTick, PulsesPerTickSquared } from "../cmpp/physical-dimensions/physical-dimensions";
import { CMPP00LG } from "../cmpp/transport/memmap-CMPP00LG";
import { Tunnel } from "../cmpp/transport/tunnel";

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

export type Tolerance = readonly [lowerDelta: Pulses, upperDelta: Pulses]


export class SingleAxis {
 
    // internal state
    isReadyToGo: boolean = false // indicate that axis has already been sucessfully initialized

    constructor(
        public tunnel: Tunnel, 
        public axisName: AxisName = 'Unamed_Axis', 
        public tolerance: readonly [lowerBound: Pulses, upperBound: Pulses] = [Pulses(3), Pulses(3)] as const,
        public axisRange: AxisRange | undefined = undefined, 
        public referenceParameters: SmartReferenceParameters = defaultReferenceParameter,
        public transportLayer = CMPP00LG(tunnel)
        ) { }

    public waitUntilConditionIsReached = async (hasReached: (_:SingleAxis) => Promise<boolean>): Promise<void> => {
        const hasNotReched = async () => !(await hasReached(this))
        while( await hasNotReched() ) {
            // infinite loop
            // TODO: introduce a timeout for this loop
        }
    }

    public checkCurrentPosition = async (expectedPosition: Pulses, tolerance = this.tolerance): Promise< {isActualPositionAsExpected: boolean, currentPosition: Pulses, expectedPosition: Pulses}> => {
        const currentPosition = await this.getCurrentPosition()
        const doesPositionMatch = (currentPosition_: Pulses, expectedPosition_: Pulses, tolerance: Tolerance):boolean => {
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
        const isActualPositionAsExpected = doesPositionMatch(currentPosition, expectedPosition, tolerance)
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
    //TODO: Improve error messages
    goto2 = async (target: Moviment , tolerance: Tolerance = this.tolerance): Promise<void> => {
        const { set, get } = this.transportLayer
        const {position, speed, acceleration} = target
        if(this.isReadyToGo===false) {
            throw new Error(`Axis=${this.axisName}: Cannot perform goto moviment, because axis is not initialized`)
        }
        // do nothing if you already at the exactly position you got to go. Because if 'posicao_corrent'==='posicao_final' in next start it will
        // go to 'posicao_inicial' that is what we want to prevent. Because this will raise an 'position in reached event'. Because we make 'posicao_inicial' static, and use 'posicao_final' as a dynamic target position to reach. 
        const currentPositionBefore = (await this.getCurrentPosition()).value
        const targetMovimentPosition = target.position.value
        const goingToExactlySamePosition = currentPositionBefore === targetMovimentPosition
        if(goingToExactlySamePosition) {
            //do not perform anymoviment, we already are where we want. This prevent an undesired behavior of the physical axis
            return     
        }
        // else continue...
        await set('Posicao final', position)
        //
        await set('Velocidade de avanco', speed)
        await set('Velocidade de retorno', speed)
        await set('Aceleracao de avanco', acceleration)
        await set('Aceleracao de retorno', acceleration)
        //
        await this.startSerial()
        await this.waitToStop()
        const { isReferenced } = await this.getMovimentStatus()
        if(isReferenced==false) {
            throw new Error(`Axis=${this.axisName}: dereferentiated after attempt to perform a movimentks.`)
        }
        const { isActualPositionAsExpected, currentPosition, expectedPosition } = await this.checkCurrentPosition(position, tolerance)
        if(isActualPositionAsExpected) {
            //await this.report()
            return // ok, everything goes right
        } else {
            const PI = await get('Posicao inicial')
            const PF = await get('Posicao final')
            throw new Error(`Axis=${this.axisName}: after attempt to perform a moviment, realized that actual position is not the expected position (including error tolerance). Expected=${expectedPosition.value}, current=${currentPosition.value}, tolerance=[${tolerance[0].value},${tolerance[1].value}], PI=${PI.value}, PF=${PF.value}`)
        }
    } 

    /** goto absolute position, returns the exact position after the moviment 
     *  NOTE: This function will call 'initialize' if it has not been executed yet.
     *  NOTE: If equipment become dereferenced during the moviment, this function will throw an Error. You can try to recovery from this error running the initializer again
     *  NOTE: If position required is out of 'AxisRange' then throw an Error
    */
    async goto(moviment_: Moviment, tolerance_?: Tolerance):Promise<Pulses> {

        const tolerance = tolerance_ ?? this.tolerance

        const isInsideTotalRange = (position: Pulses): boolean => {
            if(this.axisRange) {
                const isOutOfRange = position.value < this.axisRange.min.value || position.value > this.axisRange.max.value
                return !isOutOfRange
            } else {
                // if there is no limits defined, everything is acceptable
                return true
            }
        }

        const hasStoppedInCorrectPosition = (currentPosition_: Pulses, expectedPosition_: Pulses, tolerance: Tolerance):boolean => {
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

        const go_ = async (tolerance_: Tolerance, retrial: number):Promise<Pulses> => {
            const cmpp = makeCmppControler(this.tunnel)
            const axis = AxisControler(cmpp)
            await setNext(cmpp, roundedMoviment)
            await cmpp.start()
            await cmpp.waitUntilConditionIsReached( controler => {
                return controler.isStoped()
            })
            // check if equipment is still referentiated
            const isReferenced = await cmpp.isReferenced()
            if(!isReferenced) throw new Error(`Axis '${this.axisName}' loose reference during moviment`)
            const currentPosition = await axis.getCurrentPosition()
            // check if it stoped at a valid position
            const expectedPosition = roundedMoviment.position
            const isValidPosition = hasStoppedInCorrectPosition(currentPosition, expectedPosition, tolerance)
            console.log(`isValidPosition`,isValidPosition)
            if (!isValidPosition) {
                //TODO: IMPROVE THE APPROUCH TO THIS ERROR CORRECTION
                //      For example: reduce the distance of Posicao_inicial and Posicao_final
                //                   and/or referentiate as an last attempt. Is useful to wait before retry this attempts to not make the moviment unpredictable to the operator
                /*bugfix: first approuch to the error:
                    when working with 3 axis simultaneously, after some minutes of working, moving to aleatory positions, the axis goes to Posicao_inicial instead of to Posicao_final.
                    In this case we are confirming at each moving, if the stop position is equivalent to the target position. 
                    If not new attempts to reach the position is tried before raise an fatal error.
                */
                if (retrial<=0) {
                    let currentPosition__: Pulses | undefined = undefined
                    try {
                        currentPosition__ = await this.getCurrentPosition()
                    } catch (err) { 
                        // do nothing
                    }
                    const header = `Axis '${this.axisName}': `
                    const msg1 = `Unsuccessfuly attempt to recovery from wrong target position error.`
                    const msg2 = `'Goto' command stoped out of the expected position considering tolerance range (expected=${expectedPosition.value}, actual=${currentPosition.value}, range=[${tolerance[0].value}, ${tolerance[1].value}] inclusive-inclusive). Aborting with error`
                    const msg3 = `Current position after all recovery attempts is ${currentPosition__?.value} pulses`
                    const errmsg = header + msg1 + msg2 + msg3
                    throw new Error(errmsg)
                } else /*retrial > 0*/{
                    console.log('----------------------------------------------------------------------')
                    console.log('Nao chegou no target position: Tentando novamente !!')
                    console.log('----------------------------------------------------------------------')
                    await go_(tolerance, retrial-1)
                }
            }
            const response = await axis.getCurrentPosition()
            return response
        }

        // run

        // round moviment (cannot perform fractonary moviment)
        const roundedMoviment: Moviment = {
            position: Pulses(Math.round(moviment_.position.value)),
            speed: PulsesPerTick(Math.round(moviment_.speed.value)),
            acceleration: PulsesPerTickSquared(Math.round(moviment_.acceleration.value)),
        }

        // check bounds
        const isValidPosition = isInsideTotalRange(roundedMoviment.position)
        if (!isValidPosition) throw new Error(`Axis '${this.axisName}': You tried to goto an invalid axis position. Valid Range are between '${this.axisRange?.min.value}' and '${this.axisRange?.min.value}' pulses, but you tried '${roundedMoviment.position.value}'; aborting the moviment with error.`)  

        // perform action
        if (this.isReadyToGo) {
            return go_(tolerance,1)
        } else {
            await this.initialize()
            return go_(tolerance,1)
        }
        
    }

    async getMovimentStatus(): Promise<MovimentStatus> {
        const cmpp = makeCmppControler(this.tunnel)
        const axis = AxisControler(cmpp)
        const status = await axis.getMovimentStatus()
        return status
    }

    async getCurrentPosition(): Promise<Pulses> {
        const cmpp = makeCmppControler(this.tunnel)
        const axis = AxisControler(cmpp)
        const currentPosition = await axis.getCurrentPosition()
        return currentPosition
    }

    

} 