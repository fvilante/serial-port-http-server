// tslint:disable: no-expression-statement
// tslint:disable: typedef

import { listSerialPorts } from './../serial/index'

const main = async () => {
    const portsInfo = await listSerialPorts()
    portsInfo.map( eachPort => console.log(eachPort) )
}

main();
