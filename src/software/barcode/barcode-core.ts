
export type BarCode = {
    readonly raw: string
    readonly partNumber: string
    readonly messageText: string
    //TODO: include a field named (is barcode structured identified=boolean)
}