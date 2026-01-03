/**
 * Implementazione semplificata di Reed-Solomon encoding per scopi educativi
 * Mostra i concetti chiave: divisione dati, generazione parità, recovery
 */

export interface Chunk {
  id: number;
  data: string;
  isParity: boolean;
  isAvailable: boolean;
}

export interface MathStep {
  step: string;
  operation: string;
  values: { label: string; value: string | number; hex?: string }[];
  result: string | number;
  resultHex?: string;
}

export interface EncodingDetails {
  steps: MathStep[];
  bytes: number[][]; // bytes per ogni chunk
  parityCalculations: { [parityId: number]: MathStep[] };
}

/**
 * Converte una stringa in array di bytes
 */
export function stringToBytes(str: string): number[] {
  return Array.from(str).map(c => c.charCodeAt(0));
}

/**
 * Converte bytes in stringa esadecimale
 */
export function bytesToHex(bytes: number[]): string {
  return bytes.map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ');
}

/**
 * Divide i dati in chunks e genera chunks di parità
 * @param data - I dati originali da codificare
 * @param dataChunks - Numero di chunks di dati
 * @param parityChunks - Numero di chunks di parità (redundancy)
 */
export function encodeReedSolomon(
  data: string,
  dataChunks: number,
  parityChunks: number
): Chunk[] {
  const chunks: Chunk[] = [];
  
  // Dividi i dati in chunks
  const chunkSize = Math.ceil(data.length / dataChunks);
  
  for (let i = 0; i < dataChunks; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, data.length);
    const chunkData = data.slice(start, end);
    
    chunks.push({
      id: i,
      data: chunkData,
      isParity: false,
      isAvailable: true,
    });
  }
  
  // Genera chunks di parità usando XOR (semplificato per esempio educativo)
  // In un'implementazione reale, si userebbe algebra di Galois
  for (let i = 0; i < parityChunks; i++) {
    let parityData = '';
    const maxLen = Math.max(...chunks.filter(c => !c.isParity).map(c => c.data.length));
    
    for (let pos = 0; pos < maxLen; pos++) {
      let parityByte = 0;
      let count = 0;
      
      // Calcola parità XOR per ogni posizione
      for (const chunk of chunks.filter(c => !c.isParity)) {
        if (pos < chunk.data.length) {
          parityByte ^= chunk.data.charCodeAt(pos);
          count++;
        }
      }
      
      // Aggiungi un pattern basato sull'indice del chunk di parità
      parityByte ^= (i + 1) * 0x42;
      parityData += String.fromCharCode(parityByte);
    }
    
    chunks.push({
      id: dataChunks + i,
      data: parityData,
      isParity: true,
      isAvailable: true,
    });
  }
  
  return chunks;
}

/**
 * Ottiene i dettagli matematici dell'encoding
 */
export function getEncodingDetails(
  data: string,
  dataChunks: number,
  parityChunks: number
): EncodingDetails {
  const steps: MathStep[] = [];
  const bytes: number[][] = [];
  const parityCalculations: { [parityId: number]: MathStep[] } = {};
  
  // Dividi i dati
  const chunkSize = Math.ceil(data.length / dataChunks);
  const dataBytes: number[][] = [];
  
  for (let i = 0; i < dataChunks; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, data.length);
    const chunkData = data.slice(start, end);
    const chunkBytes = stringToBytes(chunkData);
    dataBytes.push(chunkBytes);
    bytes.push(chunkBytes);
    
    steps.push({
      step: `Dividi chunk ${i}`,
      operation: `Dati[${start}:${end}]`,
      values: [
        { label: 'Testo', value: chunkData },
        { label: 'Bytes', value: chunkBytes.join(', '), hex: bytesToHex(chunkBytes) }
      ],
      result: chunkBytes.length,
      resultHex: bytesToHex(chunkBytes)
    });
  }
  
  // Calcola parità
  const maxLen = Math.max(...dataBytes.map(b => b.length));
  
  for (let p = 0; p < parityChunks; p++) {
    const paritySteps: MathStep[] = [];
    const parityBytes: number[] = [];
    
    for (let pos = 0; pos < maxLen; pos++) {
      const values: { label: string; value: string | number; hex?: string }[] = [];
      let parityByte = 0;
      
      // Calcola XOR di tutti i chunks di dati a questa posizione
      for (let i = 0; i < dataChunks; i++) {
        if (pos < dataBytes[i].length) {
          const byte = dataBytes[i][pos];
          values.push({
            label: `Chunk ${i}[${pos}]`,
            value: byte,
            hex: byte.toString(16).padStart(2, '0').toUpperCase()
          });
          parityByte ^= byte;
        }
      }
      
      // Aggiungi pattern per distinguere i chunks di parità
      const pattern = (p + 1) * 0x42;
      parityByte ^= pattern;
      values.push({
        label: `Pattern P${p}`,
        value: pattern,
        hex: pattern.toString(16).padStart(2, '0').toUpperCase()
      });
      
      parityBytes.push(parityByte);
      
      paritySteps.push({
        step: `Calcola Parità P${p} byte ${pos}`,
        operation: `XOR(Chunk0[${pos}], Chunk1[${pos}], ..., Pattern)`,
        values,
        result: parityByte,
        resultHex: parityByte.toString(16).padStart(2, '0').toUpperCase()
      });
    }
    
    bytes.push(parityBytes);
    parityCalculations[dataChunks + p] = paritySteps;
  }
  
  return { steps, bytes, parityCalculations };
}

/**
 * Ricostruisce i dati originali dai chunks disponibili
 * @param chunks - Array di chunks (alcuni possono essere non disponibili)
 * @param dataChunks - Numero originale di chunks di dati
 */
export function decodeReedSolomon(
  chunks: Chunk[],
  dataChunks: number
): string | null {
  const availableDataChunks = chunks.filter(
    c => !c.isParity && c.isAvailable
  );
  const availableParityChunks = chunks.filter(
    c => c.isParity && c.isAvailable
  );
  
  // Se abbiamo abbastanza chunks di dati, ricostruiamo direttamente
  if (availableDataChunks.length >= dataChunks) {
    return availableDataChunks
      .sort((a, b) => a.id - b.id)
      .map(c => c.data)
      .join('');
  }
  
  // Se non abbiamo abbastanza chunks di dati, proviamo a usare la parità
  const totalAvailable = availableDataChunks.length + availableParityChunks.length;
  
  if (totalAvailable < dataChunks) {
    return null; // Non possiamo ricostruire
  }
  
  // Ricostruzione semplificata: ricostruiamo i chunks di dati mancanti usando la parità
  // Per ogni chunk di dati mancante, usiamo un chunk di parità per ricostruirlo
  const reconstructed: string[] = new Array(dataChunks).fill(null);
  const availableChunks = [...availableDataChunks];
  const usedParityChunks: Chunk[] = [];
  
  // Prima, copia i chunks di dati disponibili
  availableDataChunks.forEach(chunk => {
    reconstructed[chunk.id] = chunk.data;
  });
  
  // Calcola la lunghezza massima
  const maxLen = Math.max(
    ...chunks.filter(c => c.isAvailable).map(c => c.data.length),
    0
  );
  
  // Ricostruisci i chunks mancanti uno alla volta usando la parità
  for (let chunkId = 0; chunkId < dataChunks; chunkId++) {
    if (reconstructed[chunkId] === null) {
      // Questo chunk è mancante, proviamo a ricostruirlo
      if (usedParityChunks.length < availableParityChunks.length) {
        const parityChunk = availableParityChunks[usedParityChunks.length];
        let reconstructedData = '';
        
        // Ricostruisci byte per byte usando XOR inverso
        for (let pos = 0; pos < maxLen; pos++) {
          let reconstructedByte = parityChunk.data.charCodeAt(pos);
          
          // Rimuovi il pattern del chunk di parità
          const parityChunkIndex = parityChunk.id - dataChunks;
          reconstructedByte ^= (parityChunkIndex + 1) * 0x42;
          
          // XOR con tutti gli altri chunks di dati (disponibili o già ricostruiti)
          for (let otherChunkId = 0; otherChunkId < dataChunks; otherChunkId++) {
            if (otherChunkId !== chunkId && reconstructed[otherChunkId] !== null) {
              const otherData = reconstructed[otherChunkId]!;
              if (pos < otherData.length) {
                reconstructedByte ^= otherData.charCodeAt(pos);
              }
            }
          }
          
          reconstructedData += String.fromCharCode(reconstructedByte);
        }
        
        reconstructed[chunkId] = reconstructedData;
        usedParityChunks.push(parityChunk);
      } else {
        // Non abbiamo abbastanza chunks di parità
        return null;
      }
    }
  }
  
  // Unisci tutti i chunks ricostruiti
  const result = reconstructed
    .filter(c => c !== null)
    .join('');
  
  return result || null;
}

/**
 * Simula la perdita di alcuni chunks (come in una rete peer-to-peer)
 * Usa una selezione casuale per simulare meglio la realtà
 */
export function simulateChunkLoss(
  chunks: Chunk[],
  lossCount: number
): Chunk[] {
  const result = chunks.map(c => ({ ...c }));
  
  if (lossCount === 0) {
    // Ripristina tutti i chunks
    result.forEach(c => c.isAvailable = true);
    return result;
  }
  
  // Ripristina tutti i chunks prima
  result.forEach(c => c.isAvailable = true);
  
  // Selezione casuale: Fisher-Yates shuffle per selezionare chunks casuali
  const allIndices = result.map((_, i) => i);
  const indicesToLose: number[] = [];
  
  // Copia l'array per non modificare l'originale
  const availableIndices = [...allIndices];
  
  // Seleziona casualmente N chunks
  for (let i = 0; i < Math.min(lossCount, availableIndices.length); i++) {
    // Scegli un indice casuale
    const randomIndex = Math.floor(Math.random() * availableIndices.length);
    const selectedIndex = availableIndices.splice(randomIndex, 1)[0];
    indicesToLose.push(selectedIndex);
  }
  
  // Applica la perdita
  indicesToLose.forEach(index => {
    result[index].isAvailable = false;
  });
  
  return result;
}

