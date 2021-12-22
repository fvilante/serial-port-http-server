<script lang='ts'>

    import { runServerCommunication } from './server-communication';
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

<div>
    <Hero> </Hero>
</div>

<div class='flex'> 
    <Button caption='Start'> 
        <h1> olha vamos colocar algo aqui? </h1>
    </Button>
    <Button caption='Stop'> </Button>
    <Button caption='Forcar Referencia'> </Button>
    <Array> </Array>
</div>


