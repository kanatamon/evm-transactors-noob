# EVM Transactors

Simple transactor script aim to manage contact interaction for multiple account.

## Install

```bash
npm install
```

## Initialize Database

> Perquisites: Make sure you have the file `database.xlsx`

```bash
npm run db:init
```

## Generate Prisma Client

```bash
npm run db:ts
```

## Config job

```ts
// sybils.config.ts

export default {
  storage: {
    fileName: 'database.xlsx',
    sheetNames: ['Sheet3', 'Sheet4'],
  },
  jobs: [
    {
      name: 'supplyMaticOnAave',
      args: ['0.0000001'], // amount $MATIC to supply
    },
    {
      name: 'supplyEthOnCompound',
      args: ['0.0000001'], // amount $ETH to supply
    },
  ],
};
```

## To run

```bash
npm start
```

## View log

```bash
npm run db:viewer

// Go to http://localhost:5555
```

## Export PK from phrase

```bash
// npm run wallet:export "<phrase>" <total>
npm run wallet:export "test test test test test test test test test test test junk" 10
```
