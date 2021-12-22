import { Response } from '../../core-types'


const ip = `192.168.15.80`
const port = 7071

export const runServerCommunication = async (): Promise<void> => {

    const connectToServer = async ():Promise<WebSocket> => {
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

    const getOrCreateCursorFor = (serverResponse: Response):SVGElement => {
        const { sender, color, x, y } = serverResponse
        const existing = document.querySelector(`[data-sender='${sender}']`)
        if (existing) {
            return existing as SVGElement
        }

        const template = document.getElementById('cursor') as HTMLTemplateElement;
        const cursor = template.content?.firstElementChild?.cloneNode(true) as SVGElement;
        const svgPath = cursor.getElementsByTagName('path')[0]

        cursor.setAttribute("data-sender", sender);
        svgPath.setAttribute("fill", `hsl(${color}, 50%, 50%)`);
        document.body.appendChild(cursor);

        return cursor
    }

    // run 

    const ws = await connectToServer();

    ws.onmessage = (webSocketMessage: any) => {
        console.log(`Recebido mensagem do servidor`)
        const serverResponse: Response = JSON.parse(webSocketMessage.data)
        const { sender, color, x, y } = serverResponse
        console.table(serverResponse)
        const cursor = getOrCreateCursorFor(serverResponse)
        cursor.style.transform = `translate(${x}px, ${y}px)`;
    }  

    const handleMouseMove = (event: MouseEvent) => {
        const message = {
            x: event.pageX,
            y: event.pageY,
        }
        const dataToSend = JSON.stringify(message)
        ws.send(dataToSend);
    }

    const handleTouchStart = (event: TouchEvent) => {
        console.table(event)
        event.preventDefault();
        const touch = event.touches[0];
        const x = touch.pageX
        const y = touch.pageY
        const message = {x, y}
        const dataToSend = JSON.stringify(message)
        ws.send(dataToSend);
    }

    document.body.onmousemove = handleMouseMove

    document.body.ontouchstart = handleTouchStart
    document.body.ontouchmove = handleTouchStart



}