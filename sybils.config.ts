export default {
  storage: {
    fileName: 'sybils.xlsx',
    sheetNames: ['Sheet1', 'Sheet2'],
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
