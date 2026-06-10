# LaunchMyNFT

`LaunchMyNFT` is an archived TypeScript/Solana script for interacting with old LaunchMyNFT candy machine contracts.

The project was created to automate repetitive minting actions for LaunchMyNFT drops. Instead of manually preparing transactions in a wallet UI, the script reads a candy machine account, detects the supported candy machine version, builds the required mint instruction, waits for the selected sale phase, and sends multiple mint transactions from one or more payer wallets.

> Important: this project was used a long time ago and is no longer expected to work as-is. It depends on old LaunchMyNFT program behavior, old candy machine account layouts, hardcoded program addresses, hardcoded lookup table/name bank accounts, and an old Solana RPC setup. It should be treated as an archive of the original automation logic, not as a current minting tool.

## How It Works

The main entry point is `Main.ts`.

At a high level, the script performs the following flow:

1. Connects to a configured Solana RPC endpoint.
2. Loads a LaunchMyNFT candy machine account from chain.
3. Decodes the account data and detects the candy machine version.
4. Finds the requested sale phase by name, for example `Public`.
5. Waits until the sale phase start time is reached.
6. Builds a mint transaction with compute budget settings.
7. Sends repeated mint transactions with a configurable delay.
8. Runs the mint task concurrently for multiple payer wallets.

The script supports different paths for regular and compressed candy machines:

- regular candy machines use `GetMintInstruction` from `Instructions/Mint.ts`;
- compressed candy machines use `GetMintCompressedInstruction` and additional accounts such as the Merkle tree, Bubblegum signer, tree authority, and lookup table.

## Project Structure

```text
LaunchMyNFT/
├── Accounts/
│   └── CandyMachines/
├── Instructions/
│   └── Mint.ts
├── Types/
├── Utils/
│   └── CandyMachine.ts
├── Constants.ts
├── LaunchMyNFT_IDL.json
├── Main.ts
├── package.json
└── tsconfig.json
```

### `Main.ts`

Contains the main runtime logic:

- Solana RPC connection setup.
- Metaplex client initialization.
- PDA helpers for total mint tracking.
- optional address lookup table creation helper.
- candy machine loading and decoding.
- sale phase selection.
- transaction building and sending.
- concurrent mint tasks for multiple payer keypairs.

The current file contains placeholder private keys and a hardcoded candy machine address.

### `Instructions/Mint.ts`

Builds LaunchMyNFT mint instructions manually.

It prepares account metas, derives Metaplex metadata PDAs, encodes instruction data with Borsh, and chooses the correct instruction discriminator for supported mint paths.

### `Utils/CandyMachine.ts`

Detects the candy machine version by comparing the account discriminator and decodes the account data with the matching layout.

The code explicitly supports:

- `V5`
- `V6`
- `Compressed`

Older versions `V2`, `V3`, and `V4` are recognized but marked as unsupported.

### `Constants.ts`

Stores program IDs and fixed accounts used by the mint instructions, including LaunchMyNFT program IDs, token programs, metadata program, Bubblegum, compression, Merkle tree, and other Solana system accounts.

## Required Data

For the original historical run, the script required:

- A working Solana RPC endpoint.
- A LaunchMyNFT candy machine address.
- One or more funded Solana payer keypairs.
- The target sale phase name, for example `Public`.
- Compute unit limit and priority fee settings.
- Transaction count and delay settings.
- For compressed mints, the correct compressed mint accounts, such as name bank, Merkle tree, lookup table, and related Bubblegum accounts.

The main configuration is currently hardcoded near the bottom of `Main.ts`:

```ts
const CandyMachineAddress = new solanaWeb3.PublicKey("...");

const Payers = [
    solanaWeb3.Keypair.fromSecretKey(Uint8Array.from(bs58.decode("PRIVATE-KEY"))),
];
```

The mint task parameters are also hardcoded:

```ts
MintTask(
    CandyMachineAddress,
    "Public",
    1_000_000,
    200_000,
    25,
    200,
    Payer
)
```

These values represent:

- candy machine address;
- sale phase name;
- compute unit limit;
- compute unit price in micro-lamports;
- delay between transactions in milliseconds;
- number of transactions to send;
- payer keypair.

## Dependencies

The repository includes a minimal `package.json`, but it does not fully list every package imported by the TypeScript files. The historical dependency set included packages like:

```bash
npm install @solana/web3.js @metaplex-foundation/js @project-serum/anchor @project-serum/borsh @solana/spl-token @metaplex-foundation/mpl-bubblegum bn.js
```

For direct TypeScript execution, a runner such as `ts-node` would also be needed:

```bash
npm install --save-dev typescript ts-node
```

## Running

There is no npm script defined in `package.json`.

Historically, after installing dependencies and replacing placeholders in `Main.ts`, the script could be run with a TypeScript runner:

```bash
npx ts-node Main.ts
```

Alternatively, it could be compiled with TypeScript and then run with Node.js, depending on the local setup.

Before attempting any historical run, these values had to be reviewed and replaced:

- RPC endpoint in `Main.ts`.
- `CandyMachineAddress`.
- payer private keys.
- sale phase name.
- compute budget settings.
- transaction count and delay.
- compressed mint constants in `Constants.ts`, if minting a compressed collection.

## Why It No Longer Works

This repository is very likely outdated because it was written for a specific LaunchMyNFT/Solana environment at the time it was used. It may fail now because:

- LaunchMyNFT programs or candy machine layouts may have changed.
- The hardcoded RPC endpoint may be unavailable.
- The hardcoded candy machine, name bank, Merkle tree, and lookup table accounts may no longer be valid.
- The sale phase data for the original drop is no longer relevant.
- The compressed NFT flow may require different Bubblegum/compression accounts today.
- Solana transaction rules, priority fee behavior, and RPC limits may have changed.
- Some imported dependencies are missing from the current `package.json`.
- The script contains placeholder private keys and is not configured for a fresh environment.

This README documents what the project used to do and how it was structured. It should not be treated as a maintained or safe-to-run minting bot.

## Security Notes

The script works with private Solana keypairs. Never commit real private keys to a repository and never share them with third parties.

If this project is kept for archival purposes, keep the key fields as placeholders and avoid storing active wallet credentials in `Main.ts`.
