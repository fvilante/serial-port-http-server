import { AxisControler } from "../cmpp/controlers/axis-controler";
import { CmppControler, makeCmppControler } from "../cmpp/controlers/cmpp-controler";
import { Moviment } from "../cmpp/controlers/core";
import { setNext } from "../cmpp/controlers/utils/go-next";
import { MovimentStatus } from "../cmpp/controlers/utils/moviment-status";
import { SmartReferenceParameters } from "../cmpp/controlers/utils/smart-reference";
import { Pulses, TicksOfClock } from "../cmpp/physical-dimensions/base";
import { PulsesPerTick, PulsesPerTickSquared } from "../cmpp/physical-dimensions/physical-dimensions";
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

export type TargetPositionTolerance = readonly [lowerDelta: Pulses, upperDelta: Pulses]

export class SingleAxis {
 
    // internal state
    isReadyToGo: boolean = false // indicate that axis has already been sucessfully initiated
    targetPositionTolerance: TargetPositionTolerance = [Pulses(3), Pulses(3)]

    constructor(
        public tunnel: Tunnel, 
        public axisName: AxisName = 'Unamed_Axis', 
        public axisRange: AxisRange | undefined = undefined, 
        public referenceParameters: SmartReferenceParameters = defaultReferenceParameter
        ) { }

    /** assures the axis is prepered to receive new commands, returns current position after initialization */
    async initialize(ref?: SmartReferenceParameters):Promise<Pulses> {
        try {
            const cmpp = makeCmppControler(this.tunnel)
            const axis = AxisControler(cmpp)
            const status = await this.getMovimentStatus()
            
            const preConfig = () => {
                return cmpp.setParameters({
                    "Start automatico no avanco": 'desligado',
                    "Start automatico no retorno": 'desligado',
                    "Modo continuo/passo a passo": 'continuo',
                    "Saida de start no avanco": 'desligado',
                    "Saida de start no retorno": 'desligado',
                    "Start externo habilitado": 'desligado', // TODO: Not sure this option should be on or off
                    "Entrada de start entre eixo habilitado": 'desligado',
                    "Tempo para o start automatico": TicksOfClock(10),
                    "Tempo para o start externo":  TicksOfClock(10),
                    "Referencia pelo start externo": 'desligado', // TODO: Not sure this option should be on or off

                })
            }

            const doReference = async () => {
                const config = ref ?? this.referenceParameters
                await preConfig()
                await axis.forceLooseReference()
                await axis.forceSmartReference(config)
                const currentPosition = await axis.getCurrentPosition()
                this.isReadyToGo = true
                return currentPosition
            }
            
            if(status.isReferenced && !status.isReferencing) {
                const currentPosition = await axis.getCurrentPosition()
                this.isReadyToGo = true
                return currentPosition
            } else if (status.isReferencing) {
                //TODO: implement a better algorithm (ie: wait reference to conclude instead of restart it)
                return doReference()
            } else /*NOT referenced AND NOT referencing*/{
                return doReference()
            }
        } catch (err) {
            //TODO: Improve this error handling
            this.isReadyToGo = false
            throw err
        }
    }

    /** Imediately power off the axis, even if it is currently in moviment. NOTE: Take care to avoid colisions! */
    async powerOff():Promise<void> {
        const cmpp = makeCmppControler(this.tunnel)
        const axis = AxisControler(cmpp)
        await axis.forceLooseReference()
        this.isReadyToGo = false
    }

    /** goto absolute position, returns the exact position after the moviment 
     *  NOTE: This function will call 'initialize' if it has not been executed yet.
     *  NOTE: If equipment become dereferenced during the moviment, this function will throw an Error. You can try to recovery from this error running the initializer again
     *  NOTE: If position required is out of 'AxisRange' then throw an Error
    */
    async goto(moviment_: Moviment, tolerance_?: TargetPositionTolerance):Promise<Pulses> {

        const tolerance = tolerance_ ?? this.targetPositionTolerance

        const isInsideTotalRange = (position: Pulses): boolean => {
            if(this.axisRange) {
                const isOutOfRange = position.value < this.axisRange.min.value || position.value > this.axisRange.max.value
                return !isOutOfRange
            } else {
                // if there is no limits defined, everything is acceptable
                return true
            }
        }

        const hasStoppedInCorrectPosition = (currentPosition_: Pulses, expectedPosition_: Pulses, tolerance: TargetPositionTolerance):boolean => {
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

        const go_ = async (tolerance_: TargetPositionTolerance, retrial: number):Promise<Pulses> => {
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
            return go_(tolerance,3)
        } else {
            await this.initialize()
            return go_(tolerance,3)
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