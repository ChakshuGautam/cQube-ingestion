export async function waitFor(millSeconds) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve('');
    }, millSeconds);
  });
}
export async function retryPromiseWithDelay(promise, nthTry, delayTime) {
  try {
    const res = await promise;
    return res;
  } catch (e) {
    if (nthTry === 1) {
      return Promise.reject(e);
    }
    console.log('retrying', nthTry, 'time');
    await waitFor(delayTime); // wait for delayTime amount of time before calling this method again
    return retryPromiseWithDelay(promise, nthTry - 1, delayTime);
  }
}

//TODO: Make this work with reject
