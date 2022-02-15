<script lang='ts'> 
    import { StartEvent, StopEvent, ForceReferenceEvent } from '../interface/core-types'
    import { getUuid } from '../uuid';

    let pos = {x: 0, y:0, c: 0}
    let uid = getUuid()

    type Events = 
        | StartEvent
        | StopEvent
        | ForceReferenceEvent

    const onclick = <K extends Events['kind']>(kind: K) => (event: MouseEvent) => {
        pos = {
            x: event.clientX,
            y: event.clientY,
            c: pos.c+1,
        }
        switch(kind) {
            case 'StartEvent': {
                break;
            }
            case 'StopEvent': {
                break;
            }
            case 'ForceReferenceEvent': {
                break;
            }
        }
    }

</script>




<div class="inline-flex">
    <button 
        class="bg-gray-300 hover:bg-green-400 text-gray-800 font-bold py-2 px-4 rounded-l"
        on:click={onclick('StartEvent')}>
            Start
    </button>
    <button 
        class="bg-gray-300 hover:bg-red-400 text-gray-800 font-bold py-2 px-4 rounded-r"
        on:click={onclick('StopEvent')}>
            Stop
    </button>
    <button 
        class="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-l"
        on:click={onclick('ForceReferenceEvent')}>
            Forçar Referencia
    </button>
</div>
<p>
    Current Position is [x={pos.x}, y={pos.y}, c={pos.c}]
    uid={uid}
</p>