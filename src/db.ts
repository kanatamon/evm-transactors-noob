import xlsx from 'xlsx';

type Sheet = {
  pk: string;
  address: string;
  sheetName: string;
};

export function getDocs(filename: string): Sheet[] {
  const workbook = xlsx.readFile(filename);
  const docs: Sheet[] = [];

  workbook.SheetNames.forEach((sheetName) => {
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json<string[]>(worksheet, { header: 1 });

    // Skip the header row and process each row
    data.slice(1).forEach((row) => {
      const [pk, address] = row;
      if (pk && address) {
        docs.push({ pk, address, sheetName });
      }
    });
  });

  return docs;
}
