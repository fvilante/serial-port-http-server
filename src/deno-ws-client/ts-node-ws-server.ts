import { Server } from 'ws'

// foo.ts
export type MyType = {name: 'foo', data: number} //etc
export const MyType = (a:number): MyType => ({ name: 'foo', data: a})

// bar.ts
//import { MyType } from './foo.ts' 
const a = MyType(2)   // a é do tipo MyType
const b = MyType(3)  // b: MyType
const c = [a,b] as const // c: [MyType, MyType]
const d = [a,b]  // d: MyType[]

const port = 8080 // results in default end-point -> 'ws:127.0.0.1:8080'
const timeServerWillStillOpened = (60000)*5

console.log('SERVER: Openning ws server')
const wss = new Server({ port });
console.log('SERVER: Server opened')

console.log(`SERVER: starting server on '${port}'... `)
console.log(`SERVER: server will stil opened for ${timeServerWillStillOpened} miliseconds`)

wss.on('connection', (sock:any) => {
  console.log('SERVER: server detected a connection')
  sock.on('message', (message:any) => {
    console.log('SERVER: server detected a message:')
    console.log('SERVER: received: %s', message);
  });
  console.log('SERVER: server is sending data: "something haha"')
  sock.send('SERVER: something haha');
  sock.on('close', () => console.log('SERVER: Connection has closed'))
  //sock.ping('',{},true); // todo: not implemented
  //sock.close()
});

setTimeout( () => {
  console.log(`SERVER: timer done: closing socket.`)
  wss.close()
  console.log(`SERVER: socket closed.`)
}, timeServerWillStillOpened)
