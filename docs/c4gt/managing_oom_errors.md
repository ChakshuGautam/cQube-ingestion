# Manage OOM Errors when ingesting large files > 1 GB using streams

## Description

Incase of ingesting large csv files with size > 1GB , node runs out of memory and an error is thrown , which is as follows -

```typescript
<--- Last few GCs --->
[144950:0x594f3e0]
84427 ms: Mark-sweep (reduce) 2046.4 (2084.0)
-> 2045.3 (2081.8) MB, 776.9 / 0.0 ms (+ 77.3 ms in 29 steps since
start of marking, biggest step 4.2 ms, walltime since start of
marking 863 ms) (average mu = 0.321, current mu =
0.230)[144950:0x594f3e0]
85528 ms: Mark-sweep (reduce) 2046.4
(2081.8) -> 2044.8 (2081.8) MB, 1098.6 / 0.0 ms (average mu = 0.171,
current mu = 0.001) allocation failure; scavenge might not succeed
<--- JS stacktrace --->
FATAL ERROR: Ineffective mark-compacts near heap limit Allocation
failed - JavaScript heap out of memory
1: 0xb83f50 node::Abort() [/usr/bin/node]
2: 0xa94834 [/usr/bin/node]
3: 0xd647c0 v8::Utils::ReportOOMFailure(v8::internal::Isolate*, char
const*, bool) [/usr/bin/node]
4: 0xd64b67
v8::internal::V8::FatalProcessOutOfMemory(v8::internal::Isolate*,
char const*, bool) [/usr/bin/node]
5: 0xf42265 [/usr/bin/node]
6: 0xf43168
v8::internal::Heap::RecomputeLimits(v8::internal::GarbageCollector)
[/usr/bin/node]
7: 0xf53673 [/usr/bin/node]
8: 0xf544e8
Aborted (core dumped)
error Command failed with exit code 134.
info Visit https://yarnpkg.com/en/docs/cli/run for documentation
about this command.
```
The error is encountered due to your Node.js application running out of memory while processing large CSV files. In the current approach , all data is being loaded in the memory at once causing the error .

## Goals

The goal to achieve is :

* Better handling of large files (>1GB) during ingestion
* Avoiding the above mentioned error and proper ingestion

## Implementation

To address this issue, we're modifying the code to process the CSV file using `streams`, which will allow you to process the file in smaller chunks and avoid loading the entire file into memory.
The following is the updated code base to address the problem -

```typescript
export async function readCSV(filePath: string): Promise<string[][]> {
  return new Promise((resolve, reject) => {
    let rows: string[][] = [];
    const chunkSize = 100000; 

    fs1.createReadStream(filePath)
      .pipe(csv({ separator: ',', headers: false, quote: "'" }))
      .on('data', (data) => {
        rows.push(Object.values(data));

        if (rows.length >= chunkSize) {
          resolve(rows);
          rows = [];
        }
      })
      .on('end', () => {
        if (rows.length > 0) {
          resolve(rows);
        } else {
          reject(new Error('File is empty'));
        }
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}
```

In this , `createReadStream` is used . This code works by reading the CSV file in chunks of `chunkSize` rows at a time. This prevents the entire file from being loaded into memory at once, which can help to avoid OOM errors. The resolve() function is called when a chunk of rows has been read, and the reject() function is called if an error occurs.

## Conclusion

Here , the csv is parsed row by row and each row is added to an array.If the array has reached a certain size , which is the chunksize defined above , return the array. And if the end of the file is reached, return the array (even if it is not full). This way , OOM error is avoided .
