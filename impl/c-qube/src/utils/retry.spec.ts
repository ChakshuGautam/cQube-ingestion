import { Test, TestingModule } from '@nestjs/testing';
import { retryPromiseWithDelay, waitFor } from './retry';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const retry = require('retry');

jest.mock('fs', () => ({
  writeFile: jest.fn((filename, data, options, callback) => {
    callback(null); // Simulate successful file writing
  }),
}));

describe('CsvAdapterService', () => {
  it('should retry an async await method', async () => {
    function waitFor(millSeconds) {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          resolve('');
        }, millSeconds);
      });
    }
    async function retryPromiseWithDelay(promise, nthTry, delayTime) {
      try {
        const res = await promise;
        return res;
      } catch (e) {
        if (nthTry === 1) {
          return Promise.reject(e);
        }
        // console.log('retrying', nthTry, 'time');
        // wait for delayTime amount of time before calling this method again
        await waitFor(delayTime);
        return retryPromiseWithDelay(promise, nthTry - 1, delayTime);
      }
    }
    async function test(shouldSucceed: boolean): Promise<string> {
      return new Promise((resolve, reject) => {
        if (shouldSucceed) resolve('success');
        else throw 'error from test';
      });
    }

    const response = await retryPromiseWithDelay(test(true), 3, 1000);
    const responseWithError = await retryPromiseWithDelay(test(false), 3, 1000)
      .then((res) => {
        console.log('Done with error', res);
      })
      .catch((e) => e);

    expect(response).toBe('success');
    expect(responseWithError).toBe('error from test');
  });

  it('should resolve the promise after the specified number of milliseconds', async () => {
    const millSecondsToWait = 1000;
    const startTime = new Date().getTime();
    await waitFor(millSecondsToWait);
    const endTime = new Date().getTime();
    const timeDifference = endTime - startTime;
    const deviation = 100; 

    expect(timeDifference).toBeGreaterThanOrEqual(millSecondsToWait - deviation);
    expect(timeDifference).toBeLessThanOrEqual(millSecondsToWait + deviation);
  });

});
