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

<style>

    button {
        display: inline-block;
        padding: 1em;
        margin: 1em;
        border: 1px solid black;
        transition: all 0.2s
    }

    button:hover {
        color: azure;
        font-style: oblique;
    }

    button.start:hover {
        background-color: darkgreen;
    }

    button.stop:hover {
        background-color: darkred;
    }

    button.reference:hover {
        color: black;
        background-color: yellow;
    }

</style>


<div class='flex'> 
    <button class='start'>start</button>
    <button class='stop'>stop</button>
    <button class='reference'>reference</button>
    
</div>


