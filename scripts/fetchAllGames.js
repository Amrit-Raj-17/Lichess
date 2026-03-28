const fs = require("fs");

const USERNAME = "Heal_Potion";

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

        allGames.push({
            id: g.id,
            rating: player.rating,
            result,
            color,
            timestamp: g.createdAt,
            opponent: opponent?.user?.name || 'Unknown',
            variant: g.speed,
        });
    }

    console.log(`Fetched: ${allGames.length}`);

    const data = {
        lastUpdated: Date.now(),
        games: allGames
    };

    fs.writeFileSync("data/data.js", "const data = " + JSON.stringify(data, null, 2) + ";");
}

fetchAllGames();
