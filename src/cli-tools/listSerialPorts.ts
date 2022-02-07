import { listSerialPorts } from "../serial/list-serial/list-serial-ports";

const main = async () => {
    const portsInfo = await listSerialPorts()
    portsInfo.map( eachPort => console.log(eachPort) )
}

main();
