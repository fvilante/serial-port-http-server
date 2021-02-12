

test('Can connect the client on the server and vice-versa', async () => {



    expect(serverDetectedConnection).toEqual(true)
    expect(clientDetectedConnection).toEqual(true)

})