//TODO: Implement unit test for below set of funcions

export const bit_test = (num:number, bit:number): boolean => {
    return ((num>>bit) % 2 != 0)
}

export const bit_clear = (num: number, bit: number): number => {
    return  num&~(1<<bit);
}

export const bit_set = (num: number, bit: number):number => {
    return num | 1<<bit;
}

export const bit_toggle = (num: number, bit: number): number => {
    return bit_test(num, bit) ? bit_clear(num, bit) : bit_set(num, bit);
}