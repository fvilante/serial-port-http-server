import { readFile,  } from 'fs'
import { Matriz } from './matrizes-conhecidas'
import { Matriz3, matrizConverter_3_2,matrizConverter_3_1 } from './matrizes-conhecidas-converter'
import { BarCode } from './parse-barcode'

const CurrentDirectory = process.cwd()
const FILE = 'cadastro_geral.json'
const PATH = `${CurrentDirectory}/Matrizes-Cadastradas`
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

export const fetchMatrizByBarcodeRaw = async (barCodeRaw: BarCode['raw']): Promise<readonly Matriz[]> => {
    const matrices = await readCadastroGeralMatrizes_asMatriz1()
    const matches = matrices.filter( _matrix => _matrix.barCode === barCodeRaw.trim())
    return matches
}



