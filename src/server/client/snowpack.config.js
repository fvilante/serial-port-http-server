// Snowpack Configuration File
// See all supported options: https://www.snowpack.dev/reference/configuration

/** @type {import("snowpack").SnowpackUserConfig } */
module.exports = {
  mount: {
    public: {url: '/', static: true},
    src: {url: '/dist'},
  },
  // TODO: Solve this when possible: This snowpack config stoped working and I not have time to check the reason (probably something simple). I'm workarouding placing server-client types into the client folder which currently is a sub-folder of the server. 
  // NOTE: it seems i may solve the probleam and it is not related to this config. The problem may be that I was using a typescript file with only types, and because it does not emits the javascript file the import was not working. Solve by just addeing a 'foo' function to the ts file
  //       necause it maybe line below can be uncomemnted
  //workspaceRoot: '../../../../', 
  plugins: [
    '@snowpack/plugin-svelte',
    '@snowpack/plugin-dotenv',
    [
      '@snowpack/plugin-typescript',
      {
        /* Yarn PnP workaround: see https://www.npmjs.com/package/@snowpack/plugin-typescript */
        ...(process.versions.pnp ? { tsc: 'yarn pnpify tsc' } : {}),
      },
    ],
  ],
  packageOptions: {
    /* ... */
  },
  devOptions: {
    /* ... */
  },
  buildOptions: {
    /* ... */
  },
};
