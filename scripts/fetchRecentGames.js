const fs = require("fs");

const USERNAME = "Heal_Potion";
const DATA_PATH = "data/data.json";
const LIVE_PATH = "data/liveData.json";

async function fetchRecentGames() {
    // 🔹 Load existing full data
    let existing = { games: [] };

    if (fs.existsSync(DATA_PATH)) {
        existing = JSON.parse(fs.readFileSync(DATA_PATH, "utf-8"));
    }

    // 🔥 Get LAST GAME timestamp (NOT lastUpdated)
    const lastGameTimestamp = existing.games.length > 0
        ? Math.max(...existing.games.map(g => g.timestamp))
        : 0;

    console.log("Last game timestamp:", lastGameTimestamp);

    // 🔹 Fetch new games
    const url = `https://lichess.org/api/games/user/${USERNAME}?since=${lastGameTimestamp}&max=300`;

    const res = await fetch(url, {
        headers: {
            "Accept": "application/x-ndjson"
        }
    });

    const text = await res.text();
    const lines = text.split("\n").filter(l => l.trim());

    if (lines.length === 0) {
        console.log("No new games found.");
        return; // ✅ DON'T overwrite existing file
    }

    let newGames = [];

    for (let line of lines) {
        const g = JSON.parse(line);

        const white = g.players.white?.user?.name;
        const black = g.players.black?.user?.name;

        let player = null;
        let color = null;

        if (white === USERNAME) {
            player = g.players.white;
            color = "white";
        } else if (black === USERNAME) {
            player = g.players.black;
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

        newGames.push({
            id: g.id,
            rating: player.rating,
            result,
            color,
            timestamp: g.createdAt,
            opening: g.opening?.name || "Unknown"
        });
    }

    // 🔹 Load existing live data (if exists)
    let liveData = { games: [] };

    if (fs.existsSync(LIVE_PATH)) {
        liveData = JSON.parse(fs.readFileSync(LIVE_PATH, "utf-8"));
    }

    // 🔥 Merge + Deduplicate
    const map = new Map();

    [...liveData.games, ...newGames].forEach(g => {
        map.set(g.id, g);
    });

    const mergedGames = Array.from(map.values())
        .sort((a, b) => a.timestamp - b.timestamp);

    // 🔹 Save updated live data
    fs.writeFileSync(
        LIVE_PATH,
        JSON.stringify({
            lastUpdated: Date.now(),
            games: mergedGames
        }, null, 2)
    );

    console.log(`Added ${newGames.length} new games. Total live: ${mergedGames.length}`);
}

fetchRecentGames();
