import { PortInfo, PortOpened, SerialDriverConstructor } from '../serial-local-driver'

export const f = () => undefined

export function checksum(obj: readonly number[], startbyte: number): number  {
    const etx = 0x3
    const objsum = obj.reduce( (acc, cur) => acc + cur)
    const extra = startbyte + etx
    const totalsum = objsum + extra
    const contained = totalsum % 256 
    const complimented = 256 - contained
    const adjusted = (complimented == 256) ? 0 : complimented
    return adjusted
}

// send some data to serial port
const port = 'COM1' // ports[0].uid
const baud = 2400
const data1 = [0x1B,0x02,0x00,0x1C,0x00,0x00,0x1B,0x03,0xDF ] 
const obj1 = [1<<6,0xD2,12 /*1<<2*/, 0x00] // reseta modo pause
const obj2 = [1<<7,0xD2,0x01, 0x00] // start serial
const obj3 = [1<<6,0xD2,1<<3, 0x00] // modo manual serial
const stbyte = 0x02
const resetaModoPause = [0x1B,stbyte, ...obj1, 0x1B, 0x03, checksum(obj1, stbyte) ]
const startBySerial = [0x1B,stbyte, ...obj2, 0x1B, 0x03, checksum(obj2, stbyte) ]
const resetaModoManual = [0x1B,stbyte, ...obj3, 0x1B, 0x03, checksum(obj3, stbyte) ]
//const data2 = [...data1,...data1,...data1,...data1,...data1,...data1,...data1,...data1,...data1,...data1,...data1,...data1,...data1,...data1,...data1,...data1,...data1,...data1,...data1,...data1,...data1,...data1,...data1,...data1]
const data2 = [...resetaModoPause, /*...resetaModoManual,*/ ...startBySerial] //data1 //[...data2,...data2,...data2,...data2,...data2,...data2,...data2,...data2,...data2,...data2,...data2,...data2,...data2,...data2,...data2,...data2,...data2,...data2,...data2,...data2,...data2,...data2,...data2]
const data =  [ 27, 2, 0, 210, 0, 0, 27, 3, 41 ]
const main = async () => {
    const driver = SerialDriverConstructor()
    const ports = await driver.listPorts()
    console.log(`detectado estas portas:`)
    //if (1===(2 as number)) {
        console.log(ports)
        const ports_ = ports //[ports[0]]
        ports_.map( portInfo => {
            console.log(`Abrindo porta ${portInfo.uid}...`)
            driver.open(portInfo.uid, 9600)
            .then( openedPort => {
                console.log(`aberta ${portInfo.uid}`)
                console.log(`gravando dados nela`)
                openedPort.onData( data => {
                    console.log(`recebendo dado da ${portInfo.uid}:`);
                    console.log(data);
                })
                openedPort.write(data)

                .then( () => {
                    console.log(`gravado.`)
                    
                    const closePort = () => {
                        console.log(`fechando a porta`)
                        openedPort.close()
                            .then( () => {
                                console.log(`fechada.`); console.log()
                            })
                        }
                    
                    setTimeout( () => closePort(), 5000)
                })
            })
        })
    //}
}

console.log(`iniciando...`)
main()
