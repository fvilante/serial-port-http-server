import { ZIO } from "../zio/zio"

type ZRefWorld<RA,RB,A,B,EA,EB> =  { 
    read: ZIO<RA,A,EA>
    write: ZIO<RB,B,EB>
}

type UpdateAndGetError = `UpdateAndGetError`  //fix: should add more detailed

export type ZRef<RA,RB,A,B,EA,EB> = {
    kind: 'ZRef'
    //unsafe
    unsafeRun: () => ZRefWorld<RA,RB,A,B,EA,EB>
    //updateAndGet: (f: (current: A) => B) => ZIO<any,B,UpdateAndGetError>
}

export type Ref<A> = ZRef<any,any,A,A,void,void>



export const ZRef = <RA,RB,A,B,EA,EB>(world: () => ZRefWorld<RA,RB,A,B,EA,EB>): ZRef<RA,RB,A,B,EA,EB> => {

    type T = ZRef<RA,RB,A,B,EA,EB>

    let writeWaitBuffer: readonly A[] = []

    const unsafeRun: T['unsafeRun'] = world
   
  
    return {
        kind: 'ZRef',
        unsafeRun,
    }
}

// static part

export type ZRef_ = {
    //fromLet: <A>(initialValue: A) => Ref<A>
}

type T = ZRef_



export const ZRef_ : ZRef_ = {
    //fromLet,
}