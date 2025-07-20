export const streamFileToChunks = async (file: File): Promise<Uint8Array[]> => {
  const chunks: Uint8Array[] = [];
  const chunkSize = 1024 * 1024; // 1MB chunks
  
  for (let start = 0; start < file.size; start += chunkSize) {
    const end = Math.min(start + chunkSize, file.size);
    const chunk = file.slice(start, end);
    const arrayBuffer = await chunk.arrayBuffer();
    chunks.push(new Uint8Array(arrayBuffer));
  }
  
  return chunks;
};