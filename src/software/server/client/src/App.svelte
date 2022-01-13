<script lang='ts'>

    import { runServerCommunication } from './mouse-server';
    import Button from './lib/Button.svelte'
    import {onMount } from 'svelte'
    import Array from './lib/Array.svelte';
    import Hero from './lib/Hero.svelte';
    import { startWebSocket } from './websocket';

    let ws_: WebSocket | undefined = undefined

    const cleanup = () => {
        ws_?.close()
    }

    onMount( () => {
        startWebSocket().then( ws => {
            ws_ = ws
            runServerCommunication(ws_)
        })
        
        return( () => {
            cleanup()
        })
    })

</script>


<div class='flex'> 
    <Button> 
        <h1> olha vamos colocar algo aqui? </h1>
    </Button>
</div>


