import { makeMovimentKit } from "../machine-controler"

const main2 = async () => {
    console.log('Iniciado')
    console.log('Obtendo kit de movimento...')
    const movimentKit = await makeMovimentKit()
    const {x,y,z,m} = movimentKit
    await m.safelyReferenceSystemIfNecessary()

}

main2()