"use strict";

const deleteOldFiles = require("../lib");

const DIRECTORY_PATHS = [
    `${__dirname}/directory-to-keep-clean`
]

// Delete txt files older than 3 days
deleteOldFiles({
    directoryPaths: DIRECTORY_PATHS,
    age: 86400 * 3,       // 3 days
    checkInterval: 86400, // seconds (1 day)
    exclude: [
        ".gitignore",
        "keep.txt",
        "do-not-delete.txt",
        /\.md$/
    ],
    include: [
        /\.txt$/
    ],
    verbose: true,
    dryRun: true, // Set to true for testing
    onError: (err) => { console.error("Error occurred:", err); },
    onDelete: (filePath) => { console.log("Deleted file:", filePath); },
})
