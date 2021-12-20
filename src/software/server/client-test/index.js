const main = async () => {

    const connectToServer = async () => {
        const ws = new WebSocket('ws://localhost:7071')
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

    const getOrCreateCursorFor = messageBody => {
        const { sender, color, x, y } = messageBody
        const existing = document.querySelector(`[data-sender='${sender}']`)
        if (existing) {
            return existing
        }

        const template = document.getElementById('cursor');
        const cursor = template.content.firstElementChild.cloneNode(true);
        const svgPath = cursor.getElementsByTagName('path')[0]

        cursor.setAttribute("data-sender", sender);
        svgPath.setAttribute("fill", `hsl(${messageBody.color}, 50%, 50%)`);
        document.body.appendChild(cursor);

        return cursor
    }

    // run 

    const ws = await connectToServer();

    ws.onmessage = (webSocketMessage) => {
        console.log(`Recebido mensagem do servidor`)
        const messageBody = JSON.parse(webSocketMessage.data)
        const { sender, color, x, y } = messageBody
        console.table(messageBody)
        const cursor = getOrCreateCursorFor(messageBody)
        cursor.style.transform = `translate(${x}px, ${y}px)`;
    }  

    document.body.onmousemove = event => {
        const messageBody = {
            x: event.clientX,
            y: event.clientY,
        }
        ws.send(JSON.stringify(messageBody));
    }


}

console.log('hello world juca!')
main();