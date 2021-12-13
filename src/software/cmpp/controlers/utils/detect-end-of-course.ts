
import { Pulses, Pulses_ } from "../../transport/memmap-types"
import { AxisControler } from "../axis-controler"
import { Kinematics, Moviment } from "../core"
import { goNext, setNextRelative } from "./go-next"
import { forceSmartReference } from "./smart-reference"



export type DetecEndOfCourseParameters = {
    referencePhase: {
        reference: Kinematics,  // kinematics of reference
        endPosition: Pulses,    // where the cursor will be after the end of reference phase
    }
    searchPhase: {
        startAt: Moviment   // you may start near your best guess, instead of from zero
        endSearchAt: Pulses // but eventually if you not reach never the end, you can consider to not go so far then about 'endSearchAt'. 
        advancingSteps: Pulses // how many steps to advance
        advancingKinematics: Kinematics // what kinematics to advance
        
    }
}

export const detectEndOfCourse = async (axisControler: AxisControler, args: DetecEndOfCourseParameters): Promise<Pulses> => {
    const { referencePhase, searchPhase} = args
    await forceSmartReference(axisControler, referencePhase)
    await goNext(axisControler, searchPhase.startAt)

    const firstApproximation = async (amount: Pulses, kinematics: Kinematics): Promise<Pulses> => {  
        const isNotVeryLargeCourse = async () => (await axisControler.getCurrentPosition()).value <= searchPhase.endSearchAt.value
        while ( await axisControler.isReferenced() && await isNotVeryLargeCourse()) {
            // 1 advancement step forward
            await setNextRelative(axisControler,{position: amount, ...kinematics})
            await axisControler.start()
            await axisControler.waitToStop()
        }
        const result = await axisControler.getCurrentPosition()
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
