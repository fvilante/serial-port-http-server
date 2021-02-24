// All known jobs

import { Milimeter } from "./axis-position"
import { Printers } from "./global"


// ================= temp / draft ==================


namespace Draft {
    type Position1D = {
        kind: 'Position'
        relativeTo: 'AbsoluteZeroMachineAt2021FEV16' | 'MinimumSafePoint'
        value: Milimeter
    }

    type Position3D = {
        kind: 'Position3D'
        x: Position1D
        y: Position1D
        z: Position1D
    }

    type Message = {
        printer: Printers
        remoteFieldId: number
        text: string
        textLength: Milimeter // the length of the printed text
        passes: number
    }


    type PrintLine = {
        zLevel: number // mm in relation to MinZ //Fix: Should be safe move (and give back an clear error msg if user try to access an physically impossible position)
        xPos: readonly number[] //mm in relation of cmpp 0
        yPos: number //mm in relation of cmpp 0
        message: Message
    }

}


// ================== end temp draft =================


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
    y: Milimeter(+6.34+3.98+1.23),
}

const deltaId: XYDelta = {
    x: Milimeter(0),
    y: Milimeter(0),
}

const applyDeltaToCoordinates = (xs: Job__['impressoesX'], ys: Job__['linhasY'], delta: XYDelta): [newXs: Job__['impressoesX'], newYs: Job__['linhasY']] => {
    const { x: xHead, y: yHead} = delta
    const newYs: typeof ys = ys.map( y => Milimeter(y.value + yHead.value))
    const newXs: typeof xs = xs.map( x => Milimeter(x.value + xHead.value))
    console.log('ys:', ys)
    console.log('new_ys:', newYs)
    console.log('xs', xs)
    console.log('newXs', newXs)
    return [newXs, newYs]
}

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
    zLevel: Milimeter // mm in relation to MinZ //Fix: Should be safe move (and give back an clear error msg if user try to access an physically impossible position)
    impressoesX: readonly Milimeter[] // in relation to machine 0 -> FIX: Should be safe to use 0, not is the case, because it will collide carrier at FC- direction
    linhasY: readonly Milimeter[] // in relation to machine 0 -> FIX: Should be safe to use 0, not is the case, because it will collide carrier at FC- direction 

}
/*
export type ImpressoesX = readonly [
    readonly [x0: number, x1: number],
    readonly [x2: number, x3: number],
    readonly [x4: number, x5: number],
]
*/




export type KnownJobsKeys = keyof KnownJobs

export type KnownJobs = {
    'T110': () => Job__
    'T199': () => Job__
    'T125': () => Job__
    'E44.A1': () => Job__
    'E44.A2': () => Job__
    'E44.A3': () => Job__
    'E44.A5': () => Job__
    'E44.A7': () => Job__
    'E44.A6': () => Job__
    'E44.B1': () => Job__
    'E44.B2': () => Job__
    'E44.B6': () => Job__
    '2559370': () => Job__
    '2559371': () => Job__
    'M1': () => Job__
    'P3': () => Job__
    'T123': () => Job__
    'V2': () => Job__
    'T202': () => Job__
    'V120': () => Job__
    'V107': () => Job__

    // iveco
    'ST18': () => Job__
    '25401': () => Job__
    '25002 B': () => Job__
    '25402 B': () => Job__
    '25006 A': () => Job__
    '25006 B': () => Job__
    'ST22': () => Job__
    'ST6': () => Job__
    'ST93': () => Job__
    'ST19': () => Job__
}

export const getKnownJobs = ():KnownJobs => {    
    return {
        'T110':  getT110Job,
        'T199': getT199Job,
        'T125': getT125Job,
        'E44.A1': getE44A1Job,
        'E44.A2': getE44A2Job,
        'E44.A3': getE44A3Job,
        'E44.A5': getE44A5Job,
        'E44.A6': getE44A6Job,
        'E44.A7': getE44A7Job,
        'E44.B1': getE44B1job,
        'E44.B2': getE44B2job,
        'E44.B6': getE44B6Job,
        '2559370': getTermo2559370Job,
        '2559371': getTermo2559371Job,
        'M1': getTermoM1Job,
        'P3': getP3job,
        'T123': getT123Job,
        'V2': getV2Job,
        'T202': getT202Job,
        'V120': getV120Job,
        'V107': getV107Job,

        // iveco
        'ST18': getST18job,
        '25401': get25401Job,
        '25002 B': get25002Bjob,
        '25402 B': get25402Bjob,
        "25006 A": get25006Ajob,
        "25006 B": get25006Bjob,
        'ST22': getST22Job,
        'ST6': getST6Job,
        'ST93': getST93Job,
        'ST19': getST19Job,
    }
    
}

// utils
// unsafe because it can cause circular reference
// FIX: Huge source of potential bugs if not very carrefully useds
const UNSAFECopyJobButChangeMessage = (jobToCopyKey: KnownJobsKeys, newMessage: string): Job__ => {
    const jobToCopy = getKnownJobs()[jobToCopyKey]()
    return {
        ...jobToCopy,
        msg: newMessage,
    }
}

// ======================== JOB FUNCTIONS DEFINITIONS ===============================

const getV107Job = ():Job__ => {
    const firstX = 150+13.66-8.15-4.5
    const stepX = 70
    const posicaoYDaLinha5EmMilimetros = 150+220-10-10+3-2-2.6+1.5-8.26-3.11+1.18+2
    const stepY = 70
    const impressoesX: Job__['impressoesX'] = [
        Milimeter(firstX+(stepX*0)),Milimeter(firstX+(stepX*1)),
        Milimeter(firstX+(stepX*2)),Milimeter(firstX+(stepX*3)),
        Milimeter(firstX+(stepX*4)),Milimeter(firstX+(stepX*5)),
    ]
    const linhasY: Job__['linhasY'] = [
        Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(-4))),
        Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(-3))),
        Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(-2))),
        Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(-1))),
        Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(0))),
        Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(1))),
        Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(2))),
    ]
    return {
        partNumber: '',
        printer: 'printerWhite',
        barCode: '',
        msg:  'V107',
        remoteFieldId: 3,
        impressoesX,
        linhasY,
        printVelocity: 1700,
        zLevel: Milimeter(0),
        passes: 2
        
    }
}

const getST93Job = ():Job__ => {
    const firstX = 155-9.5-6+4.8+2.5+2.5-20+(70)
    const stepX = 70
    const posicaoYDaLinha5EmMilimetros = 336+2-1+10
    const stepY = 70
    return {
        partNumber: '',
        barCode: '',
        printer: 'printerBlack',
        msg: 'ST93',
        remoteFieldId: 2,
        printVelocity: 1700,
        zLevel: Milimeter(0),
        impressoesX: [
            Milimeter(firstX+(stepX*0)),Milimeter(firstX+(stepX*1)),
            Milimeter(firstX+(stepX*2)),Milimeter(firstX+(stepX*3)),
            Milimeter(firstX+(stepX*4)),Milimeter(firstX+(stepX*5)),
        ],
        linhasY: [
            Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(-4))),
            Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(-3))),
            Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(-2))),
            Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(-1))),
            Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(0))),
            Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(1))),
            Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(2))),
        ]
    } 
}


const getST6Job = ():Job__ => {
    const firstX = 155-9.5-6+4.8+2.5+2.5
    const stepX = 70
    const posicaoYDaLinha5EmMilimetros = 336+2-1+10
    const stepY = 70
    return {
        partNumber: '',
        barCode: '',
        printer: 'printerWhite',
        msg: 'ST6',
        remoteFieldId: 2,
        printVelocity: 1700,
        zLevel: Milimeter(0),
        impressoesX: [
            Milimeter(firstX+(stepX*0)),Milimeter(firstX+(stepX*1)),
            Milimeter(firstX+(stepX*2)),Milimeter(firstX+(stepX*3)),
            Milimeter(firstX+(stepX*4)),Milimeter(firstX+(stepX*5)),
        ],
        linhasY: [
            Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(-4))),
            Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(-3))),
            Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(-2))),
            Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(-1))),
            Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(0))),
            Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(1))),
            Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(2))),
        ]
    } 
}

const getST19Job = (): Job__ => {
    const firstX = 155-9.5-6+4.8+2.5+46.51+6.13
    const stepX = 70
    const posicaoYDaLinha5EmMilimetros = 336+2-1-5.9+2
    const stepY = 70
    return {
        partNumber: '',
        barCode: '',
        printer: 'printerBlack',
        msg: 'ST19',
        remoteFieldId: 2,
        printVelocity: 1700,
        zLevel: Milimeter(0),
        impressoesX: [
            Milimeter(firstX+(stepX*0)),Milimeter(firstX+(stepX*1)),
            Milimeter(firstX+(stepX*2)),Milimeter(firstX+(stepX*3)),
            Milimeter(firstX+(stepX*4)),Milimeter(firstX+(stepX*5)),
        ],
        linhasY: [
            Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(-4))),
            Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(-3))),
            Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(-2))),
            Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(-1))),
            Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(0))),
            Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(1))),
            Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(2))),
        ]
    } 
}

const getST22Job = ():Job__ => {
    const firstX = 155-9.5-6+4.8+2.5  
    const stepX = 70
    const posicaoYDaLinha5EmMilimetros = 336+2-1    
    const stepY = 70
    return {
        partNumber: '',
        barCode: '',
        printer: 'printerWhite',
        msg: 'ST22',
        remoteFieldId: 2,
        printVelocity: 1700,
        zLevel: Milimeter(0),
        impressoesX: [
            Milimeter(firstX+(stepX*0)),Milimeter(firstX+(stepX*1)),
            Milimeter(firstX+(stepX*2)),Milimeter(firstX+(stepX*3)),
            Milimeter(firstX+(stepX*4)),Milimeter(firstX+(stepX*5)),
        ],
        linhasY: [
            Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(-4))),
            Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(-3))),
            Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(-2))),
            Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(-1))),
            Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(0))),
            Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(1))),
            Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(2))),
        ]
    } 
}

const get25401Job = (): Job__ => {
    return {
        ...get25002Bjob(),
        msg: '25401'
    }
}

const get25402Bjob = (): Job__ => {
    return {
        ...get25002Bjob(),
        msg: '25402 B'
    }
}

const get25006Ajob = (): Job__ => {
    return {
        ...get25002Bjob(),
        msg: '25006 A'
    }
}

const get25006Bjob = (): Job__ => {
    return {
        ...get25002Bjob(),
        msg: '25006 B'
    }
}



const get25002Bjob = ():Job__ => {
    const firstX = 155-9.5-6+4.8
    const stepX = 70
    const posicaoYDaLinha5EmMilimetros = 336+2-1
    const stepY = 70
    return {
        partNumber: '',
        barCode: '',
        printer: 'printerWhite',
        msg: '25002 B',
        remoteFieldId: 2,
        printVelocity: 1700,
        zLevel: Milimeter(0),
        impressoesX: [
            Milimeter(firstX+(stepX*0)),Milimeter(firstX+(stepX*1)),
            Milimeter(firstX+(stepX*2)),Milimeter(firstX+(stepX*3)),
            Milimeter(firstX+(stepX*4)),Milimeter(firstX+(stepX*5)),
        ],
        linhasY: [
            Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(-4))),
            Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(-3))),
            Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(-2))),
            Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(-1))),
            Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(0))),
            Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(1))),
            Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(2))),
        ]
    } 
}

const getST18job = ():Job__ => {
    const firstX = 150+13.66-28.5-10.10+70+23.3+(-70*1)
    const stepX = 70
    const posicaoYDaLinha5EmMilimetros = 150+220-10-10+3-2-2.6+1.5-8.26-3.11-20+3.87+10+10+5-3
    const stepY = 70
    return {
        partNumber: '',
        barCode: '',
        printer: 'printerWhite',
        msg: 'ST18',
        remoteFieldId: 2,
        printVelocity: 1700,
        zLevel: Milimeter(0),
        impressoesX: [
            Milimeter(firstX+(stepX*0)),Milimeter(firstX+(stepX*1)),
            Milimeter(firstX+(stepX*2)),Milimeter(firstX+(stepX*3)),
            Milimeter(firstX+(stepX*4)),Milimeter(firstX+(stepX*5)),
        ],
        linhasY: [
            Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(-4))),
            Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(-3))),
            Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(-2))),
            Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(-1))),
            Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(0))),
            Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(1))),
            Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(2))),
        ]
    } 
}


const getV120Job = (): Job__ => {
    const firstX = 150+13.66-8.15-5-3+1.5-2.5
    const stepX = 70
    const posicaoYDaLinha5EmMilimetros = 150+220-10-10+3-2-2.6+1.5-8.26-3.11+1.18+17-5
    const stepY = 70
    const impressoesX: Job__['impressoesX'] = [
        Milimeter(firstX+(stepX*0)),Milimeter(firstX+(stepX*1)),
        Milimeter(firstX+(stepX*2)),Milimeter(firstX+(stepX*3)),
        Milimeter(firstX+(stepX*4)),Milimeter(firstX+(stepX*5)),
    ]
    const linhasY: Job__['linhasY'] = [
        Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(-4))),
        Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(-3))),
        Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(-2))),
        Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(-1))),
        Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(0))),
        Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(1))),
        Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(2))),
    ]
    return {
        partNumber: '',
        printer: 'printerWhite',
        barCode: '',
        msg:  'V120',
        remoteFieldId: 2,
        impressoesX,
        linhasY,
        printVelocity: 1700,
        zLevel: Milimeter(0),
        passes: 2
        
    } 
}

const getT202Job = (): Job__ => {
    const firstX = 150+13.66-8.15-5
    const stepX = 70
    const posicaoYDaLinha5EmMilimetros = 150+220-10-10+3-2-2.6+1.5-8.26-3.11+1.18+17
    const stepY = 70
    const impressoesX: Job__['impressoesX'] = [
        Milimeter(firstX+(stepX*0)),Milimeter(firstX+(stepX*1)),
        Milimeter(firstX+(stepX*2)),Milimeter(firstX+(stepX*3)),
        Milimeter(firstX+(stepX*4)),Milimeter(firstX+(stepX*5)),
    ]
    const linhasY: Job__['linhasY'] = [
        Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(-4))),
        Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(-3))),
        Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(-2))),
        Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(-1))),
        Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(0))),
        Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(1))),
        Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(2))),
    ]
    return {
        partNumber: '',
        printer: 'printerWhite',
        barCode: '',
        msg:  'T202',
        remoteFieldId: 2,
        impressoesX,
        linhasY,
        printVelocity: 1700,
        zLevel: Milimeter(0),
        passes: 2
        
    }
}

const getE44B1job = ():Job__ => ({ 
    ...getE44B6Job(), 
    msg: 'E44.B1', 
})

const getE44B2job = ():Job__ => ({ 
    ...getE44B6Job(), 
    msg: 'E44.B2', 
})


const getP3job = (): Job__ => {
    const deltaX = 3-3.5-10.82
    const deltaY = -30+4+8+15-4
    const firstX = 150+13.66+3 + deltaX
    const stepX = 70
    const posicaoYDaLinha5EmMilimetros = 150+220-10-10+3-2-2.6+1.5-8.26-3.11+1.18 + deltaY
    const stepY = 60
    const impressoesX: Job__['impressoesX'] = [
        Milimeter(firstX+(stepX*0)),Milimeter(firstX+(stepX*1)),
        Milimeter(firstX+(stepX*2)),Milimeter(firstX+(stepX*3)),
        Milimeter(firstX+(stepX*4)),Milimeter(firstX+(stepX*5)),
    ]
    const linhasY: Job__['linhasY'] = [
        Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(-4))),
        Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(-3))),
        Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(-2))),
        Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(-1))),
        Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(0))),
        Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(1))),
        Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(2))),
    ]
    return {
        partNumber: '',
        printer: 'printerWhite',
        barCode: '',
        msg:  'P3',
        remoteFieldId: 3,
        impressoesX,
        linhasY,
        printVelocity: 1700,
        zLevel: Milimeter(0),
        passes: 2
    }
}

const getT125Job = (): Job__ => {
    return {
        ... getT199Job(),
        msg: 'T125',
    }
}

const getT199Job = (): Job__ => {
    const firstX = 150+13.66-8.15
    const stepX = 70
    const posicaoYDaLinha5EmMilimetros = 150+220-10-10+3-2-2.6+1.5-8.26-3.11+1.18
    const stepY = 70
    const impressoesX: Job__['impressoesX'] = [
        Milimeter(firstX+(stepX*0)),Milimeter(firstX+(stepX*1)),
        Milimeter(firstX+(stepX*2)),Milimeter(firstX+(stepX*3)),
        Milimeter(firstX+(stepX*4)),Milimeter(firstX+(stepX*5)),
    ]
    const linhasY: Job__['linhasY'] = [
        Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(-4))),
        Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(-3))),
        Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(-2))),
        Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(-1))),
        Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(0))),
        Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(1))),
        Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(2))),
    ]
    return {
        partNumber: '',
        printer: 'printerWhite',
        barCode: '',
        msg:  'T199',
        remoteFieldId: 3,
        impressoesX,
        linhasY,
        printVelocity: 1700,
        zLevel: Milimeter(0),
        passes: 2
        
    }
}

const getE44A1Job = (): Job__ => {
    return {
        ...getE44A2Job(),
        msg: 'E44.A1',
    }
}

const getE44A3Job = (): Job__ => {
    return {
        ...getE44A2Job(),
        msg: 'E44.A3',
    }
}

const getE44A7Job = ():Job__ => {
    return {
        ...getE44A2Job(),
        msg: 'E44.A7',
    }
}

const getV2Job = (): Job__ => {
    //const ref = 'T110'
    const deltaX = 3-3.5
    const deltaY = +1.5
    const firstX = 150+13.66+3 + deltaX
    const stepX = 70
    const posicaoYDaLinha5EmMilimetros = 150+220-10-10+3-2-2.6+1.5-8.26-3.11+1.18 + deltaY
    const stepY = 70
    const impressoesX: Job__['impressoesX'] = [
        Milimeter(firstX+(stepX*0)),Milimeter(firstX+(stepX*1)),
        Milimeter(firstX+(stepX*2)),Milimeter(firstX+(stepX*3)),
        Milimeter(firstX+(stepX*4)),Milimeter(firstX+(stepX*5)),
    ]
    const linhasY: Job__['linhasY'] = [
        Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(-4))),
        Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(-3))),
        Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(-2))),
        Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(-1))),
        Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(0))),
        Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(1))),
        Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(2))),
    ]
    return {
        partNumber: '',
        printer: 'printerWhite',
        barCode: '',
        msg:  'V2',
        remoteFieldId: 3,
        impressoesX,
        linhasY,
        printVelocity: 1700,
        zLevel: Milimeter(0),
        passes: 2
        
    }
}


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
        zLevel: Milimeter(0),
        impressoesX: [
            Milimeter(firstX+(stepX*0)),Milimeter(firstX+(stepX*1)),
            Milimeter(firstX+(stepX*2)),Milimeter(firstX+(stepX*3)),
            //Milimeter(firstX+(stepX*4)),Milimeter(firstX+(stepX*5)),
        ],
        linhasY: [
            Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(-4))),
            Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(-3))),
            Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(-2))),
            Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(-1))),
            Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(0))),
            Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(1))),
            Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(2))),
        ]
    }
}

const getT123Job = (): Job__ => {
    const partNumber = ''
    const printer:Printers = 'printerWhite'
    const msg = 'T123'
    const remoteFieldId = 3
    const zLevel = Milimeter(0) // (o quanto o cabecote desce em milimetros) in milimeter relative to MinZ
    const firstX = 150+13.66-28.5-10.10+70-35.44-15+9.67-2.5+4.3+8.68-2.72
    const stepX = 70
    const posicaoYDaLinha5EmMilimetros = 150+220-10-10+3-2-2.6+1.5-8.26-3.11-20+3.87+13.6-(7+5)+3.44+23.89-11.25
    const stepY = 70
    const impressoesX: Job__['impressoesX'] = [
        Milimeter(firstX+(stepX*0)),Milimeter(firstX+(stepX*1)),
        Milimeter(firstX+(stepX*2)),Milimeter(firstX+(stepX*3)),
        Milimeter(firstX+(stepX*4)),Milimeter(firstX+(stepX*5)),
    ]
    const linhasY: Job__['linhasY'] = [
        Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(-4))),
        Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(-3))),
        Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(-2))),
        Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(-1))),
        Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(0))),
        Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(1))),
        Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(2))),
    ]
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
        zLevel: Milimeter(0),
        impressoesX: [
            Milimeter(firstX+(stepX*0)),Milimeter(firstX+(stepX*1)),
            Milimeter(firstX+(stepX*2)),Milimeter(firstX+(stepX*3)),
            Milimeter(firstX+(stepX*4)),Milimeter(firstX+(stepX*5)),
        ],
        linhasY: [
            Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(-4))),
            Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(-3))),
            Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(-2))),
            Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(-1))),
            Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(0))),
            Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(1))),
            Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(2))),
        ]
    } 
}

const getE44B6Job = (): Job__ => {

    const E44_A2 = getE44A2Job()
    const {
        impressoesX,
        linhasY,
    } = E44_A2

    const [impressoesX_, linhasY_] = 
        applyDeltaToCoordinates(impressoesX, linhasY, deltaHead)

    const [impressoesX_adjusted, linhasY_adjusted] = 
        applyDeltaToCoordinates(impressoesX_, linhasY_, deltaId)

    const test = [linhasY_adjusted[0], linhasY_adjusted[6]]

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
    const firstX = 150+13.66-4
    const stepX = 70
    const posicaoYDaLinha5EmMilimetros = 150+220-10-10+3-2-2.6+1.5-8.26-3.11+1.18
    const stepY = 70
    const impressoesX: Job__['impressoesX'] = [
        Milimeter(firstX+(stepX*0)),Milimeter(firstX+(stepX*1)),
        Milimeter(firstX+(stepX*2)),Milimeter(firstX+(stepX*3)),
        Milimeter(firstX+(stepX*4)),Milimeter(firstX+(stepX*5)),
    ]
    const linhasY: Job__['linhasY'] = [
        Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(-4))),
        Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(-3))),
        Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(-2))),
        Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(-1))),
        Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(0))),
        Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(1))),
        Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(2))),
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
        zLevel: Milimeter(0),
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
        zLevel: Milimeter(0),
        impressoesX: [
            Milimeter(firstX+(stepX*0)),Milimeter(firstX+(stepX*1)),
            Milimeter(firstX+(stepX*2)),Milimeter(firstX+(stepX*3)),
            //Milimeter(firstX+(stepX*4)),Milimeter(firstX+(stepX*5)),
        ],
        linhasY: [
            Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(-4))),
            Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(-3))),
            Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(-2))),
            Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(-1))),
            Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(0))),
            Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(1))),
            Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(2))),
        ]
    }
}

