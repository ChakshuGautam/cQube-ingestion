#### Transformer Grammar
tranformer is defined as the following: _t(event) => dataset_

Includes the following
- Event Schema it can act on
- Dataset Schema it outputs to
- Formula that allows 

A transformer is a [actor](https://en.wikipedia.org/wiki/Actor_model). A sample actor can be something like this in Javascript. Ideally this could be the same for any another actor models in another framework as well. Currently we are using [xstate](https://xstate.js.org/docs/) for this.

```js
    const transformer = {
        name: "transformer_name",
        event_schema: "es11",
        dataset_schema: "ds23",
        config: {
            spawn((callback, receive) => {
                // send to parent
                callback('SOME_EVENT');

                // receive from parent
                receive((event) => {
                // handle event
                });

                // disposal
                return () => {
                /* do cleanup here */
                };
            }),
        }
    }
```