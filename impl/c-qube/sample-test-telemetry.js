const api = require('@opentelemetry/api');
const { NodeTracerProvider }  = require('@opentelemetry/node');
const { ConsoleSpanExporter, SimpleSpanProcessor } = require('@opentelemetry/tracing');

// Create an instance of the tracer provider
const tracerProvider = new NodeTracerProvider();

// Configure the tracer provider with a span exporter
tracerProvider.addSpanProcessor(new SimpleSpanProcessor(new ConsoleSpanExporter()));

// Register the tracer provider
tracerProvider.register();

// Wrap your operations with a span
function performOperation() {
  const span = api.trace.getTracer('your-instrumentation-name').startSpan('operation-name');
  // ... your operation logic starts...
  sum = 0;
  for (i = 0; i < 10000; i++) {
    sum += i;
  }
  console.log(sum);
  // ... your operation logic ends...

  span.end(); // End the span when the operation completes
}

performOperation();
