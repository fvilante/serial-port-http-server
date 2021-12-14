
import Fastify from 'fastify'
//import { run } from '../cmpp/controlers/examples/example-07'

const port = 8080

// Instantiate the framework
const fastify = Fastify({
    logger: true
})

// Declare a route
fastify.get('/', async (request, reply) => {
    //await run() 
    return { hello: 'world' }
})

// Run the server!
const start = async () => {
    try {
        await fastify.listen(port,'0.0.0.0')
    } catch (err) {
        fastify.log.error(err)
        process.exit(1)
    }
}
start()