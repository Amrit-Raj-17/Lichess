const fs = require("fs");

const USERNAME = "Heal_Potion";

async function fetchRecentGames() {
    const existing = JSON.parse(fs.readFileSync("data/data.json", "utf-8"));
    const lastUpdated = existing.lastUpdated;

    const url = `https://lichess.org/api/games/user/${USERNAME}?since=${lastUpdated}&max=300`;

    const res = await fetch(url, {
        headers: {
            "Accept": "application/x-ndjson"
        }
    });

    const text = await res.text();
    const lines = text.split("\n").filter(l => l.trim());

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

    fs.writeFileSync(
        "data/liveData.json",
        JSON.stringify({
            lastUpdated: Date.now(),
            games: newGames
        }, null, 2)
    );

    console.log(`New games: ${newGames.length}`);
}

fetchRecentGames();
