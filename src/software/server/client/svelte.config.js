const sveltePreprocess  = require('svelte-preprocess');

const preprocess = sveltePreprocess({
  postcss: {
    plugins: [
      //require('tailwindcss') //temporaryly disabled to use plain old css
    ]
  }
});

module.exports = {
  preprocess,
};