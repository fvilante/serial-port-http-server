
import { getMatrizesConhecidas, ImpressoesX, Matriz, MatrizesConhecidas, MatrizesConhecidasKeys} from './matrizes-conhecidas'

// print known jobs


const jobsList = getMatrizesConhecidas()

const formatJobNumbers = (job: Matriz, toFixedDigits: number = 2): Matriz => {
    const {
        linhasY,
        impressoesX,
    } = job

    const newLinhasY = linhasY.map( n => Number(n.toFixed(toFixedDigits)))
    const newImpressoesX = impressoesX.map( p => p.map( n => n.toFixed(toFixedDigits))) as unknown as ImpressoesX

    return {
        ...job,
        linhasY: newLinhasY,
        impressoesX: newImpressoesX,
    }
}


const jobs = Object.keys(jobsList).map( key => jobsList[(key as MatrizesConhecidasKeys)]())
    .map( job => formatJobNumbers(job))

const jobsJSON = JSON.stringify(jobs)

console.log(jobsJSON)