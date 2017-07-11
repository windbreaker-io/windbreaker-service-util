# windbreaker-service-util

Shared utilities throughout [windbreaker](https://github.com/windbreaker-io)
services

## Installation

```bash
npm install windbreaker-io/windbreaker-service-util --save
```

## Running tests

To run the entire test suite:
```bash
npm test
```

To run only integration tests:
```bash
npm run test:integration
```

To run only unit tests:
```bash
npm run test:unit
```

For a faster feedback loop, you can run `sh` on the `test` container
and execute tests or other arbitrary commands from within the container.
```bash
docker-compose run test sh
```
