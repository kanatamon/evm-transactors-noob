export default {
  storage: {
    fileName: 'database.xlsx',
    sheetNames: ['Sheet2'],
  },
  jobs: [
    {
      name: 'supplyMaticOnAave',
      args: ['0.0000001'],
    },
    {
      name: 'supplyEthOnCompound',
      args: ['0.0000001'],
    },
  ],
};
