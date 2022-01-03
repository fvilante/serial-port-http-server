import { ExecuteInParalel } from "../../../core/promise-utils"
import { PulsesPerTick, PulsesPerTickSquared, Pulses } from "../../physical-dimensions/physical-dimensions"
import { makeTunnel } from "../../transport/tunnel"
import { AxisControler } from "../axis-controler"
import { makeCmppControler } from "../cmpp-controler"
import { SmartReferenceParameters } from "../utils/smart-reference"

// control multiple axis



const main = async () => {

    const tx = makeTunnel('com48', 9600, 0)
    const tz = makeTunnel('com50', 9600, 0)
    const ty = makeTunnel('com51', 9600, 0)

    const cx = makeCmppControler(tx)
    const cy = makeCmppControler(ty)
    const cz = makeCmppControler(tz)

    const x = AxisControler(cx)
    const y = AxisControler(cy)
    const z = AxisControler(cz)

    const referenceConfig: SmartReferenceParameters = {
        reference: {
            speed: PulsesPerTick(1000),
            acceleration: PulsesPerTickSquared(5000)
        },
        endPosition: Pulses(500)
    }

    await z.forceSmartReference(referenceConfig)

    await ExecuteInParalel([
        () => x.forceSmartReference(referenceConfig),
        () => y.forceSmartReference(referenceConfig)
    ])

}

main();