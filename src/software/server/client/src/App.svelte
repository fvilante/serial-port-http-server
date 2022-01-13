<script lang='ts'>

    import { runServerCommunication } from './mouse-server';
    import Button from './lib/Button.svelte'
    import {onMount } from 'svelte'
    import Array from './lib/Array.svelte';
    import Hero from './lib/Hero.svelte';
    import { startWebSocket } from './websocket';

   
    let count: number = 0

    onMount( () => {
        startWebSocket().then( ws => {
            runServerCommunication(ws)
        })
        
        const interval = setInterval(() => count++, 1000)
        return( () => {
            clearInterval(interval)
        })
    })

</script>


<div class='flex'> 
    <Button> 
        <h1> olha vamos colocar algo aqui? </h1>
    </Button>
</div>


