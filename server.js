const { default: puppeteer } = require("puppeteer");

fetchConcerts("Mass of the fermenting dregs")


async function fetchConcerts(artist) {
    const query = artist.replaceAll(" ", "%20")
    console.log(query);
    const url = `https://www.ticketmaster.com/search?q=${query}`;
    console.log(url);
    const browser = await puppeteer.launch({headless: false});
    const page = await browser.newPage();
    await page.goto(url, {
        waitUntil: "domcontentloaded",
    });
    const dataTestId = "eventList";
    let concerts;
    try {
        concerts = await page.$eval(`[data-testid="${dataTestId}"]`, (element) => {
            console.log("element ", element.innerHTML);
            return element.innerHTML;
        });
    } catch (err) {
        console.log("No events for", artist);
        concerts = "";
    }
    return concerts;
}
