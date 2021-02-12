export const promiseTimeout = <A>(ms: number, promise: Promise<A>) => {

    // Create a promise that rejects in <ms> milliseconds
    let timeout = new Promise((resolve, reject) => {
      let id = setTimeout(() => {
        clearTimeout(id);
        reject('Timed out in '+ ms + 'ms.')
      }, ms)
    })
  
    // Returns a race between our timeout and the passed in promise
    //todo: The ideal should be to be able to cancel the main promise on the event of a timeout
    return Promise.race([
      promise,
      timeout
    ])
  }
  