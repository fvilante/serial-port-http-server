// tslint:disable: no-expression-statement
// tslint:disable: typedef

import { SerialDriverConstructor } from './../serial/index'

// informal test

const main = async () => {

    const driver = SerialDriverConstructor()

    const portsInfo = await driver.listPorts()
    portsInfo.map( eachPort => console.log(eachPort) )
}

main()
