export const delay = (ms: number) => new Promise<void>( resolve => {
    let id = setTimeout( () => resolve(), ms);
})