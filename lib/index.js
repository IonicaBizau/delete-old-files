"use strict";

const fs = require("fs");
const path = require("path");
const deffy = require("deffy");

/**
 * deleteOldFiles
 * Deletes the old files in the specified directories.
 * 
 * @name deleteOldFiles
 * @function
 * @param {Object} options The options object containing:
 *
 *     - `directoryPaths` (Array): An array of directory paths to scan for old files. Default is `[]`.
 *     - `age` (Number): The age in seconds that a file must be older than to be deleted. Default is `604800` (7 days).
 *     - `checkInterval` (Number): The interval in seconds to check for old files. Default is `86400` (1 day). Set to `0` to disable periodic checks.
 *     - `recursive` (Boolean): Whether to scan directories recursively. Default is `false`.
 *     - `exclude` (Array): An array of file names or regex patterns to exclude from deletion. Default is `[]`.
 *     - `include` (Array): An array of file names or regex patterns to include for deletion. If empty, all files are included unless excluded. Default is `[]`.
 *     - `verbose` (Boolean): Whether to log detailed information about the process. Default is `false`.
 *     - `dryRun` (Boolean): If `true`, files will not be deleted, but actions will be logged. Default is `false`.
 *     - `onError` (Function): A callback function that is called when an error occurs. Receives the error as an argument.
 *     - `onDelete` (Function): A callback function that is called when a file is deleted. Receives the file path as an argument.
 */
function deleteOldFiles(options = {}) {
    options = deffy(options, {})
    options.directoryPaths = deffy(options.directoryPaths, []);
    options.age = deffy(options.age, 86400 * 7); // 7 days
    options.checkInterval = deffy(options.checkInterval, 86400); // seconds (1 day)
    options.recursive = deffy(options.recursive, false);
    options.exclude = deffy(options.exclude, []);
    options.include = deffy(options.include, []);
    options.verbose = deffy(options.verbose, false);
    options.dryRun = deffy(options.dryRun, false);

    if (typeof options.onError !== "function") {
        options.onError = () => {}
    }
    if (typeof options.onDelete !== "function") {
        options.onDelete = () => {}
    }

    if (!options.directoryPaths.length) {
        return;
    }

    if (options.age < 0) {
        throw new Error("The age option must be a positive number.");
    }

    const run = () => {
        try {
            deleteOldFiles.run(options)
        } catch (err) {
            options.onError(err)
        }
    }

    if (options.checkInterval > 0) {
        setInterval(run, options.checkInterval * 1000)
    }

    run()
}

deleteOldFiles.matches = (filePath, { include = [], exclude = [] } = {}) => {
    if (!include.length && !exclude.length) { return true }
    let included = !include.length;
    const baseName = path.basename(filePath);
    const matches = pattern => pattern instanceof RegExp
        ? pattern.test(filePath)
        : pattern === baseName

    for (const pattern of include) {
        if (matches(pattern)) {
            included = true;
            break;
        }
    }

    if (!included) { return false }

    for (const pattern of exclude) {
        if (matches(pattern)) {
            return false;
        }
    }

    return true;
}

deleteOldFiles.run = async options => {
    const processDirectory = async directoryPath => {
        if (options.verbose) {
            console.log(`[delete-old-files] Processing directory: ${directoryPath}`);
        }
        const files = await fs.promises.readdir(directoryPath);
        const now = Date.now();

        for (const file of files) {
            const filePath = path.join(directoryPath, file);
            let stats;
            try {
                stats = await fs.promises.stat(filePath);
            } catch (err) {
                options.onError(err);
                continue;
            }

            if (stats.isDirectory()) {
                if (options.recursive) {
                    await processDirectory(filePath);
                }
                continue;
            }

            const fileAge = Math.floor((now - stats.mtimeMs) / 1000); // in seconds

            const deleteFilters = {
                age: fileAge > options.age,
                matches: deleteOldFiles.matches(filePath, options)
            }

            const shouldDelete = deleteFilters.age && deleteFilters.matches;

            if (shouldDelete) {
                if (options.dryRun) {
                    if (options.verbose) {
                        console.log(`[delete-old-files] (dry run) Would delete file: ${filePath} (${fileAge}s > ${options.age}s)`);
                    }
                } else {
                    try {
                        await fs.promises.unlink(filePath);
                        if (options.verbose) {
                            console.log(`[delete-old-files] Deleted file: ${filePath} (${fileAge}s > ${options.age}s)`);
                        }
                        options.onDelete(filePath);
                    } catch (err) {
                        options.onError(err);
                    }
                }
            } else {
                if (options.verbose) {
                    console.log(`[delete-old-files] Keeping file: ${filePath} - ${!deleteFilters.matches ? "not matched" : `age (${fileAge}s <= ${options.age}s)`}`);
                }
            }
        }

        if (options.verbose) {
            const finishedAt = new Date()
            const diff = finishedAt - now
            console.log(`[delete-old-files] Finished processing directory: ${directoryPath} in ${diff}ms`);
        }
    }

    for (const directoryPath of options.directoryPaths) {
        try {
            await processDirectory(directoryPath)
        } catch (err) {
            options.onError(err)
        }
    }
}

module.exports = deleteOldFiles;
