const fs = require("fs");

const USERNAME = "Heal_Potion";

async function fetchProfileInfo() {
    const url = `https://lichess.org/api/user/${USERNAME}`;

    const res = await fetch(url, {
        headers: {
            "Accept": "application/json"
        }
    });

    return await res.json();
}

async function fetchAllGames() {
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
            result,
            rated: g.rated,
            color,
            moves: g.moves,
            timestamp: g.createdAt,
            oppN: opponent?.user?.name || 'Unknown',
            oppR: opponent?.rating || 'Unknown',
            type: g.perf,
            clock,
        });
    }

    console.log(`Fetched: ${allGames.length}`);
    return allGames;
}

async function main() {
    const [profile, games] = await Promise.all([
        fetchProfileInfo(),
        fetchAllGames()
    ]);

    const output = `
        const profile = ${JSON.stringify({
                lastUpdated: Date.now(),
                profile
            }, null, 2)};

        const data = ${JSON.stringify({
                lastUpdated: Date.now(),
                games
            }, null, 2)};
    `;

    fs.writeFileSync("data/data.js", output);
}

main();