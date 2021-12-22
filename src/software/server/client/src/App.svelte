<script lang='ts'>
    import {onMount } from 'svelte'
    
    let count: number = 0
    onMount( () => {
        const interval = setInterval(() => count++, 1000)
        return( () => {
            clearInterval(interval)
        })
    })

</script>

<style> 
   
</style>

<div class="App border-4">
    <header class="App-header">
        <img src='/img/posijet-logo.jpg' class="App-logo" alt='Logo da posijet' />
        <p> Edit <code>src/App.svelte</code> and save to auto reload </p>
        <p> Page has been open for <code>${count}</code> seconds </p>
        <p>
            <a class="App-link" href="www.posijet.com.br" target="_blank" rel="noopener noreferrer">
                Learn svelte
            </a>
        </p>
    </header>
</div> 