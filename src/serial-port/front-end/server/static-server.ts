import http from "http"
import url from "url"
import path from 'path'
import fs from 'fs'
console.log('oi')
const port = 8080

const mimeTypes = {
    'txt': 'text/plain',
    "html": "text/html",
    "jpeg": "image/jpeg",
    "jpg": "image/jpeg",
    "png": "image/png",
    "svg": "image/svg+xml",
    "json": "application/json",
    "js": "text/javascript",
    "css": "text/css"
} as const;
 
http.createServer(function(req, res) {
 
    const clientUrl = req.url as string
    console.log(`trying to serve file: '${clientUrl}'`)

    const uri = url.parse(clientUrl).pathname as string
    console.log('uri',uri)
    let filename = path.join(process.cwd(), uri);
    console.log('filename', filename)
    fs.exists(filename, exists => {
        if(!exists) {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.write("404 Not Found\n");
        res.end();
        return;
        }
    
        const fileStat = fs.statSync(filename)
 
        if (fileStat.isDirectory()) 
            filename += '../index.html';
    
        fs.readFile(filename, "binary", (err,file) => {
        if(err) {        
            res.writeHead(500, {"Content-Type": "text/plain"});
            res.write(err + "\n");
            res.end();
            return;
        }

        const fileExtension = filename.split('.').pop() as keyof typeof mimeTypes 
        console.log('extensao do arquivo', fileExtension)
        let mimeType = mimeTypes[fileExtension];
        
        if (!mimeType) {
            mimeType = 'text/plain';
        }
        
        const sentMime = { "Content-Type": mimeType }
        console.log('Mime ->', sentMime)
        res.writeHead(200,sentMime) ;
        res.write(file, "binary");
        res.end();
    });
  });
}).listen(port);

console.log("Static file server running at\n  => http://localhost:" + port + "/\nCTRL + C to shutdown");