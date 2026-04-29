const fs = require('fs');

const USERNAMES = ["Heal_Potion", "blitz_slayer", "power_factor", "satrit", "penguin_d4c4"];

async function fetchProfileInfo(USERNAME) {
    const url = `https://lichess.org/api/user/${USERNAME}`;

    const res = await fetch(url, {
        headers: {
            "Accept": "application/json"
        }
    });

    console.log(`Fetched profile for ${USERNAME}`);

    return await res.json();
}

async function main() {
    const profiles = {};
    for(const USERNAME of USERNAMES) {
        const profile = await fetchProfileInfo(USERNAME);

        profiles[USERNAME] = {
            lastUpdated: Date.now(),
            profile
        };

    }
    var output = `const profiles = ${JSON.stringify(profiles, null, 2)};`;
    fs.writeFileSync("data/profiles.js", output);
}

main();