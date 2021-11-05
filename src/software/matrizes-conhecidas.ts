// All known matrizs

import { Milimeter } from "./axis-position"
import { Printers } from "./global-env/global"

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

const applyDeltaToCoordinates = (xs: Matriz['impressoesX'], ys: Matriz['linhasY'], delta: XYDelta): [newXs: Matriz['impressoesX'], newYs: Matriz['linhasY']] => {
    const { x: xHead, y: yHead} = delta
    const newYs: typeof ys = ys.map( y => Milimeter(y.value + yHead.value))
    const newXs: typeof xs = xs.map( x => Milimeter(x.value + xHead.value))
    //console.log('ys:', ys)
    //console.log('new_ys:', newYs)
    //console.log('xs', xs)
    //console.log('newXs', newXs)
    return [newXs, newYs]
}

export type Matriz = {
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


export type MatrizesConhecidasKeys = keyof MatrizesConhecidas

export type MatrizesConhecidas = {
    'T110': () => Matriz
    'T199': () => Matriz
    'T125': () => Matriz
    'E44.A1': () => Matriz
    'E44.A2': () => Matriz
    'E44.A3': () => Matriz
    'E44.A5': () => Matriz
    'E44.A7': () => Matriz
    'E44.A6': () => Matriz
    'E44.B1': () => Matriz
    'E44.B2': () => Matriz
    'E44.B5': () => Matriz
    'E44.B6': () => Matriz
    '2559370': () => Matriz
    '2559371': () => Matriz
    'M1': () => Matriz
    'P3': () => Matriz
    'P3.A': () => Matriz
    'T123': () => Matriz
    'V2': () => Matriz
    'V17': () => Matriz
    'T202': () => Matriz
    'V120': () => Matriz
    'V107': () => Matriz

    // iveco
    'ST18': () => Matriz
    '25400': () => Matriz
    '25401': () => Matriz
    '25002 B': () => Matriz
    '25002 A': () => Matriz
    '25402': () => Matriz
    '25402 A': () => Matriz
    '25402 B': () => Matriz
    '25603': () => Matriz
    '25810': () => Matriz
    '25006 A': () => Matriz
    '25006 B': () => Matriz
    '25705': () => Matriz
    '25894': () => Matriz
    '61140': () => Matriz
    'ST11': () => Matriz
    'ST12': () => Matriz
    'ST22': () => Matriz
    'ST6': () => Matriz
    'ST13': () => Matriz
    'ST14': () => Matriz
    'ST93': () => Matriz
    'ST19': () => Matriz

    // termo
    //'2327504': () => Matriz
    //'T5': () => Matriz // faz par com a de cima
}

export const getMatrizesConhecidas = ():MatrizesConhecidas => {    
    return {
        'T110':  getT110,
        'T199': getT199,
        'T125': getT125,
        'E44.A1': getE44A1,
        'E44.A2': getE44A2,
        'E44.A3': getE44A3,
        'E44.A5': getE44A5,
        'E44.A6': getE44A6,
        'E44.A7': getE44A7,
        'E44.B1': getE44B1,
        'E44.B2': getE44B2,
        'E44.B5': getE44B5,
        'E44.B6': getE44B6,
        '2559370': getTermo2559370,
        '2559371': getTermo2559371,
        'M1': getTermoM1,
        'P3': getP3,
        'P3.A': getP3A,
        'T123': getT123,
        'V2': getV2,
        'V17': getV17,
        'T202': getT202,
        'V120': getV120,
        'V107': getV107,

        // iveco
        'ST18': getST18,
        '25400': get25400,
        '25401': get25401,
        '25002 B': get25002B,
        '25002 A': get25002A,
        '25402': get25402,
        '25402 A': get25402A,
        '25402 B': get25402B,
        '25603': get25603,
        '25810': get25810,
        "25006 A": get25006A,
        "25006 B": get25006B,
        '25705': get25705,
        '25894': get25894,
        '61140': get61140,
        'ST11': getST11,
        'ST12': getST12,
        'ST22': getST22,
        'ST6': getST6,
        'ST13': getST13,
        'ST14': getST14,
        'ST93': getST93,
        'ST19': getST19,
        
        // termo feita em outra maquina
        //'2327504': get2327504,
        //'T5': getT5,
    }
    
}


// ======================== JOB FUNCTIONS DEFINITIONS ===============================

const getV107 = ():Matriz => {
    const firstX = 150+13.66-8.15-4.5
    const stepX = 70
    const posicaoYDaLinha5EmMilimetros = 150+220-10-10+3-2-2.6+1.5-8.26-3.11+1.18+2
    const stepY = 70
    const impressoesX: Matriz['impressoesX'] = [
        Milimeter(firstX+(stepX*0)),Milimeter(firstX+(stepX*1)),
        Milimeter(firstX+(stepX*2)),Milimeter(firstX+(stepX*3)),
        Milimeter(firstX+(stepX*4)),Milimeter(firstX+(stepX*5)),
    ]
    const linhasY: Matriz['linhasY'] = [
        Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(-4))),
        Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(-3))),
        Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(-2))),
        Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(-1))),
        Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(0))),
        Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(1))),
        Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(2))),
    ]

    const partNumber = 'P00146384'
    const msg = 'V107'
    const barCode = `M#${partNumber}-${msg}`
    return {
        partNumber,
        printer: 'printerWhite',
        barCode,
        msg,
        remoteFieldId: 3,
        impressoesX,
        linhasY,
        printVelocity: 1700,
        zLevel: Milimeter(0),
        passes: 2
        
    }
}

const getST93 = ():Matriz => {
    const firstX = 155-9.5-6+4.8+2.5+2.5-20+(70)
    const stepX = 70
    const posicaoYDaLinha5EmMilimetros = 336+2-1+10
    const stepY = 70
    const partNumber = '418720501'
    const msg = 'ST93'
    const barCode = `M#${partNumber}-${msg}`
    return {
        partNumber,
        barCode,
        printer: 'printerBlack',
        msg,
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


const getST6 = ():Matriz => {
    const firstX = 155-9.5-6+4.8+2.5+2.5
    const stepX = 70
    const posicaoYDaLinha5EmMilimetros = 336+2-1+10
    const stepY = 70
    const partNumber = '418900110'
    const msg = 'ST6'
    const barCode = `M#${partNumber}-${msg}`
    return {
        partNumber,
        barCode,
        printer: 'printerWhite',
        msg,
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

const getST19 = (): Matriz => {
    const firstX = 155-9.5-6+4.8+2.5+46.51+6.13
    const stepX = 70
    const posicaoYDaLinha5EmMilimetros = 336+2-1-5.9+2
    const stepY = 70
    const partNumber = '418720407'
    const msg = 'ST19'
    const barCode = `M#${partNumber}-${msg}`
    return {
        partNumber,
        barCode,
        printer: 'printerBlack',
        msg,
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


const getST11 = ():Matriz => {
    const firstX = 155-9.5-6+4.8+2.5  
    const stepX = 70
    const posicaoYDaLinha5EmMilimetros = 336+2-1    
    const stepY = 70
    const partNumber = '418930907'
    const msg = 'ST11'
    const barCode = `M#${partNumber}-${msg}`
    return {
        partNumber,
        barCode,
        printer: 'printerWhite',
        msg,
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

const getST14 = ():Matriz => {

	//igual ao st11 porem tinta preta
    const firstX = 155-9.5-6+4.8+2.5 -18.05 +70
    const stepX = 70
    const posicaoYDaLinha5EmMilimetros = 336+2-1-5 
    const stepY = 70
    const partNumber = '418720608'
    const msg = 'ST14'
    const barCode = `M#${partNumber}-${msg}`
    return {
        partNumber,
        barCode,
        printer: 'printerWhite',
        msg,
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


const getST22 = ():Matriz => {
    const firstX = 155-9.5-6+4.8+2.5  
    const stepX = 70
    const posicaoYDaLinha5EmMilimetros = 336+2-1    
    const stepY = 70
    const partNumber = '418720607'
    const msg = 'ST22'
    const barCode = `M#${partNumber}-${msg}`
    return {
        partNumber,
        barCode,
        printer: 'printerWhite',
        msg,
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

const getST12 = ():Matriz => {

	//igual ao st11 porem tinta preta
    const firstX = 155-9.5-6+4.8+2.5 -18.05+70
    const stepX = 70
    const posicaoYDaLinha5EmMilimetros = 336+2-1-5 
    const stepY = 70
    const partNumber = '418948706'
    const msg = 'ST12'
    const barCode = `M#${partNumber}-${msg}`
    return {
        partNumber,
        barCode,
        printer: 'printerWhite',
        msg,
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

const get25400 = (): Matriz => {
    const partNumber = 'P00171172'
    const msg = '25400'
    const barCode = `M#${partNumber}-${msg}`
    return {
        ...get25002B(),
        msg, partNumber, barCode,
    }
}

const get25401 = (): Matriz => {
    const partNumber = 'P00171172'
    const msg = '25401'
    const barCode = `M#${partNumber}-${msg}`
    return {
        ...get25002B(),
        msg, partNumber, barCode,
    }
}

const get25402A = (): Matriz => {
    const partNumber = 'P00171172'
    const msg = '25402 A'
    const barCode = `M#${partNumber}-${msg}`
    return {
        ...get25002B(),
        msg, partNumber, barCode,
    }
}

const get25603 = ():Matriz => {
    const firstX = 155-9.5-6+4.8-1+2
    const stepX = 70
    const posicaoYDaLinha5EmMilimetros = 336+2-1-1
    const stepY = 70
    const partNumber = 'P00171172'
    const msg = '25603'
    const barCode = `M#${partNumber}-${msg}`
    return {
        partNumber,
        barCode,
        printer: 'printerWhite',
        msg,
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

const get25402B = (): Matriz => {
    const partNumber = 'P00171172'
    const msg = '25402 B'
    const barCode = `M#${partNumber}-${msg}`
    return {
        ...get25002B(),
        msg, partNumber, barCode,
    }
}

const get25006A = (): Matriz => {
    const partNumber = 'P00171172'
    const msg = '25006 A'
    const barCode = `M#${partNumber}-${msg}`
    return {
        ...get25002B(),
        msg, partNumber, barCode,
    }
}

// formato do conector: "Robozinho"
const get61140 = ():Matriz => {
    const firstX = 155-9.5-6+4.8-1+2
    const stepX = 70
    const posicaoYDaLinha5EmMilimetros = 336+2-1-1
    const stepY = 70
    const partNumber = 'P00171172'
    const msg = '61140'
    const barCode = `M#${partNumber}-${msg}`
    return {
        partNumber,
        barCode,
        printer: 'printerWhite',
        msg,
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




const getST13 = (): Matriz => {
    const firstX = 155-9.5-6+4.8-17.22+70
    const stepX = 70
    const posicaoYDaLinha5EmMilimetros = 336+2-1+11-13-2
    const stepY = 70
    const partNumber = '418720301'
    const msg = 'ST13'
    const barCode = `M#${partNumber}-${msg}`
    return {
        partNumber,
        barCode,
        printer: 'printerBlack',
        msg,
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

const get25810 = (): Matriz => {
    const firstX = 155-9.5-6+4.8
    const stepX = 70
    const posicaoYDaLinha5EmMilimetros = 336+2-1+11
    const stepY = 70
    const partNumber = '418718110'
    const msg = '25810'
    const barCode = `M#${partNumber}-${msg}`
    return {
        partNumber,
        barCode,
        printer: 'printerWhite',
        msg,
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


const get25006B = (): Matriz => {
    const partNumber = 'P00171172'
    const msg = '25006 B'
    const barCode = `M#${partNumber}-${msg}`
    return {
        ...get25002B(),
        msg, partNumber, barCode,
    }
}

const get25002A = ():Matriz => {
    const firstX = 155-9.5-6+4.8
    const stepX = 70
    const posicaoYDaLinha5EmMilimetros = 336+2-1
    const stepY = 70
    const partNumber = 'P00171172'
    const msg = '25002 A'
    const barCode = `M#${partNumber}-${msg}`
    return {
        partNumber,
        barCode,
        printer: 'printerWhite',
        msg,
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


const get25402 = ():Matriz => {
    const firstX = 155-9.5-6+4.8
    const stepX = 70
    const posicaoYDaLinha5EmMilimetros = 336+2-1+13
    const stepY = 70
    const partNumber = '418718110'
    const msg = '25402'
    const barCode = `M#${partNumber}-${msg}`
    return {
        partNumber,
        barCode,
        printer: 'printerWhite',
        msg,
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


const get25705 = ():Matriz => {
    const firstX = 155-9.5-6+4.8
    const stepX = 70
    const posicaoYDaLinha5EmMilimetros = 336+2-1+13
    const stepY = 70
    const partNumber = '418718110'
    const msg = '25705'
    const barCode = `M#${partNumber}-${msg}`
    return {
        partNumber,
        barCode,
        printer: 'printerWhite',
        msg,
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


const get25894 = ():Matriz => {
    const firstX = 155-9.5-6+4.8
    const stepX = 70
    const posicaoYDaLinha5EmMilimetros = 336+2-1+13
    const stepY = 70
    const partNumber = '418718110'
    const msg = '25894'
    const barCode = `M#${partNumber}-${msg}`
    return {
        partNumber,
        barCode,
        printer: 'printerWhite',
        msg,
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

// formato do conector: "Robozinho"
const get25002B = ():Matriz => {
    const firstX = 155-9.5-6+4.8-1
    const stepX = 70
    const posicaoYDaLinha5EmMilimetros = 336+2-1-1
    const stepY = 70
    const partNumber = 'P00171172'
    const msg = '25002 B'
    const barCode = `M#${partNumber}-${msg}`
    return {
        partNumber,
        barCode,
        printer: 'printerWhite',
        msg,
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

const getST18 = ():Matriz => {
    const firstX = 150+13.66-28.5-10.10+70+23.3+(-70*1)
    const stepX = 70
    const posicaoYDaLinha5EmMilimetros = 150+220-10-10+3-2-2.6+1.5-8.26-3.11-20+3.87+10+10+5-3
    const stepY = 70
    const partNumber = '418720304'
    const msg = 'ST18'
    const barCode = `M#${partNumber}-${msg}`
    return {
        partNumber,
        barCode,
        printer: 'printerWhite',
        msg,
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


const getV120 = (): Matriz => {
    const firstX = 150+13.66-8.15-5-3+1.5-2.5
    const stepX = 70
    const posicaoYDaLinha5EmMilimetros = 150+220-10-10+3-2-2.6+1.5-8.26-3.11+1.18+17-5
    const stepY = 70
    const impressoesX: Matriz['impressoesX'] = [
        Milimeter(firstX+(stepX*0)),Milimeter(firstX+(stepX*1)),
        Milimeter(firstX+(stepX*2)),Milimeter(firstX+(stepX*3)),
        Milimeter(firstX+(stepX*4)),Milimeter(firstX+(stepX*5)),
    ]
    const linhasY: Matriz['linhasY'] = [
        Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(-4))),
        Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(-3))),
        Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(-2))),
        Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(-1))),
        Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(0))),
        Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(1))),
        Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(2))),
    ]
    const partNumber = '418041170'
    const msg = 'V120'
    const barCode = `M#${partNumber}-${msg}`
    return {
        partNumber,
        printer: 'printerWhite',
        barCode,
        msg,
        remoteFieldId: 2,
        impressoesX,
        linhasY,
        printVelocity: 1700,
        zLevel: Milimeter(0),
        passes: 2
        
    } 
}

const getP3A = ():Matriz => {
    const firstX = 150+13.66-8.15-5-15-0.5
    const stepX = 70
    const posicaoYDaLinha5EmMilimetros = 150+220-10-10+3-2-2.6+1.5-8.26-3.11+1.18+17+12.16+1+21.10-3-60
    const stepY = 60
    const impressoesX: Matriz['impressoesX'] = [
        Milimeter(firstX+(stepX*0)),Milimeter(firstX+(stepX*1)),
        Milimeter(firstX+(stepX*2)),Milimeter(firstX+(stepX*3)),
        Milimeter(firstX+(stepX*4)),Milimeter(firstX+(stepX*5)),
    ]
    const linhasY: Matriz['linhasY'] = [
        Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(-4))),
        Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(-3))),
        Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(-2))),
        Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(-1))),
        Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(0))),
        Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(1))),
        Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(2))),
    ]
    const partNumber = '418914690'
    const msg = 'P3.A'
    const barCode = `M#${partNumber}-${msg}`
    return {
        partNumber,
        printer: 'printerWhite',
        barCode,
        msg,
        remoteFieldId: 2,
        impressoesX,
        linhasY,
        printVelocity: 1700,
        zLevel: Milimeter(0),
        passes: 2
        
    }
}

const getT202 = (): Matriz => {
    const firstX = 150+13.66-8.15-5
    const stepX = 70
    const posicaoYDaLinha5EmMilimetros = 150+220-10-10+3-2-2.6+1.5-8.26-3.11+1.18+17
    const stepY = 70
    const impressoesX: Matriz['impressoesX'] = [
        Milimeter(firstX+(stepX*0)),Milimeter(firstX+(stepX*1)),
        Milimeter(firstX+(stepX*2)),Milimeter(firstX+(stepX*3)),
        Milimeter(firstX+(stepX*4)),Milimeter(firstX+(stepX*5)),
    ]
    const linhasY: Matriz['linhasY'] = [
        Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(-4))),
        Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(-3))),
        Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(-2))),
        Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(-1))),
        Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(0))),
        Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(1))),
        Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(2))),
    ]
    const partNumber = '418630400'
    const msg = 'T202'
    const barCode = `M#${partNumber}-${msg}`
    return {
        partNumber,
        printer: 'printerWhite',
        barCode,
        msg,
        remoteFieldId: 2,
        impressoesX,
        linhasY,
        printVelocity: 1700,
        zLevel: Milimeter(0),
        passes: 2
        
    }
}

const getE44B1 = ():Matriz => {
    const partNumber = 'P00146913'
    const msg = 'E44.B1'
    const barCode = `M#${partNumber}-${msg}`
    return { 
        ...getE44B6(), 
        msg, partNumber, barCode, 
    }
}

const getE44B2 = ():Matriz => {
    const partNumber = 'P00146394'
    const msg = 'E44.B2'
    const barCode = `M#${partNumber}-${msg}`
    return { 
        ...getE44B6(), 
        msg, partNumber, barCode,
    }
}

const getE44B5 = ():Matriz => {
    const partNumber = 'P00124697'
    const msg = 'E44.B5'
    const barCode = `M#${partNumber}-${msg}`
    return { 
        ...getE44B6(), 
        msg, partNumber, barCode,
    }
}



const getP3 = (): Matriz => {
    const deltaX = 3-3.5-10.82
    const deltaY = -30+4+8+15-4
    const firstX = 150+13.66+3 + deltaX
    const stepX = 70
    const posicaoYDaLinha5EmMilimetros = 150+220-10-10+3-2-2.6+1.5-8.26-3.11+1.18 + deltaY
    const stepY = 60
    const impressoesX: Matriz['impressoesX'] = [
        Milimeter(firstX+(stepX*0)),Milimeter(firstX+(stepX*1)),
        Milimeter(firstX+(stepX*2)),Milimeter(firstX+(stepX*3)),
        Milimeter(firstX+(stepX*4)),Milimeter(firstX+(stepX*5)),
    ]
    const linhasY: Matriz['linhasY'] = [
        Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(-4))),
        Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(-3))),
        Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(-2))),
        Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(-1))),
        Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(0))),
        Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(1))),
        Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(2))),
    ]
    const partNumber = '491022010'
    const msg = 'P3'
    const barCode = `M#${partNumber}-${msg}`
    return {
        partNumber,
        printer: 'printerWhite',
        barCode,
        msg,
        remoteFieldId: 3,
        impressoesX,
        linhasY,
        printVelocity: 1700,
        zLevel: Milimeter(0),
        passes: 2
    }
}

const getT125 = (): Matriz => {
    const partNumber = 'P00105452'
    const msg = 'T125'
    const barCode = `M#${partNumber}-${msg}`
    return {
        ...getT199(),
        msg, partNumber, barCode,
    }
}

const getT199 = (): Matriz => {
    const firstX = 150+13.66-8.15
    const stepX = 70
    const posicaoYDaLinha5EmMilimetros = 150+220-10-10+3-2-2.6+1.5-8.26-3.11+1.18
    const stepY = 70
    const impressoesX: Matriz['impressoesX'] = [
        Milimeter(firstX+(stepX*0)),Milimeter(firstX+(stepX*1)),
        Milimeter(firstX+(stepX*2)),Milimeter(firstX+(stepX*3)),
        Milimeter(firstX+(stepX*4)),Milimeter(firstX+(stepX*5)),
    ]
    const linhasY: Matriz['linhasY'] = [
        Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(-4))),
        Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(-3))),
        Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(-2))),
        Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(-1))),
        Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(0))),
        Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(1))),
        Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(2))),
    ]
    const partNumber = 'P00105452'
    const msg = 'T199'
    const barCode = `M#${partNumber}-${msg}`
    return {
        partNumber,
        printer: 'printerWhite',
        barCode,
        msg,
        remoteFieldId: 3,
        impressoesX,
        linhasY,
        printVelocity: 1700,
        zLevel: Milimeter(0),
        passes: 2
        
    }
}

const getE44A1 = (): Matriz => {
    const partNumber = 'P00147559'
    const msg = 'E44.A1'
    const barCode = `M#${partNumber}-${msg}`
    return {
        ...getE44A2(),
        msg, partNumber, barCode,
    }
}

const getE44A3 = (): Matriz => {
    const partNumber = 'P00146390'
    const msg = 'E44.A3'
    const barCode = `M#${partNumber}-${msg}`
    return {
        ...getE44A2(),
        msg, partNumber, barCode,
    }
}

const getE44A7 = ():Matriz => {
    const partNumber = 'P00146396'
    const msg = 'E44.A7'
    const barCode = `M#${partNumber}-${msg}`
    return {
        ...getE44A2(),
        msg, partNumber, barCode,
    }
}   

const getV2 = (): Matriz => {
    //const ref = 'T110'
    const deltaX = 3-3.5
    const deltaY = -1
    const firstX = 150+13.66+3 + deltaX
    const stepX = 70
    const posicaoYDaLinha5EmMilimetros = 150+220-10-10+3-2-2.6+1.5-8.26-3.11+1.18 + deltaY
    const stepY = 70
    const impressoesX: Matriz['impressoesX'] = [
        Milimeter(firstX+(stepX*0)),Milimeter(firstX+(stepX*1)),
        Milimeter(firstX+(stepX*2)),Milimeter(firstX+(stepX*3)),
        Milimeter(firstX+(stepX*4)),Milimeter(firstX+(stepX*5)),
    ]
    const linhasY: Matriz['linhasY'] = [
        Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(-4))),
        Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(-3))),
        Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(-2))),
        Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(-1))),
        Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(0))),
        Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(1))),
        Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(2))),
    ]
    const partNumber = 'P00106422'
    const msg = 'V2'
    const barCode = `M#${partNumber}-${msg}`
    return {
        partNumber,
        printer: 'printerWhite',
        barCode,
        msg,
        remoteFieldId: 3,
        impressoesX,
        linhasY,
        printVelocity: 1700,
        zLevel: Milimeter(0),
        passes: 2
        
    }
}


const getTermo2559370 = (): Matriz => {
    const firstX = 150+13.66-28.5-10.10+70-35.44-15+9.67-2.5
    const stepX = (104.96+15.24)
    const posicaoYDaLinha5EmMilimetros = 150+220-10-10+3-2-2.6+1.5-8.26-3.11-20+3.87+13.6-(7+5)
    const stepY = 60
    const partNumber = '491022010'
    const msg = '2559370'
    const barCode = `M#${partNumber}-${msg}`
    return {
        partNumber,
        barCode,
        printer: 'printerWhite',
        msg,
        remoteFieldId: 3,
        printVelocity: 1700,
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

const getT123 = (): Matriz => {
    const zLevel = Milimeter(0) // (o quanto o cabecote desce em milimetros) in milimeter relative to MinZ
    const firstX = 150+13.66-28.5-10.10+70-35.44-15+9.67-2.5+4.3+8.68-2.72
    const stepX = 70
    const posicaoYDaLinha5EmMilimetros = 150+220-10-10+3-2-2.6+1.5-8.26-3.11-20+3.87+13.6-(7+5)+3.44+23.89-11.25
    const stepY = 70
    const impressoesX: Matriz['impressoesX'] = [
        Milimeter(firstX+(stepX*0)),Milimeter(firstX+(stepX*1)),
        Milimeter(firstX+(stepX*2)),Milimeter(firstX+(stepX*3)),
        Milimeter(firstX+(stepX*4)),Milimeter(firstX+(stepX*5)),
    ]
    const linhasY: Matriz['linhasY'] = [
        Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(-4))),
        Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(-3))),
        Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(-2))),
        Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(-1))),
        Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(0))),
        Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(1))),
        Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(2))),
    ]
    const partNumber = 'P00205916'
    const msg = 'T123'
    const barCode = `M#${partNumber}-${msg}`
    return {
        partNumber,
        barCode,
        printer: 'printerWhite',
        msg,
        printVelocity: 1700,
        passes: 2,
        remoteFieldId: 3,
        zLevel,
        impressoesX,
        linhasY,
    }
}

const getTermo2559371 = (): Matriz => {
    const partNumber = '491022010'
    const msg = '2559371'
    const barCode = `M#${partNumber}-${msg}`
    return {
        ...getTermo2559370(),
        msg, partNumber, barCode,
    }
}

const getE44A2 = (): Matriz => {
    const firstX = 150+13.66-28.5-10.10+70
    const stepX = 70
    const posicaoYDaLinha5EmMilimetros = 150+220-10-10+3-2-2.6+1.5-8.26-3.11-20+3.87
    const stepY = 70
    const partNumber = 'P00147560'
    const msg = 'E44.A2'
    const barCode = `M#${partNumber}-${msg}`
    return {
        partNumber,
        barCode,
        printer: 'printerBlack',
        msg,
        remoteFieldId: 4,
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

// ISTO AQUI FOI UM DESVIO POIS UMA MAQUINA DELES QUEBROU E ELES QUISERAM TENTAR IMPRIMIR NA MAQUINA POSIJET
// DAI DEU CERTO, POREM ESTOU EXCLUINDO APENAS PORQUE FOI UMA QUESTAO PROVISORIA (O PRODUTO ERA UMA TERMO-RETRATIL ONDE DEVERIA HAVER UMA IMPRESSAO)
/*const get2327504 = (): Matriz => {
    const firstX = 150+13.66-28.5-10.10+70-50-6.5
    const stepX = 70
    const posicaoYDaLinha5EmMilimetros = 150+220-10-10+3-2-2.6+1.5-8.26-3.11-20+3.87+34.40-6
    const stepY = 70
    const partNumber = // mensagem e partnuber nao localizado na tabela, ver com carlos (é o mesmo o T5 abaixo?)
    const msg = '2327504'
    const barCode = `M#${partNumber}-${msg}`
    return {
        partNumber,
        barCode,
        printer: 'printerWhite',
        msg,
        remoteFieldId: 3,
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

const getT5 = ():Matriz => {
    const ref = get2327504()
    const { impressoesX } = ref
    const newImpressoesX = impressoesX.map( x => Milimeter(x.value + 25))
    const partNumber = // mensagem e partnuber nao localizado na tabela, ver com carlos (é o mesmo da Matriz acima)
    const msg = 'T5'
    const barCode = `M#${partNumber}-${msg}`
    return {
        ... ref,
        msg, partNumber, barCode,
        impressoesX: newImpressoesX,
    }
}
*/
const getE44B6 = (): Matriz => {

    const E44_A2 = getE44A2()
    const {
        impressoesX,
        linhasY,
    } = E44_A2

    const [impressoesX_, linhasY_] = 
        applyDeltaToCoordinates(impressoesX, linhasY, deltaHead)

    const [impressoesX_adjusted, linhasY_adjusted] = 
        applyDeltaToCoordinates(impressoesX_, linhasY_, deltaId)

    const test = [linhasY_adjusted[0], linhasY_adjusted[6]]

    const partNumber = 'P00124718'
    const msg = 'E44.B6'
    const barCode = `M#${partNumber}-${msg}`

    return {
        ...E44_A2,
        partNumber,
        barCode,
        msg,
        passes:2,
        remoteFieldId: 3,
        printer: 'printerWhite',
        linhasY: linhasY_adjusted,
        impressoesX: impressoesX_adjusted,
    }
}

const getE44A5 = (): Matriz => {
    const partNumber = 'P00146389'
    const msg = 'E44.A5'
    const barCode = `M#${partNumber}-${msg}`
    return {
        ...getE44A2(),
        msg, partNumber, barCode
    }
}

const getE44A6 = (): Matriz => {
    const partNumber = 'P00146388'
    const msg = 'E44.A6'
    const barCode = `M#${partNumber}-${msg}`
    return {
        ...getE44A2(),
        msg, partNumber, barCode
    }
}

const getV17 = (): Matriz => {
    const firstX = 94+64.40-35.29
    const stepX = 94
    
    const posicaoYDaLinha5EmMilimetros = 150+220-10-10+3-2-2.6+1.5-8.26-3.11+1.18+21.88+1.25+1.5
    const stepY = 72
    const impressoesX: Matriz['impressoesX'] = [
        Milimeter(firstX+(stepX*0)),Milimeter(firstX+(stepX*1)),
        Milimeter(firstX+(stepX*2)),Milimeter(firstX+(stepX*3)),
        Milimeter(firstX+(stepX*4)), //Milimeter(firstX+(stepX*5)),
    ]
    const linhasY: Matriz['linhasY'] = [
        Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(-4))),
        Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(-3))),
        Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(-2))),
        Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(-1))),
        Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(0))),
        Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(1))),
        //Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(2))),
    ]
    const partNumber = '418889500'
    const msg = 'V17'
    const barCode = `M#${partNumber}-${msg}`
    return {
        partNumber,
        printer: 'printerWhite',
        barCode,
        msg,
        remoteFieldId: 3,
        impressoesX,
        linhasY,
        printVelocity: 1700,
        zLevel: Milimeter(0),
        passes: 2
        
    }

}

const getT110 = (): Matriz => {
    const firstX = 150+13.66-4
    const stepX = 70
    const posicaoYDaLinha5EmMilimetros = 150+220-10-10+3-2-2.6+1.5-8.26-3.11+1.18
    const stepY = 70
    const impressoesX: Matriz['impressoesX'] = [
        Milimeter(firstX+(stepX*0)),Milimeter(firstX+(stepX*1)),
        Milimeter(firstX+(stepX*2)),Milimeter(firstX+(stepX*3)),
        Milimeter(firstX+(stepX*4)),Milimeter(firstX+(stepX*5)),
    ]
    const linhasY: Matriz['linhasY'] = [
        Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(-4))),
        Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(-3))),
        Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(-2))),
        Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(-1))),
        Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(0))),
        Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(1))),
        Milimeter(posicaoYDaLinha5EmMilimetros+(stepY*(2))),
    ]
    const partNumber = 'P00146385'
    const msg = 'T110'
    const barCode = `M#${partNumber}-${msg}`
    return {
        partNumber,
        printer: 'printerWhite',
        barCode,
        msg,
        remoteFieldId: 3,
        impressoesX,
        linhasY,
        printVelocity: 1700,
        zLevel: Milimeter(0),
        passes: 2
        
    }

}

const getTermoM1 = (): Matriz => {
    const firstX = 150+13.66-28.5-10.10+70-35.44
    const stepX = (104.96+15.24)
    const posicaoYDaLinha5EmMilimetros = 150+220-10-10+3-2-2.6+1.5-8.26-3.11-20+3.87+13.6+3.21
    const stepY = 60
    const partNumber = '491022010'
    const msg = 'M1'
    const barCode = `M#${partNumber}-${msg}`
    return {
        partNumber,
        barCode,
        printer: 'printerWhite',
        msg,
        remoteFieldId: 3,
        printVelocity: 1700,
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

