
// units of measurement

// 10 milimeter = [[1,+1],[1,0]]

type Dimension = {
    uom: string
    scalar: number
    expoent: number
}

type NotUsedDimension = {
    uom: string
    scalar: 1
    expoent: 1
}

type PhysicalMeasure = {
    displacement: Dimension
    time: Dimension
    mass: Dimension
}

//

interface Milimeter extends PhysicalMeasure {
    displacement: {
        uom: 'Milimeter'
        scalar: number
        expoent: 1
    }
    time: NotUsedDimension
    mass: NotUsedDimension
}

interface Inch extends PhysicalMeasure {
    displacement: {
        uom: 'Inch'
        scalar: number
        expoent: 1
    }
    time: NotUsedDimension
    mass: NotUsedDimension
}

type Displacement = Milimeter | Inch

//

interface Second extends PhysicalMeasure {
    displacement: NotUsedDimension
    time: {
        uom: 'Second'
        scalar: number
        expoent: 1
    }
    mass: NotUsedDimension
}

interface TickOfClock extends PhysicalMeasure {
    displacement: NotUsedDimension
    time: {
        uom: 'TickOfClock'
        scalar: number
        expoent: 1
    }
    mass: NotUsedDimension
}

type Time_ = Second | TickOfClock

//

interface MilimeterPerSecond extends PhysicalMeasure {
    displacement: {
        uom: 'Milimeter'
        scalar: number
        expoent: 1
    }
    time: {
        uom: 'Second'
        scalar: number
        expoent: -1
    }
    mass: NotUsedDimension
}

interface MilimeterPerTick extends PhysicalMeasure {
    displacement: {
        uom: 'Milimeter'
        scalar: number
        expoent: 1
    }
    time: {
        uom: 'TickOfClock'
        scalar: number
        expoent: -1
    }
    mass: NotUsedDimension
}

type Velocity = MilimeterPerSecond | MilimeterPerTick

declare const b: Velocity
b.time.uom


/*
const a = Milimeter(10)
const a = Displacement(10, 'milimeter')
const v = MilimeterPerSecond(20)
const v = Velocity(10, 'milimeter', 'second')
const v = Velocity(10, 'pulses', 'tickOfClock')


const f = (displacement: Pulses) => void
const f = (velocity: PulsesPerTick) => void
const f = (displacement: Pulses | Milimeter)
const f = (displacement: Displacement) => void

const d: Pulses = Pulses(10)
const v: PulsesPerTick = PulsesPerTick(10)
const5 d: Pulses | Milimter = Milimeter(10)
const d: Displacement = Inch(10)
const v: Velocity = PulsesPerSecond(10)
const v: Velocity = Velocity(10, 'pulses', 'second')


*/