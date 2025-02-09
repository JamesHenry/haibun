import { record } from "./recorder.js";

const url = process.argv[2];
if (!url) {
    console.error("Please provide a url to record");
    process.exit(1);
}

record(url, ['record']);
