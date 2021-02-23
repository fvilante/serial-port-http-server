
import { getKnownJobs, ImpressoesX, Job__, KnownJobs, KnownJobsKeys} from './known-jobs'

// print known jobs


const jobsList = getKnownJobs()

const formatJobNumbers = (job: Job__, toFixedDigits: number = 2): Job__ => {
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


const jobs = Object.keys(jobsList).map( key => jobsList[(key as KnownJobsKeys)]())
    .map( job => formatJobNumbers(job))

const jobsJSON = JSON.stringify(jobs)

console.log(jobsJSON)