<script lang='ts'>
    
    import { runServerCommunication } from './server-communication';
    import {onMount } from 'svelte'
    
    
    let count: number = 0

    onMount( () => {
        runServerCommunication();
        const interval = setInterval(() => count++, 1000)
        return( () => {
            clearInterval(interval)
        })
    })

</script>

