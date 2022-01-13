<script lang='ts'>

    import { makeServerProxy } from './server-proxy'
    import { onMount } from 'svelte'
    import { startWebSocket } from './websocket';

    let ws_: WebSocket | undefined = undefined

    const cleanup = () => {
        ws_?.close()
    }

    onMount( () => {
        startWebSocket().then( ws => {
            ws_ = ws
            makeServerProxy(ws_)
        })
        
        return( () => {
            cleanup()
        })
    })

</script>


<div class='flex'> 
    
</div>


