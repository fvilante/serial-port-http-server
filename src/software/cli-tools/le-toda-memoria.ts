import { BaudRate } from '../serial/baudrate'
import { FrameCore } from "../cmpp/datalink/core/frame-core";
import { executeInSequence } from "../core/promise-utils";
import { Address } from "../global-env/global";
import { sendCmpp } from "../cmpp/datalink/send-receive-cmpp-datalink";
import { Range, groupBy, now } from '../core/utils'
import { delay } from "../core/delay";
import { bit_test } from "../core/bit-wise-utils";





type MemoryBlock = {
    readonly kind: 'MemoryBuck'
    readonly timeStampRequested: number,
    readonly wAddr: number, 
    readonly dataH: number, 
    readonly dataL: number,
    readonly timeStampReceived: number,
    readonly timeTravel: number
}


const fetchMemoryBuck = (
        portName: string, 
        baudRate: BaudRate, 
        channel: number
    ) => (
        wAddr: number
    ): 
        Promise<MemoryBlock> => 
    {
        const timeStampRequested = now()
        return new Promise( (resolve, reject) => {
            const data = 0
            const frame = FrameCore('STX','Solicitacao',channel,wAddr,data)
            sendCmpp(portName, baudRate)(frame)
                .then( res => {
                    const timeStampReceived = now()
                    const timeTravel = timeStampReceived-timeStampRequested
                    const dataL_ = res.dataLow[0]
                    const dataH_ = res.dataHigh[0]

                    const dataL = Number(bit_test(dataL_, 5))
                    const dataH = Number(bit_test(dataL_, 5))
        
                    resolve({kind: 'MemoryBuck', timeStampRequested, wAddr, dataH, dataL, timeStampReceived, timeTravel})  
        
                })
        })
}


type DeltaType = 
        | 'No-diff'
        | 'Word-diff'
        | 'ByteLow-diff'
        | 'ByteHigh-diff'


const deltaType = (a: MemoryBlock, b: MemoryBlock): DeltaType => {

    if (a.wAddr !== b.wAddr) {
        throw new Error(`Error, you are trying to compare different wAddresses, wAddr1: '${a.wAddr}' and wAddr2: '${b.wAddr}' should be equal.`)
    }

    const DHA = a.dataH
    const DHB = b.dataH
    const DLA = a.dataL
    const DLB = b.dataL

    const DHAandBisSame = DHA === DHB ? true : false
    const DLAandBisSame = DLA === DLB ? true : false

    const NoDiff = DHAandBisSame===true && DLAandBisSame===true
    const AllDiff = DHAandBisSame===false && DLAandBisSame===false
    const onlyDHisDiff = DHAandBisSame===false && DLAandBisSame===true
    const onlyDLisDiff = DHAandBisSame===true && DLAandBisSame===false

    return NoDiff
        ? 'No-diff'
        : AllDiff
            ? 'Word-diff'
            : onlyDHisDiff
                ? 'ByteHigh-diff'
                : 'ByteLow-diff'
}

type Snapshot = {
    kind: 'Snapshot'
    data: readonly MemoryBlock[]
}



const getSnapshot = async (range: readonly number[]): Promise<Snapshot> => {
    //const waddrs = Range(0,0xff+1,1)
    const ZAxis = 'YAxis'
    const {portName, baudRate, channel} = Address['Axis'][ZAxis] 

    const arr = range.map( wAddr => {  
        return () => fetchMemoryBuck(portName, baudRate, channel)(wAddr) 
    })
    const data = await executeInSequence(arr)
    return {
        kind: 'Snapshot',
        data,
    }
}

type DeltaSnapshot = Map<'IsEqual' | 'HasDiff', readonly {
    wAddr: number;
    diff: DeltaType;
    a: MemoryBlock;
    b: MemoryBlock;
}[]>

const deltaSnapshot = (s1: Snapshot, s2: Snapshot):DeltaSnapshot  => {
    const d1 = s1.data
    const d2 = s2.data

    const r = d1.map( (m1, index) => {
        const wAddr = m1.wAddr
        const m2 = d2[index]
        const diff = deltaType(m1,m2)
        return {
            diff,
            wAddr,
            a: m1,
            b: m2,
        }
    })

    const res = groupBy(r, x => x.diff === 'No-diff' ? 'IsEqual' : 'HasDiff')
    return res

}

const getVeryStable = async (s0: Snapshot, s1: Snapshot, s2: Snapshot):Promise<readonly number[]> => {
    const d0 = deltaSnapshot(s0,s1)
    const d1 = deltaSnapshot(s1,s2)
    const d2 = deltaSnapshot(s0,s2)
    
    const e0 = d0.get('IsEqual')?.map( x => x.wAddr) as readonly number[]
    const e1 = d1.get('IsEqual')?.map( x => x.wAddr) as readonly number[]
    const e2 = d2.get('IsEqual')?.map( x => x.wAddr) as readonly number[]

    const veryStable = e0.map( w => {
        if (e1.includes(w) && e2.includes(w))
            return  w
        else 
            return undefined
    }).filter( x => x!==undefined) as number[]

    return veryStable

}

// collection of chuncks



const Test1 = async () => {

    const allRange = Range(0,0xFF+1,1)

    const analyse = async (s0: Snapshot, s1: Snapshot, s2: Snapshot) => {

        const d0 = deltaSnapshot(s0,s1)
        const d1 = deltaSnapshot(s1,s2)
        const d2 = deltaSnapshot(s0,s2)
        
        const e0 = d0.get('IsEqual')?.map( x => x.wAddr) as number[]
        const e1 = d1.get('IsEqual')?.map( x => x.wAddr) as number[]
        const e2 = d2.get('IsEqual')?.map( x => x.wAddr) as number[]

        const veryStable = e0.map( w => {
            if (e1.includes(w) && e2.includes(w))
                return  w
            else 
                return undefined
        }).filter( x => x!==undefined) as number[]

        console.log('estes sao os endereços bastante estaveis', veryStable)
        console.log('Lendo apenas os bastante estaveis')
        const x0 = await getSnapshot(veryStable)
        console.log('Voce tem 15 segundos pra ativar o FC-')
        await delay(15000)
        console.log('Pronto, lendo endereços estaveis novamente')
        const x1 = await getSnapshot(veryStable)

        const res = deltaSnapshot(x0,x1).get('HasDiff')?.map( x => x.wAddr)
        console.log('Estes sao os endereços provaveis para o FC-')
        console.log(res)
       

 
        //const d3 = deltaSnapshot(s0,x0)
        //const deltas = [d0, d1, d2, d3]

        //const res = groupBy(deltas, d => d.get())


    }

   

    console.log('Lendo toda memoria 3 vezes:')
    console.log('1')
    const s0 = await getSnapshot(allRange)
    console.log('2')
    const s1 = await getSnapshot(allRange)
    console.log('3')
    const s2 = await getSnapshot(allRange)
    console.log('pronto')

    const v1 = await getVeryStable(s0,s1,s2)

    console.log('Obtido os mais estaveis')
    console.log('Repetindo a leitura 3 vezes, apenas dos mais estaveis')

    console.log('1')
    const t0 = await getSnapshot(v1)
    console.log('2')
    const t1 = await getSnapshot(v1)
    console.log('3')
    const t2 = await getSnapshot(v1)
    console.log('pronto')

    const vv1 = await getVeryStable(t0,t1,t2)

    console.log('Obtido os mais estaveis')
    console.log('Repetindo a leitura 3 vezes, apenas dos mais estaveis')

    console.log('1')
    const tt0 = await getSnapshot(vv1)
    console.log('2')
    const tt1 = await getSnapshot(vv1)
    console.log('3')
    const tt2 = await getSnapshot(vv1)
    console.log('pronto')


    await analyse(tt0, tt1, tt2)

}


const Test2 = async () => {
    // be selective

    const getCandidates = () => {
        /*// bit2
        const selection = [
            [ 60, 131, 132, 135, 157 ],
            [ 37, 131, 132, 135, 153, 156, 158 ],
            [ 37, 60, 129, 132 ],
            [ 134, 159, 163, 166 ],
            [ 135, 150, 152, 162, 165, 167 ],
            [ 157, 160, 162, 165 ],
            [ 131, 134, 153, 156, 159 ],
            [ 60, 130, 152, 154, 167 ],
        ]*/

        // bit5
        const selection = [
            [ 107, 152, 161 ],
            
        ]
    
        const m = new Map<number,void>()
    
        selection.forEach( ws => { 
            ws.forEach( w => m.set(w, undefined) )
        })
    
        const candidates = Array.from(m.keys())
        return candidates
    }

    const sampling = (range: readonly number[], times: number) => {
        const arr = Range(0,times,1).map( () => () => getSnapshot(range))
        const sample = executeInSequence(arr)
        return sample
    }

    const candidates = getCandidates()
    const sampleSize = 10

    const sample = await sampling(candidates,sampleSize)
    
    const report = groupBy(sample, v => v.data.map( m => m.wAddr))
    console.table(report)
    console.log(report)
   





}

Test2();


