import http from 'http'
import fs from 'fs'

import static_ from 'node-static'

let c = 0
const file = new static_.Server('../')

const host = 'localhost'
const port = 8080

http.createServer( (req, res) => {
    req.addListener('end', () => {
        console.log(`request received ${c++}`)
        file.serve(req, res)
    }).resume()

}).listen(port,host, () => {
    console.log(`Flavio's http server is running on host=${host}, port=${port}, c=${c++}`)
})



//nice phrases:
//Web browsers are built to display HTML content, as well as any styles we add with CSS
//when we want users to interact with our server via a web browser
/*
const html = `<h3 id="textBox"> Welcome to Flavio's http server in $_{host}:$_{port}.
Choose your option: 1 or 2 ? </h3>`
const stringJson: string = `{ "serverName": "Flavio's server", "status": "Alive",
"counter": "$_{c}"}`


let c = 0

const indexHtml = __dirname + "/../index.html"
const requestListener: http.RequestListener = (req, res) => {
    console.log("Received request from a http client")
    console.log(`Reading '${indexHtml}'.`)
    fs.promises.readFile(indexHtml)
        .then( contents => {
            console.log(`Sending '${indexHtml}'.`)
            res.setHeader("Content-Type", "text/html")
            res.writeHead(200)
            res.end(contents)
        }) 

}

const server = http.createServer(requestListener)

server.listen(port, host, () => {
    console.log(`Flavio's http server is running on host=${host}, port=${port}`)
})*/