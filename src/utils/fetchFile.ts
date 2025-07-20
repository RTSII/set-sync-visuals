export async function streamFileToChunks(file: File, chunkSize = 1024 * 1024): Promise<Uint8Array[]> { // 1MB chunks
  const chunks: Uint8Array[] = [];
  const stream = file.stream();
  const reader = stream.getReader();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }

  return chunks;
}
