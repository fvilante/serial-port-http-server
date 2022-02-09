import { Milimeter } from "../cmpp/physical-dimensions/milimeter";
import { Printers } from "../global-env/global";

//TODO: refactor, removed unused code (ie: Matriz, or Matriz2 or Matriz3), or explain/document why you not all them.

type MatrizHeader = {
    partNumber: string;
    barCode: string;
}

type MatrizMessage = {
    printer: Printers;
    msg: string;
    passes?: number;
    remoteFieldId: number; // selection of remote field -> normally 1 to 4 (inclusive-both-sides) but theoretically any number between 1 and 99
}

type MatrizKinematics = {
    printVelocity: number; // in pulses per 1024 milisec  // fix: Not implemented
}

/** @deprecated remove the use of this type in the code, use V2 instead */
type MatrizPrintPositions_V1 = {
    // Print positions
    zLevel: Milimeter; // mm in relation to MinZ //Fix: Should be safe move (and give back an clear error msg if user try to access an physically impossible position)
    impressoesX: readonly Milimeter[]; // in relation to machine 0 -> FIX: Should be safe to use 0, not is the case, because it will collide carrier at FC- direction
    linhasY: readonly Milimeter[]; // in relation to machine 0 -> FIX: Should be safe to use 0, not is the case, because it will collide carrier at FC- direction 
}

type MatrizPrintPositions_V2 = {
    // Print positions
    zLevel: Milimeter // mm in relation to MinZ //Fix: Should be safe move (and give back an clear error msg if user try to access an physically impossible position)
    xPos: Milimeter
    xStep: Milimeter
    xQuantity: number
    yPos: Milimeter
    yStep: Milimeter
    yQuantity: number
}

/** @deprecated use Matriz2 instead */
export type Matriz = 
    & MatrizHeader 
    & MatrizMessage
    & MatrizKinematics
    & MatrizPrintPositions_V1

// Isomorphism between matrizes conhecidas
// This file introduces the type used inside "CADASTRO_GERAL.JSON" (Matriz2), and the many forms
// of converting this to legacy (Matriz(1)) equivalente data.


// Matriz2 is just Matriz3 which is the type read from 'CADASTRO_GERAL.JSON', but
// Matriz3 has the positions casted from 'Milimeter' to 'number' because this makes
// 'CADASTRO_GERAL' more easy the edit directly. 
// FIX: extract to a better place (and also: 'Matriz' and 'Matriz3')
export type Matriz2 = 
    & MatrizHeader 
    & MatrizMessage
    & MatrizKinematics
    & MatrizPrintPositions_V2


// convert type 'Milimeter' to type 'number' 
type UnCastMilimeter<T> = {
    [K in keyof T]: T[K] extends Milimeter ? number : T[K]
}

// Matriz3 is the type read from 'CADASTRO_GERAL.JSON'
export type Matriz3 = UnCastMilimeter<Matriz2>

