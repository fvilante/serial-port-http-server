import { AxisControler, getAxisControler } from "./axis-controler"
import { Milimeter } from "./axis-position"
import { X_AxisStarterKit, Y_AxisStarterKit, Z_AxisStarterKit } from "./axis-starter-kit"
import { Printers } from "./global"
import { ExecuteInParalel, executeInSequence } from "./promise-utils"
import { isInsideRange } from "./utils"


// *******************************
// Controls the machine 3 axis
// gives an interface API that
// hides complexity of dealing
// single axis
// *******************************


export type MovimentKit = {
    x: AxisControler,
    y: AxisControler,
    z: AxisControler,
    m: MachineControler,
}

// Fix: remove this job and substitute by the other
type Job = {
    readonly remoteFieldIndex: number
    readonly text: string,
    readonly printer: Printers,
    readonly zPosition: number,
    readonly xyPositions: readonly {y: number, xs: readonly Milimeter[] }[],
    readonly printSpeed: number
}

export type MachineControler = {
    safelyReferenceSystemIfNecessary: () => Promise<void>
    parkSafelyIfItisPossible: () => Promise<void>
    doOneJob: (job: Job) => Promise<void>
    _assureZisSafe: () => Promise<void>
}

export const MachineControler = async (
    axisCommanders: {x: AxisControler, y: AxisControler, z: AxisControler}
    ): Promise<MachineControler> => {

        type T = MachineControler

        const {x, y, z} = axisCommanders

        const safelyReferenceSystemIfNecessary:T['safelyReferenceSystemIfNecessary'] = async () => {
            const referenceXandYIfNecessary = async () => {
                await ExecuteInParalel([
                    () => x.doReferenceIfNecessary(),
                    () => y.doReferenceIfNecessary(),
                ]) 
                return
            }
            //FIX: I'm not being completely eficient here, because I'm
            //     performing same device call multiple times in both
            //     functions below
            //     solution: to cache response or to improve logic (or both)
            await _assureZisSafe()
            await referenceXandYIfNecessary()
            return
        }

        const parkSafelyIfItisPossible: T['parkSafelyIfItisPossible'] = async () => {
            const [xIsRef, yIsRef, zIsRef] = await ExecuteInParalel([
                () => x.isReferenced(),
                () => y.isReferenced(),
                () => z.isReferenced(),
            ] as const)

            const performParking = async () => {
                const [minY, maxY] = y._getAbsolutePositionRange()
                const [minX, maxX] = x._getAbsolutePositionRange()
                const XMeiodaJanela = 2500
                const YfrenteDaMaquina = maxY
                const InicioDoY = minY
                const FinalDoX = maxX
                const YParkPosition = InicioDoY
                const XParkPosition = FinalDoX
                await ExecuteInParalel([
                    () => executeInSequence([
                        () => x.goToAbsolutePosition(XParkPosition),
                        () => x._forceLooseReference(),
                    ]),
                    () => executeInSequence([
                        () => y.goToAbsolutePosition(YParkPosition),
                        () => y._forceLooseReference(),
                    ])
                ])
                return
            }

            const isSafeToPark = (xIsRef && yIsRef) && zIsRef

            if (isSafeToPark) {
                await performParking()
            } else {
                // not safe to peform park
                // Fix: What should I do here? Should I assure Y is safe (and have the cost to hereference all the system just to park?)
                //      I want to avoid do lots of moviments without any log information, because in Maintanence Mode some akward behavior may happen
                //      I should think a solution for this (how to log information and improve maintenance mode (fail mode))
                //      Currently I'm doing nothing (without no feed back to the caler :( ))
                return
            }
            
        }

        const doOneJob: T['doOneJob'] = async (job) => {    
            //
            
          
        }

        // Z is safe if:
        //  - It is at the safe position
        //  - Otherwise Z is not safe
        // If Z is unreferenced all other axis are stopped
        //  then Z is referenced first, and it go to Minimum Z position (MinZ), 
        //  then others axis can be referenced in parallel if necessary
        // FIX: The logic should improve to preserve X and Y reference if possible
        //      I'm not being efficient at not lossing X and Y reference if possible
        const _assureZisSafe = async () => {
            // FIX: See ideas bellow
            // what if only a job can move down Z, otherwise it is aways at safe position?
            // how to park Z definetely and unsafly? 
            const [minZ, maxZ] = z._getAbsolutePositionRange()    
            const zIsRef = await z.isReferenced()
           
            const stopAxisIfItIsMoving = async (axis: AxisControler): Promise<void> => {
                const isMoving = await axis.isMoving()
                if (isMoving===true) {
                    await x._stop()
                }
                return
            }

            const stopXandY = async () => {
                await ExecuteInParalel([
                    () => x._stop(),
                    () => y._stop(),
                ])
                return 
            }
            
            const isZCurrentAtASafePosition = async (): Promise<boolean> => {
                
                if (zIsRef===true) {
                    const zSafePositionRange = [minZ-10,minZ+10] as const
                   
                    const zCurrentPosition = await z.getCurrentAbsolutePosition()
            
                    const zIsAtSafePosition = isInsideRange(zCurrentPosition, zSafePositionRange)
                    return zIsAtSafePosition
                } else {
                    //Z is not referenced, so it is not safe
                    return false
                }
                
            }

            const isZCurrentAtASafePosition_ = await isZCurrentAtASafePosition()
            
            if(isZCurrentAtASafePosition_===false) {
                //Fix: Supose Z is down (or not referenced), if X and Y are not moving you do not need to stop it. 
                //You should monitor X and Y while you are putting Z at a safe state, and only to
                //produce effect on Y or Y if they try to move, otherwise you should not touch them
                await stopXandY()
                await z.doReferenceIfNecessary()
                await z.goToAbsolutePosition(minZ)
            } 

            // Z is safe and referenced here !
            
            await ExecuteInParalel([
                () => x.doReferenceIfNecessary(),
                () => y.doReferenceIfNecessary(),
            ]) 

            // X,Y and Z are referenced here, and Z is at his safe position

            
            return

        }

        return {
            safelyReferenceSystemIfNecessary,
            parkSafelyIfItisPossible: parkSafelyIfItisPossible,
            doOneJob,
            _assureZisSafe,
        }
}

// Fix: I'd like not to have to import AxisStartKit. I would not use this 'starter kit strategy' at all
export const makeMovimentKit = async ():Promise<MovimentKit> => {
    const z = getAxisControler(Z_AxisStarterKit)
    const x = getAxisControler(X_AxisStarterKit)
    const y = getAxisControler(Y_AxisStarterKit)
    const m = await MachineControler({x,y,z})
    return { x, y, z, m }
}