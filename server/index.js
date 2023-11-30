const { default: puppeteer } = require("puppeteer");
const $ = require('cheerio');
const bodyParser = require('body-parser')
const cors = require('cors')
const port = 3000
const express = require('express');
const app = express();

app.use(bodyParser.urlencoded({extended: true})); 
app.use(bodyParser.json());
app.use(cors())
app.use(express.json({
    type: ['application/json', 'text/plain']
  }))

app.listen(port, () => console.log('Example app is listening on port ${port}.'));

app.get('/ping', (req, res) => {
    res.send('Successful response.');
});

app.post('/concerts', async (req, res) => {
    let html = ""
    const artist = req.body;
    console.log(artist.name);
    const concerts = await fetchConcerts(artist.name);
    console.log(concerts);
    if (concerts != "") {
        html += `<div class="artist-container">
                    <div class="artist-head">
                        <img src="${artist.imgsrc}" alt="${artist.name}"</img>
                        <h1>${artist.name}</h1>
                    <div class="concerts">` + concerts + `</div></div>`;
    }
    res.send(html);
});

async function fetchConcerts(artist) {
    const query = artist.replace(" ", "%20")
    const url = `https://www.ticketmaster.com/search?q=${query}`;
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url, {
        waitUntil: "domcontentloaded",
    });
    const dataTestId = "eventList";
    let concerts;
    try {
        concerts = await page.$eval(`[data-testid="${dataTestId}"]`, (element) => {
            let result;
            console.log(element.innerHTML);
            const concertArray = element.getElementsByTagName("li")
            console.log("concert: ", concertArray[0].innerHTML);
            for(const key in concertArray){
                const concert = concertArray[key].firstElementChild.firstElementChild;
                const date = concert.children[1];
                const day = date.children[1];
                const month = date.children[0];
                const year = date.children[2];
                const link = concert.getElementsByTagName("a")[0];
                const desc = concert.children[2].firstElementChild;
                result +='<div class="concert"><div class="date"><div class="day">'+ day +'</div>'+
                '<div class="month">' + month + '</div><div class"year"' + year + '</div></div>' + 
                '<div class="desc">' + desc + '<div><div class="link">' + link + '</div></div>';
            }
            console.log(result);
            return result;
        });
    } catch (err) {
        console.error(err);
        concerts = "";
    }

    await browser.close();
    return await concerts;
}