import { Pulses } from "../physical-dimensions/base";
import { Pulses_ } from "../physical-dimensions/physical-dimensions";
import { CmppControler } from "./cmpp-controler";
import { Kinematics, Moviment, PositionInPulses } from "./core";
import { DetecEndOfCourseParameters, detectEndOfCourse } from "./utils/detect-end-of-course";
import { setNext as setNext__, setNextRelative as setNextRelative__} from "./utils/go-next";
import { castStatusLToMovimentStatus, getMovimentStatus, MovimentStatus } from "./utils/moviment-status";
import { doSmartReferenceIfNecessary as doSmartReferenceIfNecessary__, forceSmartReference as forceSmartReference__, SmartReferenceParameters } from "./utils/smart-reference";

export type AxisControler = {
    readonly kind: 'AxisControler'
    //reference
    readonly forceLooseReference: () => Promise<void>
    readonly forceSmartReference: (_: SmartReferenceParameters) => Promise<void>
    readonly doSmartReferenceIfNecessary: (_: SmartReferenceParameters) => Promise<void>
    //params
    readonly setNext: (next: PositionInPulses & Kinematics) => Promise<void>
    readonly setNextRelative: (next: PositionInPulses & Kinematics) => Promise<void>
    //start
    readonly start: () => Promise<void>
    //
    readonly getCurrentPosition: () => Promise<Pulses>
    readonly getMovimentStatus: () => Promise<MovimentStatus>
    //macros
    readonly __autodetectEndOfCourse: (args: DetecEndOfCourseParameters) => Promise<Pulses>  //TODO: Verify if this function is safe to be here
    //TODO: I'm not sure this return type is such that useful or ergonomic (ie: should be better return void or even a Monad ?!)
    readonly goTo: (_: PositionInPulses & Kinematics) => Promise<void>
    readonly goToRelative: (_: PositionInPulses & Kinematics) => Promise<void>
}

export const AxisControler = (cmppControler: CmppControler): AxisControler => {

    type T = AxisControler

    const forceLooseReference: T['forceLooseReference'] = () => cmppControler.forceLooseReference()

    const forceSmartReference: T['forceSmartReference'] = parameters => forceSmartReference__(cmppControler, parameters)

    const doSmartReferenceIfNecessary: T['doSmartReferenceIfNecessary'] = parameters => doSmartReferenceIfNecessary__(cmppControler, parameters)

    const setNext: T['setNext'] = moviment => setNext__(cmppControler, moviment)

    const setNextRelative: T['setNextRelative'] = moviment => setNextRelative__(cmppControler, moviment)

    const start: T['start'] = () => cmppControler.start()

    const getCurrentPosition: T['getCurrentPosition'] = () => cmppControler.getCurrentPosition()

    const getMovimentStatus: T['getMovimentStatus'] = async () => {
        const statusLow = await cmppControler.getStatusL()
        return castStatusLToMovimentStatus(statusLow)
    }

    const __autodetectEndOfCourse: T['__autodetectEndOfCourse'] = (args: DetecEndOfCourseParameters) => detectEndOfCourse(cmppControler, args)

    const goTo: T['goTo'] = async moviment => {
        await setNext(moviment)
        await cmppControler.start()
        await cmppControler.waitUntilConditionIsReached( async controler => {
            return await controler.isStoped()
        })
    }

    const goToRelative: T['goToRelative'] = async next => {
        const currentPosition = await cmppControler.getCurrentPosition()
        const nextPosition = Pulses_.add(currentPosition, next.position)
        const nextMoviment = {...next, position: nextPosition}
        await goTo(nextMoviment)
    }


    return {
        kind: 'AxisControler',
        forceLooseReference,
        forceSmartReference,
        doSmartReferenceIfNecessary,
        setNext,
        setNextRelative,
        start,
        getCurrentPosition,
        getMovimentStatus,
        __autodetectEndOfCourse,
        goTo,
        goToRelative,
        
    }
}