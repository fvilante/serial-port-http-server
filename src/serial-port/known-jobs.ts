// All known jobs

import { Milimeter } from "./driver-de-eixo"
import { Printers } from "./global"

export type Job__ = {
    // Proxy
    partNumber: string
    barCode: string
    // Message
    printer: Printers
    msg: string
    passes?: number
    remoteFieldId: number // selection of remote field -> normally 1 to 4 (inclusive-both-sides) but theoretically any number between 1 and 99
    // Message kinematics
    printVelocity: number // in pulses per 1024 milisec  // fix: Not implemented

    // Print positions
    zLevel: number // mm in relation to MinZ //Fix: Should be safe move (and give back an clear error msg if user try to access an physically impossible position)
    impressoesX: ImpressoesX
    linhasY: readonly number[]

}

export type ImpressoesX = readonly [
    readonly [x0: number, x1: number],
    readonly [x2: number, x3: number],
    readonly [x4: number, x5: number],
]


export type KnownJobsKeys = keyof KnownJobs

export type KnownJobs = {
    'T110': () => Job__
    'E44.A2': () => Job__
    'E44.A5': () => Job__
    'E44.A6': () => Job__
    'E44.B6': () => Job__
    '2559370': () => Job__
    '2559371': () => Job__
    'M1': () => Job__
    'P3': () => Job__
    'T123': () => Job__
}

export const getKnownJobs = ():KnownJobs => {

    return {
        'T110':  getT110Job,
        'E44.A2': getE44A2Job,
        'E44.A5': getE44A5Job,
        'E44.A6': getE44A6Job,
        'E44.B6': getE44B6Job,
        '2559370': getTermo2559370Job,
        '2559371': getTermo2559371Job,
        'M1': getTermoM1Job,
        'P3': getTermoM1Job,
        'T123': getT123Job,
    }
    
}

// ======================== JOB FUNCTIONS DEFINITIONS ===============================

const getTermo2559370Job = (): Job__ => {
    const firstX = 150+13.66-28.5-10.10+70-35.44-15+9.67-2.5
    const stepX = (104.96+15.24)
    const posicaoYDaLinha5EmMilimetros = 150+220-10-10+3-2-2.6+1.5-8.26-3.11-20+3.87+13.6-(7+5)
    const stepY = 60
    return {
        partNumber: '',
        barCode: '',
        printer: 'printerWhite',
        msg:  '2559370',
        remoteFieldId: 3,
        printVelocity: 2000,
        zLevel: 0,
        impressoesX: [ // em milimetros absolutos
            [firstX+(stepX*0),firstX+(stepX*1)],
            [firstX+(stepX*2),firstX+(stepX*3)],
            [0,0],
        ],
        linhasY: [ // em milimetros absolutos
            posicaoYDaLinha5EmMilimetros+(stepY*(2)),
            posicaoYDaLinha5EmMilimetros+(stepY*(1)),
            posicaoYDaLinha5EmMilimetros+(stepY*(0)),
            posicaoYDaLinha5EmMilimetros+(stepY*(-1)),
            posicaoYDaLinha5EmMilimetros+(stepY*(-2)),
            posicaoYDaLinha5EmMilimetros+(stepY*(-3)),
            posicaoYDaLinha5EmMilimetros+(stepY*(-4)),
        ]
    }
}

const getT123Job = (): Job__ => {
    const partNumber = ''
    const printer:Printers = 'printerWhite'
    const msg = 'T123'
    const remoteFieldId = 3
    const zLevel = 0 // (o quanto o cabecote desce em milimetros) in milimeter relative to MinZ
    const firstX = 150+13.66-28.5-10.10+70-35.44-15+9.67-2.5+4.3+8.68-2.72
    const stepX = 70
    const posicaoYDaLinha5EmMilimetros = 150+220-10-10+3-2-2.6+1.5-8.26-3.11-20+3.87+13.6-(7+5)+3.44+23.89-11.25
    const impressoesX:ImpressoesX = [
        [firstX+(stepX*0),firstX+(stepX*1)],
        [firstX+(stepX*2),firstX+(stepX*3)],
        [firstX+(stepX*4),firstX+(stepX*5)],
    ]
    const stepY = 70
    const linhasY = [
        posicaoYDaLinha5EmMilimetros+(stepY*(2)),
        posicaoYDaLinha5EmMilimetros+(stepY*(1)),
        posicaoYDaLinha5EmMilimetros+(stepY*(0)),
        posicaoYDaLinha5EmMilimetros+(stepY*(-1)),
        posicaoYDaLinha5EmMilimetros+(stepY*(-2)),
        posicaoYDaLinha5EmMilimetros+(stepY*(-3)),
        posicaoYDaLinha5EmMilimetros+(stepY*(-4)),
    ].reverse()
    return {
        partNumber: '',
        barCode: '',
        printer: 'printerWhite',
        msg: 'T123',
        printVelocity: 1700,
        passes: 2,
        remoteFieldId: 3,
        zLevel,
        impressoesX,
        linhasY,
    }
}

const getTermo2559371Job = (): Job__ => {
    return {
        ...getTermo2559370Job(),
        msg: '2559371',
    }
}

const getE44A2Job = (): Job__ => {
    const firstX = 150+13.66-28.5-10.10+70
    const stepX = 70
    const posicaoYDaLinha5EmMilimetros = 150+220-10-10+3-2-2.6+1.5-8.26-3.11-20+3.87
    const stepY = 70
    return {
        partNumber: '',
        barCode: '',
        printer: 'printerBlack',
        msg: 'E44.A2',
        remoteFieldId: 4,
        printVelocity: 2000,
        zLevel: 0,
        impressoesX: [
            [firstX+(stepX*0),firstX+(stepX*1)],
            [firstX+(stepX*2),firstX+(stepX*3)],
            [firstX+(stepX*4),firstX+(stepX*5)],
        ],
        linhasY: [
            posicaoYDaLinha5EmMilimetros+(stepY*(2)),
            posicaoYDaLinha5EmMilimetros+(stepY*(1)),
            posicaoYDaLinha5EmMilimetros+(stepY*(0)),
            posicaoYDaLinha5EmMilimetros+(stepY*(-1)),
            posicaoYDaLinha5EmMilimetros+(stepY*(-2)),
            posicaoYDaLinha5EmMilimetros+(stepY*(-3)),
            posicaoYDaLinha5EmMilimetros+(stepY*(-4)),
        ]
    } 
}

const getE44B6Job = (): Job__ => {

    type XYDelta = {
        x: Milimeter, // milimeter in relation to white Head
        y: Milimeter, // milimeter in relation to cmpp 0
    }

    const deltaHead: XYDelta = {
        x: Milimeter(-46.51),
        y: Milimeter(+5.90),
    }

    const deltaGaveta2: XYDelta = {
        x: Milimeter(+603.5+1.29),
        y: Milimeter(+6.34+3.98),
    }

    const deltaId: XYDelta = {
        x: Milimeter(0),
        y: Milimeter(0),
    }

    const applyDeltaToCoordinates = (xss: ImpressoesX, ys: readonly number[], delta: XYDelta): [newXs: ImpressoesX, newYs: readonly number[]] => {
        const { x: xHead, y: yHead} = delta
        const newYs = ys.map( y => y + yHead.value)
        const newXs = xss.map( xs => xs.map( x => x + xHead.value)) as unknown as ImpressoesX
        console.log('ys:', ys)
        console.log('new_ys:', newYs)
        console.log('xs', xss)
        console.log('newXs', newXs)
        return [newXs, newYs]
    }

    const E44_A2 = getE44A2Job()
    const {
        impressoesX,
        linhasY,
    } = E44_A2

    const [impressoesX_, linhasY_] = 
        applyDeltaToCoordinates(impressoesX, linhasY, deltaHead)

    const [impressoesX_adjusted, linhasY_adjusted] = 
        applyDeltaToCoordinates(impressoesX_, linhasY_, deltaId)

    return {
        ...E44_A2,
        partNumber: '',
        barCode: '',
        msg: 'E44.B6',
        passes:2,
        remoteFieldId: 3,
        printer: 'printerWhite',
        linhasY: linhasY_adjusted,
        impressoesX: impressoesX_adjusted,
    }
}

const getE44A5Job = (): Job__ => {
    return {
        ...getE44A2Job(),
        msg: 'E44.A5'
    }
}

const getE44A6Job = (): Job__ => {
    return {
        ...getE44A2Job(),
        msg: 'E44.A6'
    }
}

const getT110Job = (): Job__ => {
    const firstX = 150+13.66
    const stepX = 70
    const posicaoYDaLinha5EmMilimetros = 150+220-10-10+3-2-2.6+1.5-8.26-3.11+1.18
    const impressoesX: ImpressoesX = [
        [firstX+(stepX*0),firstX+(stepX*1)],
        [firstX+(stepX*2),firstX+(stepX*3)],
        [firstX+(stepX*4),firstX+(stepX*5)],
    ]
    const stepY = 70
    const linhasY = [ // em milimetros absolutos
        posicaoYDaLinha5EmMilimetros+(stepY*(2)),
        posicaoYDaLinha5EmMilimetros+(stepY*(1)),
        posicaoYDaLinha5EmMilimetros+(stepY*(0)),
        posicaoYDaLinha5EmMilimetros+(stepY*(-1)),
        posicaoYDaLinha5EmMilimetros+(stepY*(-2)),
        posicaoYDaLinha5EmMilimetros+(stepY*(-3)),
        posicaoYDaLinha5EmMilimetros+(stepY*(-4)),
    ]
    return {
        partNumber: '',
        printer: 'printerWhite',
        barCode: '',
        msg:  'T110',
        remoteFieldId: 3,
        impressoesX,
        linhasY,
        printVelocity: 1700,
        zLevel:0,
        passes: 2
        
    }

}

const getTermoM1Job = (): Job__ => {
    const firstX = 150+13.66-28.5-10.10+70-35.44
    const stepX = (104.96+15.24)
    const posicaoYDaLinha5EmMilimetros = 150+220-10-10+3-2-2.6+1.5-8.26-3.11-20+3.87+13.6+3.21
    const stepY = 60
    return {
        partNumber: '',
        barCode: '',
        printer: 'printerWhite',
        msg: 'M1',
        remoteFieldId: 3,
        printVelocity: 2000,
        zLevel: 0,
        impressoesX: [ // em milimetros absolutos
            [firstX+(stepX*0),firstX+(stepX*1)],
            [firstX+(stepX*2),firstX+(stepX*3)],
            [0,0],
        ],
        linhasY: [ // em milimetros absolutos
            posicaoYDaLinha5EmMilimetros+(stepY*(2)),
            posicaoYDaLinha5EmMilimetros+(stepY*(1)),
            posicaoYDaLinha5EmMilimetros+(stepY*(0)),
            posicaoYDaLinha5EmMilimetros+(stepY*(-1)),
            posicaoYDaLinha5EmMilimetros+(stepY*(-2)),
            posicaoYDaLinha5EmMilimetros+(stepY*(-3)),
            posicaoYDaLinha5EmMilimetros+(stepY*(-4)),
        ]
    }
}

