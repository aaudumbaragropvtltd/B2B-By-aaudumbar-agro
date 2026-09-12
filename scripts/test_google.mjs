import google from 'googlethis';

async function test() {
  try {
    const images = await google.image('TMT Steel Bars Fe500D (8mm-32mm)', { safe: false });
    console.log(images.slice(0, 3).map(i => i.url));
  } catch (e) {
    console.error(e);
  }
}
test();
