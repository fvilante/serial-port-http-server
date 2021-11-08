
export type PortInfo = {
    readonly path: string; // (exemple in linux: '/dev/tty-usbserial1', or in windows: 'COM6')
    readonly manufacturer?: string;
    readonly serialNumber?: string;
    readonly pnpId?: string;
    readonly locationId?: string;
    readonly productId?: string;
    readonly vendorId?: string;
}