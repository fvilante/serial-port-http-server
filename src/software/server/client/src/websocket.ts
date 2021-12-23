const ip = `192.168.15.80`
const port = 7071

 export const startWebSocket = async ():Promise<WebSocket> => {
    const ws = new WebSocket(`ws://${ip}:${port}`)
    return new Promise( (resolve, reject) => {
        const timer = setInterval( () => {
            const OPEN = 1 // The connection is open and ready to communicate.
            if (ws.readyState===OPEN) {
                clearInterval(timer);
                resolve(ws)
            }
        }, 10);
    })
}
