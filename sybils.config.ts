export default {
  storage: {
    fileName: 'database.xlsx',
    sheetNames: ['Sheet3', 'Sheet4'],
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
