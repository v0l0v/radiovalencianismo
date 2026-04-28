const NodeID3 = require('node-id3');
const fs = require('fs');

const args = process.argv.slice(2);
if (args.length < 3) {
    console.error("Usage: node tagger.js <file_path> <artist> <title>");
    process.exit(1);
}

const filepath = args[0];
const artist = args[1];
const title = args[2];

if (!fs.existsSync(filepath)) {
    console.error(`Error: File not found - ${filepath}`);
    process.exit(1);
}

const tags = {
    artist: artist,
    title: title
};

const success = NodeID3.update(tags, filepath);

if (success === true) {
    console.log(`Success: Tagged '${filepath}' with Artist='${artist}' and Title='{title}'`);
} else {
    console.error(`Error: Failed to write tags to '${filepath}'`);
    process.exit(1);
}
