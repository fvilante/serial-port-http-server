//import { Maybe_ } from './maybe'

function program() {
    const allDivs = document.querySelectorAll(".title");
        
    //const ma = Maybe_.fromJust('here is a maybe')

    allDivs.forEach( div => {
        let c = 0  
        const newDiv = document.createElement('div')
        newDiv.style.color = 'blue'
        newDiv.innerText = `Button ref = ${c++}`
        newDiv.addEventListener('click', (event) => {
            //newDiv.style.cssText = 'color: green; background: black';
            newDiv.innerHTML = `${event.clientX}, ${event.clientY} = ${c++} / ma=${2}`
        })
        newDiv.addEventListener('mouseenter', (event) => {
            console.log('mouse entered at', event.clientY, event.clientX)
            newDiv.style.cssText = 'color: while; background: cyan';
        })
        newDiv.addEventListener('mouseleave', (event) => {
            newDiv.style.cssText = 'color: green; background: black';
        })
        div.appendChild(newDiv)
        //div.innerHTML = 'juca'
    }) 

    

}

program();

