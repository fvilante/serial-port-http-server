// tslint:disable: no-expression-statement
// tslint:disable: typedef

import { listSerialPorts } from './../serial/index'

const Helper_ListPorts_or_Throw = async () => await listSerialPorts().fmap( r => r.orDie()).async()

const main = async () => {
    const portsInfo = await Helper_ListPorts_or_Throw()
    portsInfo.map( eachPort => console.log(eachPort) )
}

main();
