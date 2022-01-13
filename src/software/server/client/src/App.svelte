<script lang='ts'>

    import { makeServerProxy } from './server-proxy'
    import { onMount } from 'svelte'
    import { startWebSocket } from './websocket';
    import { ClientEvent, MachineGotoClientEvent, MachineInitializeClientEvent, MachineStopClientEvent, PlayNoteClientEvent } from './interface/core-types';
    //
    const pitchShift = 1

    type Frequency = number  // the numbe represents a frequency in hertz 
    type Duration = number // in miliseconds
    type Bend = number // acceleration in pulses per second squared

    const C4: Frequency = 262 * pitchShift
    const D4: Frequency = 294 * pitchShift
    const E4: Frequency = 330 * pitchShift
    const F4: Frequency = 349 * pitchShift
    const G4: Frequency = 392 * pitchShift
    const A4: Frequency = 440 * pitchShift
    const B4: Frequency = 494 * pitchShift
    const C5: Frequency = (C4*2) * pitchShift

    type Sound = { 
        frequency: Frequency
        duration: Duration
        bend?: Bend
    }

    type NoteName = 'C' | 'D' | 'E' | 'F' | 'G' | 'A' | 'B'

    type Note = {
        name: NoteName
        frequency: Frequency
    }

    const notes: readonly Note[] = [
        { name: 'C', frequency: C4 },
        { name: 'D', frequency: D4 },
        { name: 'E', frequency: E4 },
        { name: 'F', frequency: F4 },
        { name: 'G', frequency: G4 },
        { name: 'A', frequency: A4 },
        { name: 'B', frequency: B4 },
    ]

    //

    const sendEvent = (event: ClientEvent, ws: WebSocket) => {
        const data = JSON.stringify(event)
        ws?.send(data);
    }

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

    const onStart = () => {
        const event: MachineGotoClientEvent = {
            kind: 'MachineGotoClientEvent',
            x: 1000,
            y: 1000,
            z: 1000,
        }
        if (ws_) sendEvent(event, ws_)
    }

    const onStop = () => {
        const event: MachineStopClientEvent = {
            kind: 'MachineStopClientEvent',
        }
        if (ws_) sendEvent(event, ws_)
    }

    const onReference = () => {
        const event: MachineInitializeClientEvent = {
            kind: 'MachineInitializeClientEvent',
        }
        if (ws_) sendEvent(event, ws_)
    }

    const onSound = (sound: Sound) => {
        const { duration, frequency } = sound
        const event: PlayNoteClientEvent = {
            kind: 'PlayNoteClientEvent',
            duration,
            frequency,
        }
        if (ws_) sendEvent(event, ws_)
    }

</script>

<style>

    div.flex {
        display: flex;
        flex-wrap: wrap;
    }

    button {
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

    button.sound:hover {
        color: white;
        background-color: black;
    }

</style>


<div class='flex'> 
    <button class='start' on:click="{onStart}">start</button>
    <button class='stop' on:click="{onStop}">stop</button>
    <button class='reference' on:click={onReference}>reference</button>    
</div>


<div class='flex'>
    {#each notes as {name, frequency}, i}
    
        <button class='sound' on:click="{() => onSound({frequency, duration:1000})}">{name}</button>
    
    {/each} 
   
</div>
