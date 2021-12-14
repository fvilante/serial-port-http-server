import { Pulses } from "../physical-dimensions/base";
import { CmppControler } from "./cmpp-controler";
import { Moviment } from "./core";
import { DetecEndOfCourseParameters, detectEndOfCourse } from "./utils/detect-end-of-course";
import { setNext, setNextRelative } from "./utils/go-next";
import { castStatusLToMovimentStatus, getMovimentStatus, MovimentStatus } from "./utils/moviment-status";
import { doSmartReferenceIfNecessary, forceSmartReference, SmartReferenceParameters } from "./utils/smart-reference";

export type AxisControler = {
    kind: 'AxisControler'
    //reference
    forceLooseReference: () => Promise<void>
    forceSmartReference: (_: SmartReferenceParameters) => Promise<void>
    doSmartReferenceIfNecessary: (_: SmartReferenceParameters) => Promise<void>
    //params
    setNext: (next: Moviment) => Promise<void>
    setNextRelative: (next: Moviment) => Promise<void>
    //start
    start: () => Promise<void>
    //
    __autodetectEndOfCourse: (args: DetecEndOfCourseParameters) => Promise<Pulses>  //TODO: Verify if this function is safe to be here
    //
    getCurrentPosition: () => Promise<Pulses>
    getMovimentStatus: () => Promise<MovimentStatus>
}

export const AxisCotroler = (cmppControler: CmppControler): AxisControler => {


    return {
        kind: 'AxisControler',

        forceLooseReference: () => cmppControler.forceLooseReference(),

        forceSmartReference: (parameters: SmartReferenceParameters) => {
            return forceSmartReference(cmppControler, parameters)
        },

        doSmartReferenceIfNecessary: (parameters: SmartReferenceParameters) => {
            return doSmartReferenceIfNecessary(cmppControler, parameters)
        },

        setNext: (next: Moviment) => setNext(cmppControler, next),

        setNextRelative: (next: Moviment) => setNextRelative(cmppControler, next),

        start: () => cmppControler.start(),

        __autodetectEndOfCourse: (args: DetecEndOfCourseParameters) => detectEndOfCourse(cmppControler, args),

        getCurrentPosition: () => cmppControler.getCurrentPosition(),

        getMovimentStatus: async () => {
            const statusLow = await cmppControler.getStatusL()
            return castStatusLToMovimentStatus(statusLow)
        },
        
    }
}