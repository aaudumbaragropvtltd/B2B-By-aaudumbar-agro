const { image_search } = require('duckduckgo-images-api');

async function test() {
  try {
    const results = await image_search({ query: "TMT Steel Bars Fe500D (8mm-32mm)", moderate: true });
    console.log(results.slice(0, 3).map(r => r.image));
  } catch (e) {
    console.error(e);
  }
}
test();
