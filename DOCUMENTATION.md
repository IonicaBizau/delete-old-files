## Documentation

You can see below the API reference of this module.

### `deleteOldFiles(options)`
Deletes the old files in the specified directories.

#### Params

- **Object** `options`: The options object containing:
    - `directoryPaths` (Array): An array of directory paths to scan for old files. Default is `[]`.
    - `age` (Number): The age in seconds that a file must be older than to be deleted. Default is `604800` (7 days).
    - `checkInterval` (Number): The interval in seconds to check for old files. Default is `86400` (1 day). Set to `0` to disable periodic checks.
    - `recursive` (Boolean): Whether to scan directories recursively. Default is `false`.
    - `exclude` (Array): An array of file names or regex patterns to exclude from deletion. Default is `[]`.
    - `include` (Array): An array of file names or regex patterns to include for deletion. If empty, all files are included unless excluded. Default is `[]`.
    - `verbose` (Boolean): Whether to log detailed information about the process. Default is `false`.
    - `dryRun` (Boolean): If `true`, files will not be deleted, but actions will be logged. Default is `false`.
    - `onError` (Function): A callback function that is called when an error occurs. Receives the error as an argument.
    - `onDelete` (Function): A callback function that is called when a file is deleted. Receives the file path as an argument.

