import { Moviment } from "../cmpp/controlers/core";
import { ExecuteInParalel } from "../core/promise-utils";
import { PrintingPositions2, SingleAxis } from "./single-axis";

export type Moviment3D = {
    X: Moviment
    Y: Moviment
    Z: Moviment
}

//NOTE: This machine is specialize for Leon aplication
//      features:
//          - when Z axis (the only vertical axis) move, all other axis (horizontal) stay static to avoid colision
//          - the printing axis is the X axis.
//          - axis XY moves in paralel, and Z move alone while X is set with printing messages
//
//TODO: Make some caching to avoid resend already sent data
export class Machine {
    
    constructor(
        public axis: { 
            X: SingleAxis,  // horizontal and printing axis
            Y: SingleAxis,  // horizontal axis
            Z: SingleAxis,  // vertical axis
        }
    ) { }

    //TODO: 1. rename to doReferenceIfNecessary. 2. Maybe some parameter must be passed to the function like (smartReferenece parameter?)
    public initialize = async () => {
        //assure all axis are referentiated, but first do not referentiate other axis until 'Z' (vertical axis) is fully referentiated
        const { axis } = this
        type AxisKeys = keyof typeof this.axis
        const doReferenceIfNecessary = async (key: AxisKeys) => {
            const axis_ = axis[key]
            const isReferenced = await axis_.isReferenced()
            if(!isReferenced) {
                await axis_.initialize()
            }
        }
        await doReferenceIfNecessary('Z')
        await ExecuteInParalel([
            () => doReferenceIfNecessary('X'), 
            () => doReferenceIfNecessary('Y'),
        ])

    }

    public goto = async (m: Moviment3D, printings?: PrintingPositions2): Promise<void> => {
        // to avoid collision when  axis Z (vertical axis) is moving, NO other axis are moving together!
        const { axis } = this
        type AxisKeys = keyof typeof this.axis
        const move = async (key: AxisKeys): Promise<void> => {
            const axis_ = axis[key]
            await axis_.goto(m[key])
        }

        const sendPrintings = async () => {
            if(printings) {
                await axis.X.setPrintings(printings)
            } else {
                return
            }
        }

        await ExecuteInParalel([
            () => move('Z'),
            () => sendPrintings(),
        ])
        await ExecuteInParalel([
            () => move('X'), 
            () => move('Y'),
        ])
    }

    //TODO: This shutdown should not deenergize Z axis (vertical axis) to avoid print head colisions
    public shutdown = async (): Promise<void> => {
        const { X, Y, Z} = this.axis
        await ExecuteInParalel([
            () => X.shutdown(),
            () => Y.shutdown(),
            () => Z.shutdown(),
        ]) 
    }

}