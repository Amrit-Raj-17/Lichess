const fs = require("fs");

const USERNAMES = [
    "Heal_Potion",
    "blitz_slayer",
    "power_factor",
    "satrit",
    "penguin_d4c4"
];

function loadExistingData() {
    if (!fs.existsSync("data/data.js")) {
        return {};
    }

    try {
        const txt = fs.readFileSync("data/data.js", "utf8");

        const jsonText = txt
            .replace(/^const data = /, "")
            .replace(/;$/, "");

        return JSON.parse(jsonText);
    } catch (err) {
        console.error("Failed to load existing data.js");
        return {};
    }
}

async function fetchLatestGames(USERNAME) {
    const allGames = [];

    const url =
        `https://lichess.org/api/games/user/${USERNAME}?max=200`;

    const res = await fetch(url, {
        headers: {
            Accept: "application/x-ndjson"
        }
    });

    const text = await res.text();

    const lines = text
        .split("\n")
        .filter(line => line.trim());

    for (const line of lines) {
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
            ) {
                result = "win";
            } else {
                result = "loss";
            }
        }

        let clock = "correspondence";

        if (g.clock) {
            const mins = g.clock.initial / 60;
            const inc = g.clock.increment;

            const minsStr = Number.isInteger(mins)
                ? mins
                : mins.toFixed(1);

            clock = `${minsStr}+${inc}`;
        } else if (
            g.speed === "correspondence" &&
            g.daysPerTurn
        ) {
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
            oppN: opponent?.user?.name || "Unknown",
            oppR: opponent?.rating || "Unknown",
            type: g.perf,
            clock
        });
    }

    console.log(
        `Fetched ${allGames.length} recent games for ${USERNAME}`
    );

    return allGames;
}

async function main() {
    const existingData = loadExistingData();

    const data = {};

    for (const USERNAME of USERNAMES) {
        const latestGames = await fetchLatestGames(USERNAME);

        const existingGames =
            existingData?.[USERNAME]?.games || [];

        const gameMap = new Map();

        for (const game of existingGames) {
            gameMap.set(game.id, game);
        }

        for (const game of latestGames) {
            gameMap.set(game.id, game);
        }

        const mergedGames = [...gameMap.values()]
            .sort((a, b) => b.timestamp - a.timestamp);

        console.log(
            `${USERNAME}: ${existingGames.length} old + ${latestGames.length} fetched => ${mergedGames.length} total`
        );

        data[USERNAME] = {
            lastUpdated: Date.now(),
            games: mergedGames
        };
    }

    fs.writeFileSync(
        "data/data.js",
        `const data = ${JSON.stringify(data, null, 2)};`
    );

    console.log("data/data.js updated");
}

main().catch(console.error);