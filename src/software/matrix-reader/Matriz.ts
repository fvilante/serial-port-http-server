import { Milimeter } from "../axis-controler";
import { Printers } from "../global-env/global";


export type Matriz = {
    // Proxy
    partNumber: string;
    barCode: string;
    // Message
    printer: Printers;
    msg: string;
    passes?: number;
    remoteFieldId: number; // selection of remote field -> normally 1 to 4 (inclusive-both-sides) but theoretically any number between 1 and 99

    // Message kinematics
    printVelocity: number; // in pulses per 1024 milisec  // fix: Not implemented


    // Print positions
    zLevel: Milimeter; // mm in relation to MinZ //Fix: Should be safe move (and give back an clear error msg if user try to access an physically impossible position)
    impressoesX: readonly Milimeter[]; // in relation to machine 0 -> FIX: Should be safe to use 0, not is the case, because it will collide carrier at FC- direction
    linhasY: readonly Milimeter[]; // in relation to machine 0 -> FIX: Should be safe to use 0, not is the case, because it will collide carrier at FC- direction 

};
