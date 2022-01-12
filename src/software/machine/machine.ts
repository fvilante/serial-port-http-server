import { Moviment } from "../cmpp/controlers/core";
import { ExecuteInParalel } from "../core/promise-utils";
import { SingleAxis } from "./single-axis";

type Moviment3D = {
    X: Moviment
    Y: Moviment
    Z: Moviment
}



export class Machine {
    

    constructor(
        public axis: { 
            X: SingleAxis,  // horizontal and printing axis
            Y: SingleAxis,  // horizontal axis
            Z: SingleAxis,  // vertical axis
        }
    ) { }

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

    public goto = async (m: Moviment3D): Promise<void> => {
        // to avoid collision when  axis Z (vertical axis) is moving, NO other axis are moving together!
        const { axis } = this
        type AxisKeys = keyof typeof this.axis
        const move = async (key: AxisKeys): Promise<void> => {
            const axis_ = axis[key]
            await axis_.goto2(m[key])
        }

        await move('Z')
        await ExecuteInParalel([
            () => move('X'), 
            () => move('Y'),
        ])
    }

}