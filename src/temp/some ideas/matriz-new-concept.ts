import { Milimeter } from "../../software/axis-controler"
import { Printers } from "../../software/global-env/global"

// FIX: Implement

type UInt8 = unknown
type Velocity = unknown
type Passes = 1 | 2

type Point = {
    xPos: Milimeter
    yPos: Milimeter
    zPos: Milimeter
}

type Message = {
    printer: Printers
    textMessage: string
    remoteFieldId: number
    printVelocity: Velocity // Note: try not to use printVelocity greather than 1.700 steps/tickClock because space
    printPasses: Passes
}

type Print = {
    message: Message
    positionPoint: Point
}

//every Product represents all printings that hapens in a physical product, a product maybe single or multiple lines
type Product = {
    PartNumber: string
    printings: readonly Print[]
}

type Step = {
    step: Milimeter
    quantity: UInt8
}

// equidistant printings
type ProductMatrix = {
    product: Product
    yStep: Step
    xStep: Step
}

// Barcode can be anything. Athough we there is a de facto standard for the barcode structure, which is
// 'M#{part-number}-{messageText}', there are some variants exchanging the '-' separator for '_' or even ' ' (space)
// because of that and to ensure more flexibility we will not enforce this structure by software.
type BarCodeCall = {
    barCode: string,
    productMatrix: ProductMatrix
}

// routing

type Colinear = {
    y: Milimeter
    z: Milimeter
    xs: readonly Milimeter[]
}

type ColinearPrinting = {
    message: Message
    colinear: Colinear
}

type RoutedJob = readonly ColinearPrinting[]

type MatrixRouter = (mat: ProductMatrix) => RoutedJob


// constructors







