# Implementing Winston Logger to Store Logs in a File

## Description

The Winston logger is a popular logging library that can be used to log messages to a variety of destinations, including files, consoles, and databases. Here , we need to implement the Winston logger to store logs in a file rather than printing all the verbose onto the console .

## Goals

The goal to achieve is :

* Implement the Winston logger in a Node.js application.
* Store logs in a file.
* Use the desired log format.

## Implementation

The following code shows the implementation of the Winston logger in the cqube codebase to store logs in a file:

```ts
import winston from 'winston';

imports: [
      ConfigModule.forRoot({
        isGlobal: true,
      }),
      WinstonModule.forRoot({
        level: 'silly', 
        format: winston.format.simple(), 
        transports: [
            new winston.transports.File({ filename: 'logfile.log' }) 
        ]
    })
    ],
```


This code creates a new Winston logger with the `silly` level. The `format` property is set to the `winston.format.simple()` function, which will format the log messages in a simple format. The `transports` property is an array of Winston transports. In this case, we are using the `winston.transports.File` transport to store the log messages in a file called `logfile.log`.

## Test Cases

The following test cases can be used to test the Winston logger implementation:

* Create a new file called `logfile.log`.
* Run the ingest and ingest-data commands.
* Verify that the log messages are being written to the `logfile.log` file.

## Conclusion

The Winston logger is a powerful logging library that can be used to log messages to a variety of destinations. In this ticket, we implemented the Winston logger in the cqube backend codebase to store logs in a file instead of printing onto the console . 
