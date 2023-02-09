# Pipe

Pipes are pipelines which integrate `EventGrammar`'s , `Transformer`'s and `Dataset`'s together as a single automated workflow.

The `Pipe` type expects
- `event` : .
- `transformer` : .
- `dataset` : .

```ts
Pipe {
  event: EventGrammar;
  transformer: Transformer;
  dataset: DatasetGrammar;
}
```