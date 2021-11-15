

export const LoopBackPortA_Path = 'LoopBackTest_PortA'
export const LoopBackPortB_Path = 'LoopBackTest_PortB'


export const LoopBackPortA_Info = {
    "locationId": "LOOP_BACK_PORT_A",
    "manufacturer": "Flavio Vilante" as const,
    "path": "COM4",                           
    "pnpId": `${LoopBackPortA_Path}`,
    "productId": undefined,
    "serialNumber": undefined,
    "vendorId": undefined,
}

export const LoopBackPortB_Info = {
    "locationId": "LOOP_BACK_PORT_A",
    "manufacturer": "Flavio Vilante" as const,
    "path": `${LoopBackPortB_Path}`,                          
    "pnpId": "",
    "productId": undefined,
    "serialNumber": undefined,
    "vendorId": undefined,
}

export const LoopBackPortsInfo = [LoopBackPortA_Info, LoopBackPortB_Info ]
