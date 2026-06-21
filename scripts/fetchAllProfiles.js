const fs = require("fs");

const USERNAMES = [
    "Heal_Potion",
    "blitz_slayer",
    "power_factor",
    "satrit",
    "penguin_d4c4"
];

async function fetchProfileInfo(USERNAME) {
    const url = `https://lichess.org/api/user/${USERNAME}`;

    const res = await fetch(url, {
        headers: {
            Accept: "application/json"
        }
    });

    if (!res.ok) {
        throw new Error(
            `Failed to fetch ${USERNAME}: ${res.status}`
        );
    }

    console.log(`Fetched profile for ${USERNAME}`);

    return await res.json();
}

async function main() {
    const profiles = {};

    for (const USERNAME of USERNAMES) {
        try {
            const profile = await fetchProfileInfo(USERNAME);

            profiles[USERNAME] = {
                lastUpdated: Date.now(),
                profile
            };
        } catch (err) {
            console.error(
                `Error fetching ${USERNAME}:`,
                err.message
            );
        }
    }

    fs.writeFileSync(
        "data/profiles.js",
        `const profiles = ${JSON.stringify(profiles, null, 2)};`
    );

    console.log("data/profiles.js updated");
}

main().catch(console.error);