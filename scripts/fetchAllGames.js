const fs = require("fs");

const USERNAME = "Heal_Potion";

async function fetchAllGames() {
    let allGames = [];
    let until = Date.now();

    while (true) {
        const url = `https://lichess.org/api/games/user/${USERNAME}?max=300&until=${until}`;

        const res = await fetch(url, {
            headers: {
                "Accept": "application/x-ndjson"
            }
        });

        const text = await res.text();
        const lines = text.split("\n").filter(l => l.trim());

        if (lines.length === 0) break;

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

            allGames.push({
                id: g.id,
                rating: player.rating,
                result,
                color,
                timestamp: g.createdAt,
                opening: g.opening?.name || "Unknown"
            });
        }

        until = allGames[allGames.length - 1].timestamp;

        console.log(`Fetched: ${allGames.length}`);

        if (lines.length < 300) break;
    }

    const data = {
        lastUpdated: Date.now(),
        games: allGames
    };

    fs.writeFileSync("data/data.json", JSON.stringify(data, null, 2));
}

fetchAllGames();
