import { readFile,  } from 'fs'
import { Matriz } from "./Matriz"
import { Matriz3, matrizConverter_3_1 } from './matrizes-conhecidas-converter'
import { Barcode } from '../barcode/barcode-core'

const CurrentDirectory = process.cwd()
const FILE = 'cadastro_geral.json'
const PATH = `${CurrentDirectory}/../Matrizes-Cadastradas` // FIX: This path is dependent from were main3.ts is runned, remove this dependency.
const FILE_PATH = `${PATH}/${FILE}`

// Fix: extract to utils
const readTextFile = (file:string): Promise<Buffer> => new Promise( (resolve, reject) =>  {
    readFile(file,undefined, (err, data) => {
        if(err===null) {
            resolve(data)
        } else {
            reject(err)
        }
    })
})

// Reads 'CADASTRO_GERAL.JSON'
// NOTES: 
//      path = path to 'CADASTRO_GERAL.JSON'
//      Matriz3 = is the raw type read from path above
const readCadastroGeralMatrizes_asMatriz3 = async (path: string):Promise<readonly Matriz3[]> => {
    const buf = (await readTextFile(path)).toString()
    const r = JSON.parse(buf) as readonly Matriz3[] //Fix: validate this casting!!!
    return r
} 

//

// Reads all data from 'CADASTRO_GERAL.JSON' and cast the data to the legacy 'Matriz' type.
// fix: Should I exclude the necessity of Matriz1 (lagacy) and use only Matriz2 for the router
const readCadastroGeralMatrizes_asMatriz1 = async (): Promise<readonly Matriz[]> => {
    const cadastro3 = await readCadastroGeralMatrizes_asMatriz3(FILE_PATH)
    const cadastro1 = cadastro3.map(matrizConverter_3_1)
    return cadastro1
}

//NOTE: For convenience both barcodes (from_DB and from_Scaner) are being normalized with the Trim function
//      No other normalization are being applied
const normalizeBarcode = (barcodeFromDB_: Matriz['barCode'], barcodeFromScaner_: Barcode['data']) => {
    const barcodeFromDB = barcodeFromDB_.trim()
    const barcodeFromScaner = barcodeFromScaner_.trim()
    return {
        barcodeFromDB,
        barcodeFromScaner,
    }
}

export const fetchMatrizByBarcodeRaw = async (barcode: Barcode): Promise<readonly Matriz[]> => {
    const matrices = await readCadastroGeralMatrizes_asMatriz1()
    const matches = matrices.filter( _matrix =>{
        const barcodeFromMatrix_ = _matrix.barCode
        const barcodeFromScanner = barcode.data
        const normalized = normalizeBarcode(barcodeFromMatrix_, barcodeFromScanner)
        return normalized.barcodeFromDB === normalized.barcodeFromScaner
    })
    return matches
}



