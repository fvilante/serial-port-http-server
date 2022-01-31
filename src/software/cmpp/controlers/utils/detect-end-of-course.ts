
import { Pulses, Pulses_ } from "../../physical-dimensions/physical-dimensions"
import { CmppControler } from "../cmpp-controler"
import { Kinematics, Moviment, Moviment_, PositionInPulses } from "../core"
import { goNext, setNextRelative } from "./go-next"
import { forceSmartReference, SmartReferenceParameters } from "./smart-reference"



export type DetecEndOfCourseParameters = {
    referencePhase: SmartReferenceParameters
    searchPhase: {
        startAt: Moviment_   // you may start near your best guess, instead of from zero
        endSearchAt: Pulses // but eventually if you not reach never the end, you can consider to not go so far then about 'endSearchAt'. 
        advancingSteps: Pulses // how many steps to advance
        advancingKinematics: Kinematics // what kinematics to advance
        
    }
}

export const detectEndOfCourse = async (cmppControler: CmppControler, args: DetecEndOfCourseParameters): Promise<Pulses> => {
    const { referencePhase, searchPhase} = args
    await forceSmartReference(cmppControler, referencePhase)
    await goNext(cmppControler, searchPhase.startAt)

    const firstApproximation = async (amount: Pulses, kinematics: Kinematics): Promise<Pulses> => {  
        const isNotVeryLargeCourse = async () => (await cmppControler.getCurrentPosition()).value <= searchPhase.endSearchAt.value
        while ( await cmppControler.isReferenced() && await isNotVeryLargeCourse()) {
            // 1 advancement step forward
            await setNextRelative(cmppControler,{position: amount, ...kinematics})
            await cmppControler.start()
            await cmppControler.waitToStop()
        }
        const result = await cmppControler.getCurrentPosition()
        return result
    }

    const secondApproximation = async (firstApproximation: Pulses): Promise<Pulses> => {
        const estimatedNumberOfPulsesPerMotorRevolution = 400
        const safetyFactor = 1.2 // TODO: this factor was arbitrary defined, verify if it can be computated from any concrete parameter
        const delta = Pulses(estimatedNumberOfPulsesPerMotorRevolution * safetyFactor)
        const result = Pulses_.subtract(firstApproximation, delta)
        return result
    }

    /*const thirdApproximation = async (secondApproximation_: Pulses ): Promise<Pulses> => {
        await forceSmartReference(referencePhase)
    }*/

    const performDetectionAlorithm = async () => {
        const firstApprox = await firstApproximation(searchPhase.advancingSteps, searchPhase.advancingKinematics)
        const secondApprox = secondApproximation(firstApprox)
        //await forceSmartReference(referencePhase)
        return secondApprox
    }

    const response = await performDetectionAlorithm()
    
    return response 

}
