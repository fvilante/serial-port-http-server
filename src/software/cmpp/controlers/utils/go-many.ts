import { AxisControler } from "../axis-controler"
import { Moviment } from "../core"
import { setNext } from "./go-next"


export const goMany = async (axisControler: AxisControler, many: Iterable<Moviment>) => {
    const iter = many[Symbol.iterator]()
    let next = iter.next()
    while(!next.done) {
        //TODO: Should detect if motor has stoped or aborted their mission, loose reference, etc.
        //      If yes should make possible to return sequence from where it became interrupted
        await setNext(axisControler, next.value)
        await axisControler.start()
        await axisControler.waitToStop()
        next = iter.next()
    }

}

export const goManyFast = async (axisControler: AxisControler, many: Iterable<Moviment>) => {
    const iter = many[Symbol.iterator]()
    let next = iter.next()
    while(!next.done) {
        //TODO: Should detect if motor has stoped or aborted their mission, loose reference, etc.
        //      If yes should make possible to return sequence from where it became interrupted
        await setNext(axisControler, next.value)
        await axisControler.start()
        // early configure next
        const early = iter.next()
        await setNext(axisControler,early.value)
        //TODO: For very near positions the second start may be lost. Test and verify roboustness in this particular use case
        await axisControler.start() // early accumulate next start
        //TODO: THE PROBLEM IS THAT WHEN AUTOMATIC START IS GIVEN MOTOR DO NOT SIGNAL THE STOP.
        //      I SHOULD DEVELOP AN ALGORITM TO DETECT THIS END OF MOVIMENT USING OTHER FLAGS OF STATUSL
        await axisControler.waitToStop() // first moviment
    }

}