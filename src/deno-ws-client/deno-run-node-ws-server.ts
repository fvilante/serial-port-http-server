// runs node-ws-server


console.log(`LOG: starting server...`)
const p = Deno.run({
    cmd: ['node','node_wsServer.js']
})
console.log(`LOG: Waiting finish...`)
const x = await p.status()
console.log(`END: finished... ${x}`)