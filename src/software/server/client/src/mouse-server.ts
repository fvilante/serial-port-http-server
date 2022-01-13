import { CursorPositionClientEvent, CursorPositionServerEvent, ServerEvent } from './interface/core-types'
import { startWebSocket } from './websocket'


export const runServerCommunication = async (ws: WebSocket): Promise<void> => {

    const getOrCreateCursorFor = (serverResponse: CursorPositionServerEvent):SVGElement => {
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

    const onCursorPositionServerEvent = (serverEvent: CursorPositionServerEvent) => {
        const { sender, color, x, y } = serverEvent
        console.table(serverEvent)
        const cursor = getOrCreateCursorFor(serverEvent)
        cursor.style.transform = `translate(${x}px, ${y}px)`;
    }

    ws.onmessage = (webSocketMessage: any) => {
        
        const serverEvent: ServerEvent = JSON.parse(webSocketMessage.data)
        console.log(`Recebido mensagem do servidor`)

        

        switch (serverEvent.kind) {
            case 'CursorPositionServerEvent': {
                onCursorPositionServerEvent(serverEvent)
                break;
            }

            default:
                
        }


    }  

    const makeCursorPositionClientEvent = (x: number, y: number): CursorPositionClientEvent => {
        const message: CursorPositionClientEvent = {
            kind: 'CursorPositionClientEvent',
            x,
            y,
        }
        return message
    }

    const sendEvent = (ws: WebSocket, event: CursorPositionClientEvent) => {
        const dataToSend = JSON.stringify(event)
        ws.send(dataToSend);
    }

    const handleMouseMove = (event: MouseEvent) => {
        event.preventDefault();
        const { pageX, pageY } = event
        const clientEvent = makeCursorPositionClientEvent(pageX, pageY)
        sendEvent(ws, clientEvent)
    }

    const handleTouchStart = (event: TouchEvent) => {
        event.preventDefault();
        const touch = event.touches[0];
        const { pageX, pageY } = touch
        const clientEvent = makeCursorPositionClientEvent(pageX, pageY)
        sendEvent(ws, clientEvent)
    }

    document.body.onmousemove = handleMouseMove
    document.body.ontouchstart = handleTouchStart
    document.body.ontouchmove = handleTouchStart

}
