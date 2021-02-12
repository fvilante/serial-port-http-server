import WebSocket from 'ws'


/**-----------------------------------------------------------------------------------------
 * Abstract
  -----------------------------------------------------------------------------------------*/


export type YClient = {
  kind: 'YClient'
  onClose: (handler: () => void) => void
  onData: (handler: (data: string, client: YClient) => void ) => void
  send: (msg: string) => Promise<void>
  close: () => Promise<void>
}



export type YServer = {
  kind: 'YServer'
  clients: () => Promise<Set<YClient>>
  onConnection: (f: (c: YClient, s: YServer) => void ) => void
  onError: (handler: (err?: Error | undefined) => void) => void
  close: () => Promise<void>
}



//-----------------------------------------------------------------------------------------

//static constructor

export type WSServerConfig = {
  readonly port: number // ie: 8080
  onInit?: (s: WebSocketServer) => void
}

export type YServer_ = {
  fromWebSocket: (config: WSServerConfig) => Promise<YServer>
}


export const YServer_: YServer_ = {
  fromWebSocket: (config: WSServerConfig) => YServerFromWebSocket(config)
}


/**-----------------------------------------------------------------------------------------
 * Concrete WebSocket Server --> YServer
  -----------------------------------------------------------------------------------------*/

type WebSocketClient = WebSocket
type WebSocketServer = WebSocket.Server

// -----------------------
// construction models
type AsyncConstructor<A extends any[], T> = (...deeps: A) => Promise<T> 

type _YClientAdapter = AsyncConstructor<[WebSocketClient], YClient>
type _YServerAdapter = AsyncConstructor<[WebSocketServer], YServer> 
type YServerFromWebSocket = AsyncConstructor<[WSServerConfig], YServer> 



//-----------------------------------------------------------------------------------------
// implementation

const _YClientAdapter: _YClientAdapter = (client: WebSocketClient): Promise<YClient> => 
  new Promise( (resolve, reject) => {

    const yclient: YClient = {
      kind: 'YClient',
      close: () => new Promise<void>( (resolve, reject) => {
        const clientAlreadyClosed = (client.readyState === WebSocket.CLOSING) ||  (client.readyState === WebSocket.CLOSED)
        if(!clientAlreadyClosed) {
          try {
            client.close();
            resolve();
          } catch (err) {
            reject(new Error(`Cannot close websocket client`))
          }
        } else if(client.readyState === WebSocket.CONNECTING) {
            reject(new Error(`Cannot close websocket client because connecting phase is not completed yet`))
        } else {
          // do nothing, port is already closed or being closed
        }   
      }),
      onClose: handler => client.on('close',handler),
      onData: handler => client.on('message', handler),
      send: data => new Promise<void>( (resolve,reject) => {
        if (client.readyState === WebSocket.OPEN) {
          try { 
            client.send(data);
            resolve();
          } catch (err) { 
            reject(new Error(`could not send data using websocket`)) 
          }
        } else {
          reject(new Error(`tried to send data to websocket client but client state is not ready`))        
        }
      }) ,
    }

    //redirect all other errors to main promise error channel
    client.on('error', err => {
      const hasClosed = yclient.close()
      const x = hasClosed.finally( () => reject(err) );
    })


    resolve(yclient);

  })

//-----------------------------------------------------------------------------------------


const _YServerAdapter: _YServerAdapter = (server: WebSocketServer): Promise<YServer> => {
  
  const mapSet = <A,B>(set: Set<A>, f: (_:A) => B): Set<B> => {
    let buf: Set<B> = new Set()
    set.forEach( value => buf.add(f(value)))
    return new Set<B>(buf)
  }

  const transform = <A>(mma: Set<Promise<A>>): Promise<Set<A>> => {
    return new Promise( (resolve, reject) => {
      let buf: Set<A> = new Set()
      mma.forEach( ma => {
        ma.then( a => {
          buf.add(a)
        })
      });
      resolve(new Set(buf))
    })
  }

  return new Promise( (resolve, reject) => {
    
    const yServer: YServer = {
      kind: 'YServer',
      onConnection: handler => {
        server.on('connection', client => {
          const yclient = _YClientAdapter(client)
          const yserver = _YServerAdapter(server)
          Promise.all([yclient, yserver]).then( ([client, server]) => {
            handler(client, server)
          })
        })
      },
      clients: () => {
        const x = mapSet(server.clients, wsclient => _YClientAdapter(wsclient))
        return transform(x)
      },
      close: () => new Promise<void>( (resolve,reject) => {
        try {
          server.close();
          resolve();
        } catch (err) {
          reject(new Error(`cannot close websocket server`))
        }
      }),
      onError: handler => {
        server.on('error', handler)
      },
    }

    resolve(yServer)

  })
}

  

// -----------------------------------------------------------------------------------------


export const YServerFromWebSocket: YServerFromWebSocket = (config:WSServerConfig): Promise<YServer> => {
  const wsserver = new WebSocket.Server({ port: config.port });
  if (config.onInit) config.onInit(wsserver)
  const yserver = _YServerAdapter(wsserver)
  return yserver
}


