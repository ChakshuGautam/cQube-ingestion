const { NodeTracerProvider } = require('@opentelemetry/node');
const { ConsoleSpanExporter, SimpleSpanProcessor } = require('@opentelemetry/tracing');

// Create an instance of the tracer provider
const tracerProvider = new NodeTracerProvider();

// Configure the tracer provider with a span exporter
tracerProvider.addSpanProcessor(new SimpleSpanProcessor(new ConsoleSpanExporter()));

// Register the tracer provider
tracerProvider.register();
