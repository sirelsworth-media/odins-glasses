const fs = require("fs");
const https = require("https");
const path = require("path");

const listPath = path.join(__dirname, "next50-monsters.json");
const outputDirectory = path.join(process.env.TEMP, "odins-glasses-reference-next50");
const monsters = JSON.parse(fs.readFileSync(listPath, "utf8").replace(/^\uFEFF/, ""));
const agent = new https.Agent({ rejectUnauthorized: false });

fs.mkdirSync(outputDirectory, { recursive: true });

function download(monster, url, redirects = 0) {
  return new Promise((resolve) => {
    https
      .get(url, { agent }, (response) => {
        if (
          response.statusCode >= 300 &&
          response.statusCode < 400 &&
          response.headers.location &&
          redirects < 5
        ) {
          response.resume();
          resolve(download(monster, new URL(response.headers.location, url).href, redirects + 1));
          return;
        }

        const outputPath = path.join(outputDirectory, `${monster.id}.gif`);
        const output = fs.createWriteStream(outputPath);
        response.pipe(output);
        output.on("finish", () =>
          output.close(() => resolve({ id: monster.id, status: response.statusCode })),
        );
      })
      .on("error", (error) => resolve({ id: monster.id, error: error.message }));
  });
}

Promise.all(
  monsters.map((monster) =>
    download(
      monster,
      `https://rozerodb.com/assets/local/assets.twroz.wiki/images/monsters/${monster.id}.gif`,
    ),
  ),
).then((results) => {
  const failed = results.filter((result) => result.status !== 200);
  console.log(`downloaded=${results.length - failed.length} failed=${failed.length}`);
  if (failed.length) console.log(failed);
});
