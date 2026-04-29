const fs = require("fs");

const USERNAMES = ["Heal_Potion", "blitz_slayer", "power_factor", "satrit", "penguin_d4c4"];

async function fetchAllGames(USERNAME) {
    let allGames = [];
    const url = `https://lichess.org/api/games/user/${USERNAME}`;

    const res = await fetch(url, {
        headers: {
            "Accept": "application/x-ndjson"
        }
    });

    const text = await res.text();
    const lines = text.split("\n").filter(l => l.trim());

    for (let line of lines) {
        const g = JSON.parse(line);

        const white = g.players.white?.user?.name;
        const black = g.players.black?.user?.name;

        let player = null;
        let opponent = null;
        let color = null;

        if (white === USERNAME) {
            player = g.players.white;
            opponent = g.players.black;
            color = "white";
        } else if (black === USERNAME) {
            player = g.players.black;
            opponent = g.players.white;
            color = "black";
        }

        if (!player) continue;

        let result = "draw";
        if (g.winner) {
            if (
                (g.winner === "white" && color === "white") ||
                (g.winner === "black" && color === "black")
            ) result = "win";
            else result = "loss";
        }

        let clock = "correspondence";
        if (g.clock) {
            const mins = g.clock.initial / 60;
            const inc = g.clock.increment;
            const minsStr = Number.isInteger(mins) ? mins : mins.toFixed(1);
            clock = `${minsStr}+${inc}`;
        } else if (g.speed === "correspondence" && g.daysPerTurn) {
            clock = `${g.daysPerTurn}d/move`;
        }

        allGames.push({
            id: g.id,
            rating: player.rating,
            ratingDiff: player.ratingDiff,
            result,
            rated: g.rated,
            status: g.status,
            color,
            moves: g.moves,
            timestamp: g.createdAt,
            oppN: opponent?.user?.name || 'Unknown',
            oppR: opponent?.rating || 'Unknown',
            type: g.perf,
            clock,
        });
    }

    console.log(`Fetched ${allGames.length} games data for ${USERNAME}`);
    return allGames;
}

async function main() {
    const data = {};
    for(const USERNAME of USERNAMES) {
        const games = await fetchAllGames(USERNAME);

        data[USERNAME] = {
            lastUpdated: Date.now(),
            games
        };
    }
    var output = `const data = ${JSON.stringify(data, null, 2)};`;
    fs.writeFileSync("data/data.js", output);
}

main();
