//import { PrintingPositions } from "./cmpp-controler"
export type Milimeter = {
    kind: 'Milimeter';
    value: number;
};
export const Milimeter = (value: number): Milimeter => ({ kind: 'Milimeter', value });
