import { Pulses } from "../../physical-dimensions/physical-dimensions"
import { CmppControler } from "../cmpp-controler"
import { Kinematics } from "../core"

/** this reference function was developed to wrap the native cmpp reference proccess, it is smart because it is made to
 *  be repetitible, and explicit in their parameters.
 */


// VERY IMPORTANT: parameter 'endPosition' represents the position where the reference procedure will delivery the motor.
//                 If this number is greater than 1292 pulses, the cmpp microcnotroler will truncate it to 1292
export const forceSmartReference = async (cmppControler: CmppControler, arg: {reference: Kinematics, endPosition: Pulses}) => {
    const { reference, endPosition } = arg

    //stop motor imediatelly
    await cmppControler.forceLooseReference()
    //save previous parameters
    //const saved = await axis.getMainParameters()
    //configure next moviment
    await cmppControler.setParameters({
        "Posicao inicial": endPosition,
        "Posicao final": Pulses(endPosition.value+10), // defined here just to assure it is a valid position and it is different of "Posicao Inicial"
        //TODO: CAN I avoid send both (avanco and retorno) given just one of them will really be necessary?
        "Velocidade de avanco": reference.speed,
        "Velocidade de retorno": reference.speed,
        "Aceleracao de avanco": reference.acceleration,
        "Aceleracao de retorno": reference.acceleration,
    })
    // perform reference proccess
    await cmppControler.forceReference({
        "Velocidade de referencia": reference.speed,
        "Aceleracao de referencia": reference.acceleration,
    })
}


export type SmartReferenceParameters = {
    reference: Kinematics,      // the kinematics of the reference proccess
    endPosition: Pulses,        // the position where the smart reference proccess will delivery the axis after it's reference proccess has been concluded
}

export const doSmartReferenceIfNecessary = async (cmppControler: CmppControler, parameters: SmartReferenceParameters) => {
    const isReferenced_ = await cmppControler.isReferenced()
    if(isReferenced_) {
        return
    } else {
        await forceSmartReference(cmppControler, parameters)
    }
}

