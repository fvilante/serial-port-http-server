import { AxisControler, getAxisControler } from "./axis-controler"
import { Milimeter } from "./axis-controler"
import { X_AxisStarterKit, Y_AxisStarterKit, Z_AxisStarterKit } from "./axis-starter-kit"
import { Printers } from "./global-env/global"
import { Matriz } from "./matrix-reader/matrizes-conhecidas"
import { ExecuteInParalel as executeInSerie, executeInSequence } from "./core/promise-utils"
import { isInsideRange, Range } from "./core/utils"


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

export type AxisKit = {
    x: AxisControler,
    y: AxisControler,
    z: AxisControler,
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

type Point = {
    kind: 'Point'
    x: Milimeter
    y: Milimeter
    z: Milimeter
}
const Point = (x: Milimeter, y: Milimeter, z: Milimeter): Point => ({kind: 'Point',x,y,z})


export type PrintMessage = {
    printer: Printers
    passes: number
    msg: string
    remoteFieldId: number
    printVelocity: number // steps per cmppTickClock
}

export type YZColinearPoints = {
    y: Milimeter,
    z: Milimeter,
    xs: readonly Milimeter[]
}

export type MachineControler = {
    safelyReferenceSystemIfNecessary: () => Promise<void>
    safePrintYZColinearAndEquallySpacedPoints: (coLinearPoints: YZColinearPoints, print: PrintMessage) => Promise<void> 
    parkSafelyIfItisPossible_DEPRECATED: () => Promise<void>
    goToGarageifItIsPossible: () => Promise<void>
    isInGarage: () => Promise<boolean>
    goToMaintenanceFrontDoingAllPossible: () => Promise<void>
    safeMoveAbsoluteAndParalelXY: (x: Milimeter, y: Milimeter) => Promise<void> // No printing moviment
    doOneMatriz: (job: Job) => Promise<void>
    _assureZisSafe: () => Promise<void>
    _getAllAxisReferenceStatus: () => Promise<{xIsRef: boolean, yIsRef: boolean, zIsRef: boolean}>
    _isAllAxisReferenced: () => Promise<boolean>
    _getCurrentAbsolutePosition: () => Promise<Point>
    _isInAbsolutePosition: (p: Point, toleranceInSteps: 3) => Promise<boolean>
}

export const MachineControler = async (
    axisControlers: {
        x: AxisControler, 
        y: AxisControler, 
        z: AxisControler
    }): Promise<MachineControler> => {

        type T = MachineControler

        const {x, y, z} = axisControlers

        // FIX: Ugly should be extracted to a function, put inside a scope
        const [minX, maxX] = await x._getAbsolutePositionRange()
        const [minY, maxY] = await y._getAbsolutePositionRange()
        const [minZ, maxZ] = await z._getAbsolutePositionRange()

        // posicao da garagem
        const GARAGE: Point = {
            kind: 'Point',
            x: x._convertAbsolutePulsesToMilimeter(maxX),
            y: y._convertAbsolutePulsesToMilimeter(minY),
            z: z._convertAbsolutePulsesToMilimeter(minZ+445),
        }

        const safePrintYZColinearAndEquallySpacedPoints: T['safePrintYZColinearAndEquallySpacedPoints'] = async (points, print) => {

            const { z,y,xs } = points
            const { 
                msg,
                passes,
                printVelocity,
                printer,
                remoteFieldId,
            } = print

            const aceleracaodeAvancoStepsPerSecSquared = 6000 // pulses per sec^2
           
            // esta funcao é importante, ela compensa a falta de ortogonalidade entre a mecanica do eixo X e Y, 
            // possivelmente será necessário uma funcao desta por gaveta
            const compensateLackOfAxisXYOrtogonality = (yPos: Milimeter, xsPos: Matriz['impressoesX']): Matriz['impressoesX'] => {
                // FIX: Make x_ and y_ bellow a global parameter which user can change if necessary
                //      this is an important parameter of the machine.
                // NOTE: Reads: for 420mm in y direction, x must be compensated 1.20mm
                const x_ = 1.20//1.24mm
                const y_ = 420//420mm
                const yPosInMM = yPos.value
                
                const deltaInMM = Milimeter((yPosInMM)*(x_/y_))
                const newXs = xsPos.map( x => Milimeter(x.value+deltaInMM.value))
                return newXs
            }

            const xs_adjusted = compensateLackOfAxisXYOrtogonality(y,xs)

            const primeiraMensagem = xs_adjusted[0]
            const ultimaMensagem = xs_adjusted[xs.length-1]
            const numeroDeMensagens = xs_adjusted.length
            // FIX: Make rampa and printlength a matriz parameter and not a constant
            const rampa = Milimeter(50)
            const printLength = Milimeter(40)

            const [minX, maxX] = x._getAbsolutePositionRange().map( x => Milimeter(x))

            // FIX: extract this, it's poluting code unnecessarily
            const X_POSINI = Milimeter( primeiraMensagem.value - rampa.value)
            const X_POSFINAL = Milimeter( ultimaMensagem.value + printLength.value + rampa.value)
            const isSafe_X_POSINI = x._isSafePosition(x._convertMilimeterToPulseIfNecessary(X_POSINI))
            const isSafe_X_POSFINAL = x._isSafePosition(x._convertMilimeterToPulseIfNecessary(X_POSFINAL))

            const X_POSINI_SAFE = isSafe_X_POSINI ? X_POSINI : minX
            const X_POSFINAL_SAFE = isSafe_X_POSFINAL ? X_POSFINAL : maxX
            
            // fix: ugly extract this convertion s
            const primeiraMensagemInPulses = x._convertMilimeterToPulseIfNecessary(primeiraMensagem) 
            const ultimaMensagemInPulses = x._convertMilimeterToPulseIfNecessary(ultimaMensagem) 
            
            //configure printings
            await x._setPrintMessages({
                numeroDeMensagensNoAvanco: numeroDeMensagens,
                posicaoDaPrimeiraMensagemNoAvanco: primeiraMensagemInPulses,
                posicaoDaUltimaMensagemNoAvanco: ultimaMensagemInPulses,
                numeroDeMensagensNoRetorno: 0,
                posicaoDaPrimeiraMensagemNoRetorno: 500,
                posicaoDaUltimaMensagemNoRetorno: 500,
            })

            // program message on printer
            //await programMessage(printer,remoteFieldId,msg)
            
            // safeMove // FIX: This may reference axis
            
            //FIX: how in the print moving Z is unsafe
            //await _assureZisSafe()

            const GoToPosFinal = () => x.goToAbsolutePosition(X_POSFINAL_SAFE, (v,a) =>[printVelocity,aceleracaodeAvancoStepsPerSecSquared] )
            const GoToPosInitial = () => safeMoveAbsoluteAndParalelXY(X_POSINI_SAFE,y)

            const DoOnePrintingPass = async (): Promise<void> => {
                //Assure it is at the initial position, if not go to it as fast as possible
                await GoToPosInitial()
                await GoToPosFinal()
            }

            // Do printing passes (this means print multiples times (passes) over the same position 
            // to make the printing bold)
            const N_minus_one_passes = Range(0,passes,1).map( pass => DoOnePrintingPass )
            await executeInSequence(N_minus_one_passes)
            await x._clearPrintingMessages() 
            
        }

        const safelyReferenceSystemIfNecessary:T['safelyReferenceSystemIfNecessary'] = async () => {
            console.log('*************** JUCA &&&&&&&&&&&&&&&&&& ********************')
            const referenceXandYIfNecessary = async () => {
                await executeInSerie([
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

        const parkSafelyIfItisPossible_DEPRECATED: T['parkSafelyIfItisPossible_DEPRECATED'] = async () => {
            const [xIsRef, yIsRef, zIsRef] = await executeInSerie([
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
                await executeInSerie([
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

        // NOTA: O eixo X e Y nao é desligado, pois o cabo das impressoras tendem a deslocar o eixo X quando desenergizado,
        //       e este deslocamento é critico e pode causar colizao com a gaveta.
        //       dado este fator o eixo X nao será desenergizado. O trade-off é poder desligar o eixo Z que nao possui reducao de corrente no repouso por ser vertical e carregar os cabecotes
        const goToGarageifItIsPossible: T['goToGarageifItIsPossible'] = async () => {
            // fix: do it paralel (extract)
        
            // Garante que Z esta no alto e seguro
            //await z.goToAbsolutePosition(minZ)
            await _assureZisSafe()
            
            // XY se direciona a garagem simultaneamente
            await executeInSerie([
                () => x.goToAbsolutePosition(GARAGE.x),
                () => y.goToAbsolutePosition(GARAGE.y),
            ])

            // Ao XY chegarem na garagem, desce o eixo Z até o suporte de garagem
            await z.goToAbsolutePosition(GARAGE.z)

            // Desliga apenas o eixo Z
            await z._forceLooseReference()
            //await y._forceLooseReference()
            //await x._forceLooseReference()
            
        } 

        const isInGarage: T['isInGarage'] = async () => {
            return await _isInAbsolutePosition(GARAGE, 3)
        }

        const safeMoveAbsoluteAndParalelXY: T['safeMoveAbsoluteAndParalelXY'] = async (x_Target,y_Target) => {

            const xInSteps = x._convertMilimeterToPulseIfNecessary(x_Target)
            const yInSteps = y._convertMilimeterToPulseIfNecessary(y_Target)
            
            //Fix: extract this function and expose to client of this class
            const isSafeX = x._isSafePosition(xInSteps)
            const isSafeY = y._isSafePosition(yInSteps)
            
            // do the movement safely and in parallel 
            if (isSafeX && isSafeY) {
                await executeInSerie([
                    () => x.goToAbsolutePosition(xInSteps),
                    () => y.goToAbsolutePosition(yInSteps),
                ])
            } else {
                throw new Error(`Cannot reach position XY(${x_Target.value}mm,${y_Target.value}mm) because it is not safe. It is out-of the range of the machine. Try to change this position`)
            }
        }

        const doOneMatriz: T['doOneMatriz'] = async job => {

            //FIX: NOT IMPLEMENTED !!

            //performMatriz()

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

            const stopXandYIfNecessary = async () => {
                // if XY is in garage, do not stop XY
                // else stop it
                if(await isInGarage()===false) {
                    await executeInSerie([
                        () => x._stop(),
                        () => y._stop(),
                    ])
                    return 
                }
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
                await stopXandYIfNecessary()
                await z.doReferenceIfNecessary()
                await z.goToAbsolutePosition(minZ)
            } 

            // Z is safe and referenced here !
            
            await executeInSerie([
                () => x.doReferenceIfNecessary(),
                () => y.doReferenceIfNecessary(),
            ]) 

            // X,Y and Z are referenced here, and Z is at his safe position

            
            return

        }

        const _getAllAxisReferenceStatus: T['_getAllAxisReferenceStatus'] = async () => {
            const [xIsRef, yIsRef, zIsRef] = await executeInSerie([
                () => x.isReferenced(),
                () => y.isReferenced(),
                () => z.isReferenced(),
            ] as const)
            return { xIsRef, yIsRef, zIsRef }
        }

        const _isAllAxisReferenced: T['_isAllAxisReferenced'] = async () => {
            const { xIsRef, yIsRef, zIsRef } = await _getAllAxisReferenceStatus()
            return  (xIsRef && yIsRef && zIsRef)
        }

        const goToMaintenanceFrontDoingAllPossible: T['goToMaintenanceFrontDoingAllPossible'] = async () => {
            await _assureZisSafe()
            await safeMoveAbsoluteAndParalelXY(Milimeter(525), Milimeter(400-75))
            await x._forceLooseReference()
            await y._forceLooseReference()
        }

        const _getCurrentAbsolutePosition: T['_getCurrentAbsolutePosition'] = async () => {
            const [xPosInSteps, yPosInSteps, zPosInSteps] = await executeInSerie([
                () => x.getCurrentAbsolutePosition(),
                () => y.getCurrentAbsolutePosition(),
                () => z.getCurrentAbsolutePosition(),
            ] as const) //as [x: number, y: number, z: number]
            const xPosInMM = x._convertAbsolutePulsesToMilimeter(xPosInSteps)
            const yPosInMM = y._convertAbsolutePulsesToMilimeter(yPosInSteps)
            const zPosInMM = z._convertAbsolutePulsesToMilimeter(zPosInSteps)
            return Point(xPosInMM,yPosInMM,zPosInMM)
        }

        // FIX: extract/refactor, do not need to be this long
        const _isInAbsolutePosition: T['_isInAbsolutePosition'] = async (referencePoint, toleranceInSteps) => {
            const currentPoint = await _getCurrentAbsolutePosition()
            //
            const xC = x._convertMilimeterToPulseIfNecessary(currentPoint.x)
            const yC = y._convertMilimeterToPulseIfNecessary(currentPoint.y)
            const zC = z._convertMilimeterToPulseIfNecessary(currentPoint.z)
            //
            const x0 = x._convertMilimeterToPulseIfNecessary(referencePoint.x)
            const xL = x0-toleranceInSteps
            const xH = x0+toleranceInSteps
            const xIsInside = isInsideRange(xC,[xL,xH])
            console.log(`xIsInside Range: `, )
            const y0 = y._convertMilimeterToPulseIfNecessary(referencePoint.y)
            const yL = y0-toleranceInSteps
            const yH = y0+toleranceInSteps
            const yIsInside = isInsideRange(yC,[yL,yH])
            const z0 = z._convertMilimeterToPulseIfNecessary(referencePoint.z)
            const zL = z0-toleranceInSteps
            const zH = z0+toleranceInSteps
            const zIsInside = isInsideRange(zC,[zL,zH])
            //
            const isPointInsideRange = xIsInside && yIsInside && zIsInside
            return isPointInsideRange

        }

        return {
            safelyReferenceSystemIfNecessary,
            safePrintYZColinearAndEquallySpacedPoints: safePrintYZColinearAndEquallySpacedPoints,
            parkSafelyIfItisPossible_DEPRECATED,
            goToGarageifItIsPossible,
            isInGarage,
            goToMaintenanceFrontDoingAllPossible,
            safeMoveAbsoluteAndParalelXY: safeMoveAbsoluteAndParalelXY,
            doOneMatriz,
            _assureZisSafe,
            _getAllAxisReferenceStatus,
            _isAllAxisReferenced,
            _getCurrentAbsolutePosition,
            _isInAbsolutePosition,
            
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