# Run If Solar

Checks the output of your solar panels in Home Assistant and starts or stops an application based on it. Great if you want to run a resource intensive process when there's more renewable energy available. This is an experimental project.

## Requirements

- Home Assistant with a sensor that displays the power generated
- Node.js with native fetch (any recent version)

## Usage

1. Copy `.env.example` to `.env` and fill in the required values
2. Install dependencies with `npm install`
3. Run `index.mjs`
