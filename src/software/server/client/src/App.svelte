<script lang='ts'>

    import { runServerCommunication } from './mouse-server';
    import Button from './components/Button.svelte'
    import {onMount } from 'svelte'
    import Array from './components/Array.svelte';
    import Hero from './components/Hero.svelte';
    
    
    let count: number = 0

    onMount( () => {
        runServerCommunication();
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


