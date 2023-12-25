# Nostr Relay

This project contains the source code for the Nostr Relay, fork of the Minds Relay.

## Implemented NIPs

Nostr defines several "NIPs", or **Nostr Implementation Possibilities**, that define expected behavior for both clients and relays. 

These are the NIPs that are currently implemented by this relay:

✅ - Implemented
🚧 - In Progress / Partially Implemented
❌ - Not (Yet) Implemented

| NIP      | Status |
| -------- | ------ |
| NIP-01   | ✅     |
| NIP-02   | ❌     |
| NIP-03   | ❌     |
| NIP-04   | ❌     |
| NIP-05   | 🚧     |
| NIP-06   | ❌     |
| NIP-07   | ❌     |
| NIP-08   | ✅     |
| NIP-09   | ✅     |
| NIP-10   | ✅     |
| NIP-11   | ❌     |
| NIP-12   | ❌     |
| NIP-13   | ❌     |
| NIP-14   | ❌     |
| NIP-15   | ❌     |
| NIP-16   | ❌     |
| NIP-26   | 🚧     |

## Getting Started

### Run the project

This project is built with [Node.js](https://nodejs.org/), and uses `npm` for dependency mangement.

You can install the project dependencies and start locally with:

```bash
cp .env.example .env
npm i
npm run dev
```

### Execute Tests

We have unit tests witten with [Jest](https://jestjs.io/). You can run the tests with this command:

```bash
npm test
```

### Local K3s

In order for testing the Kubernetes infrastructure included in this project, you can deploy to a local K3s cluster with [k3d](https://k3d.io/) and [Skaffold](https://skaffold.dev/).

If you are using Homebrew, you can install these packages:

```bash
brew install skaffold k3d
```

In order for `k3d` to function, you wil also need to have [Docker](https://docs.docker.com/get-docker/) installed.

Once the required dependencies are installed, you can start a `k3d` cluster with:

```bash
npm run k3d:up
```

and then deploy to your local cluster using Skaffold with:

```bash
npm run k3d:dev
```

Skaffold will automate the process of building an image using the `Dockerfile` specified in this repo and deploying to the `k3d` cluster whenever a change is made to the code.

#### Helm Tests

Along with unit tests, we also have integration tests that are deployed as [Helm chart tests](https://helm.sh/docs/topics/chart_tests/).

After deploying the Helm chart to `k3s`, you can run the integration tests with:

```bash
helm test nostr-relay
```

## Requesting a Nostr Event

Currently only requesting specific events by the unique hash is supported. One simple way to test this is by using the [noscl](https://github.com/fiatjaf/noscl) command line client for Nostr (this is the tool used in the integration tests).

For example:

```bash
noscl relay add ws://localhost:8000/nostr/v1/ws # Default K3s Ingress port used when running k3d:up

noscl event <event_hash>
```