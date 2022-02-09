import { CmppControler } from "../cmpp-controler"
import { Kinematics, Moviment, Moviment_, PositionInPulses } from "../core"
import { setNext } from "./go-next"


export const goMany = async (cmppControler: CmppControler, many: Iterable<Moviment_>) => {
    const iter = many[Symbol.iterator]()
    let next = iter.next()
    while(!next.done) {
        //TODO: Should detect if motor has stoped or aborted their mission, loose reference, etc.
        //      If yes should make possible to return sequence from where it became interrupted
        await setNext(cmppControler, next.value)
        await cmppControler.start()
        await cmppControler.waitToStop()
        next = iter.next()
    }

}

export const goManyFast = async (cmppControler: CmppControler, many: Iterable<Moviment_>) => {
    const iter = many[Symbol.iterator]()
    let next = iter.next()
    while(!next.done) {
        //TODO: Should detect if motor has stoped or aborted their mission, loose reference, etc.
        //      If yes should make possible to return sequence from where it became interrupted
        await setNext(cmppControler, next.value)
        await cmppControler.start()
        // early configure next
        const early = iter.next()
        await setNext(cmppControler,early.value)
        //TODO: For very near positions the second start may be lost. Test and verify roboustness in this particular use case
        await cmppControler.start() // early accumulate next start
        //TODO: THE PROBLEM IS THAT WHEN AUTOMATIC START IS GIVEN MOTOR DO NOT SIGNAL THE STOP.
        //      I SHOULD DEVELOP AN ALGORITM TO DETECT THIS END OF MOVIMENT USING OTHER FLAGS OF STATUSL
        await cmppControler.waitToStop() // first moviment
    }

}
