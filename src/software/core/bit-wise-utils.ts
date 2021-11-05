export const bit_test = (num:number, bit:number): boolean => {
    return ((num>>bit) % 2 != 0)
}