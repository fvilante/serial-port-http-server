let c = 0
function myFunction() {
    var x = document.createElement("BUTTON");
    var t = document.createTextNode("Click me");
    x.addEventListener('click', () => {
        console.log('clicado',c++)
    })
    x.appendChild(t);
    document.body.appendChild(x);
  }

  myFunction();

/*
export const runExternalFunction = () => 'Juca'

const a = 'ssss' //getName()

const el = document.getElementById("textBox")

setTimeout( () => {
    el.innerHTML
    .concat("<br><br>")
    .concat("<h3> Choose option you want </h3>")
    .concat("<br><br>")
    .concat(`<ul>1) option A (${runExternalFunction()})</ul>`)
    .concat(`<ul>2) option B</ul>`)
    .concat("<br><br>")
    .concat('<a>end!</a>')
}, 3000)
const button = document.createElement("BUTTON");
const text1 = document.createTextNode("option 1");
const text2 = document.createTextNode("option 2");

const child = button.appendChild(text1)
el.appendChild(child)
*/