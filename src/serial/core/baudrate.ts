
export const PossibleBaudRates = [
    115200,
    57600,
    38400,
    19200,
    9600,
    4800,
    2400,
    1800,
    1200,
    600,
    300,
    200,
    150,
    134,
    110,
    75,
    50, 
] as const

export type BaudRate = typeof PossibleBaudRates[number]