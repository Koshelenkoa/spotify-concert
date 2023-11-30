const clientId = "926c663d85114d6d9c6b8ee23d76c74b";
const params = new URLSearchParams(document.location.search);
const code = params.get("code");

if (!code) {
    redirectToAuthCodeFlow(clientId);
} else {
    const accessToken = await getAccessToken(clientId, code);
    populatePage(accessToken);
}

export async function redirectToAuthCodeFlow(clientId) {
    const verifier = generateCodeVerifier(128);
    const challenge = await generateCodeChallenge(verifier);
    localStorage.setItem("verifier", verifier);

    const params = new URLSearchParams();
    params.append("client_id", clientId);
    params.append("response_type", "code");
    params.append("redirect_uri", "http://localhost:5173/callback");
    params.append("scope", "user-read-private user-follow-read user-top-read");
    params.append("code_challenge_method", "S256");
    params.append("code_challenge", challenge);

    document.location = `https://accounts.spotify.com/authorize?${params.toString()}`;
}

function generateCodeVerifier(length) {
    let text = '';
    let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

async function generateCodeChallenge(codeVerifier) {
    const data = new TextEncoder().encode(codeVerifier);
    const digest = await window.crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode.apply(null, [...new Uint8Array(digest)]))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

export async function getAccessToken(clientId, code) {
    const verifier = localStorage.getItem("verifier");

    const params = new URLSearchParams();
    params.append("client_id", clientId);
    params.append("grant_type", "authorization_code");
    params.append("code", code);
    params.append("redirect_uri", "http://localhost:5173/callback");
    params.append("code_verifier", verifier);
    const result = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params
    });

    const { access_token } = await result.json();
    return access_token;
}

async function fetchArtists(token) {
   
    const topResult = await fetch("https://api.spotify.com/v1/me/top/artists?time_range=medium_term&limit=50", {
        method: "GET", headers: { Authorization: `Bearer ${token}` }
    });
    const top = await topResult.json();

    const followedResult = await fetch('https://api.spotify.com/v1/me/following?type=artist', {
        method: "GET", headers: { Authorization: `Bearer ${token}` }
    });
    const followed = await followedResult.json();
    const topArtistList = top.items;
    const followedArtistList = followed.items;
    const result = [];

    if (!(topArtistList === undefined || topArtistList.length == 0)) {
        for (const key in topArtistList) {
            const artist = topArtistList[key];
            let images = [];
            images = artist.images;
            let img;
            try{
                img = images.at(2).url;
            }catch(err){
                img = "public/pfp.jpeg"
            }
            result.push({
                name: artist.name,
                imgsrc: img
            });
        }
    }

    if (!(followedArtistList === undefined || followedArtistList.length == 0)) {
        for (const key in followedArtistList) {
            const artist = followedArtistList[key];
            let images = [];
            images = artist.images;
            const img = images.at(2);
            result.push({
                name: artist.name,
                imgsrc: img.url
            });
        }
    }
    return result;
}

async function populatePage(token){
    const artists = await fetchArtists(token);
    let doc;
    console.log(artists);
    for(const key in artists){
        const artist = artists[key];
        const html = await fetch("http://localhost:3000/concerts", {
            method: "POST", body: JSON.stringify(artist)})
            .then(response => 
                doc = response.text())
            .then(html =>
                doc =  html) 
            .catch(error => console.error(error));
            
        const div = document.getElementsByClassName("artists-concerts")[0]
        div.insertAdjacentHTML("beforeend", doc);
    }
    
}