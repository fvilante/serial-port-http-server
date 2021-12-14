
import Fastify from 'fastify'
import { run } from '../../cmpp/controlers/examples/example-07'

const port = 8080

// Instantiate the framework
const fastify = Fastify({
    logger: true
})

// Declare a route
fastify.get('/doremifa', async (request, reply) => {
    await run() 
    return { hello: 'world' }
})

fastify.get('/', async (request, reply) => {
    reply
        .type('text/html; charset=UTF-8')
        .send(`<h1> juca </h1>`)
    
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