const { NseIndia } = require('stock-nse-india');
const nse = new NseIndia();

async function run() {
  try {
    const data = await nse.getMarketStatus();
    console.log('Status:', data.marketState[0]);
  } catch (e) {
    console.error(e);
  }
}
run();
