# Update CLI to Add Progress Checker Bar

## Description

The CLI in cQube is used to ingest data. The current CLI does not provide a way to track the progress of data ingestion. This can be difficult for users to track the progress of the ingestion process and to identify any potential problems.

This change will update the CLI to add a new progression mapper that allows for sharing the progress of ingestion for every file and every row. This will provide users with a more detailed view of the ingestion process and will help to identify any potential problems early on.

## Goals

The goals of this change are to:

* Add a progress checker bar to the CLI to show the progress of data ingestion.
* Allow users to track the progress of data ingestion for every file and every row.
* Identify any potential problems early on in the ingestion process.

## Implementation

The following changes will be made to the CLI to implement this feature:

* A new progression mapper will be added.
* The progress checker bar will be updated to show the progress of data ingestion for every file and every row.
* The progress checker bar will be updated to identify any potential problems early on in the ingestion process.

## New Code

The following code shows the new code that is added to the CLI:

```js
import cliProgress from 'cli-progress';

const createProgressBar_withFileName = (barName, title, fileName = '') => {
  return new cliProgress.SingleBar({
    format: `CLI Progress |${colors.cyan('{bar}')}| {percentage}% || {value}/{total} Chunks || Title: ${title} | File: <span class="math-inline">\{fileName\}\`,
barCompleteChar\: \'\\u2588\',
barIncompleteChar\: \'\\u2591\',
hideCursor\: true,
clearOnComplete\: true,
\}\);
\};
const createProgressBar \= \(barName, title\) \=\> \{
return new cliProgress\.SingleBar\(\{
format\: \`CLI Progress \|</span>{colors.cyan('{bar}')}| {percentage}% || {value}/{total} Chunks || Title: ${title}`,
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591',
    hideCursor: true,
    clearOnComplete: true,
  });
};
```

This code defines two new functions, `createProgressBar_withFileName` and `createProgressBar`. These functions create new progress bars that can be used to track the progress of data ingestion. The `createProgressBar_withFileName` function also includes the file name of the dataset that is being ingested.

## Conclusion

The new code that has been added to the CLI will provide users with a more detailed view of the ingestion process. This will help to identify any potential problems early on and will make it easier for users to track the progress of data ingestion.
