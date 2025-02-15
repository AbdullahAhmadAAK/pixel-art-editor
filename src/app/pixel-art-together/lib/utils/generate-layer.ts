export function generateLayer({
  layer,
  cols,
  rows,
  defaultValue,
}: {
  layer: number;
  cols: number;
  rows: number;
  defaultValue: string;
}): { [key: string]: string } { // Define the return type here
  const storage: { [key: string]: string } = {}; // Correct the type of storage
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      storage[`${layer}_${row}_${col}`] = defaultValue;
    }
  }
  return storage;
}