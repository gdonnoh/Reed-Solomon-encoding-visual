import { useState, useMemo } from 'react';
import { Chunk, encodeReedSolomon, decodeReedSolomon, simulateChunkLoss } from './reedSolomon';
import ChunkVisualization from './components/ChunkVisualization';
import CoordinatePlane from './components/CoordinatePlane';
import Controls from './components/Controls';
import './App.css';

function App() {
  const [inputData, setInputData] = useState('Hello Ethereum! Reed-Solomon encoding demo.');
  const [dataChunks, setDataChunks] = useState(4);
  const [parityChunks, setParityChunks] = useState(2);
  const [lostChunks, setLostChunks] = useState(0);

  // Codifica i dati quando cambiano i parametri
  const encodedChunks = useMemo(() => {
    if (inputData.length === 0) return [];
    return encodeReedSolomon(inputData, dataChunks, parityChunks);
  }, [inputData, dataChunks, parityChunks]);

  // Applica la perdita di chunks
  const chunksWithLoss = useMemo(() => {
    if (lostChunks === 0) return encodedChunks;
    return simulateChunkLoss([...encodedChunks], lostChunks);
  }, [encodedChunks, lostChunks]);

  // Prova a decodificare
  const decodedData = useMemo(() => {
    if (chunksWithLoss.length === 0) return null;
    return decodeReedSolomon(chunksWithLoss, dataChunks);
  }, [chunksWithLoss, dataChunks]);

  // Calcola statistiche
  const stats = useMemo(() => {
    const available = chunksWithLoss.filter(c => c.isAvailable).length;
    const total = chunksWithLoss.length;
    const dataAvailable = chunksWithLoss.filter(c => !c.isParity && c.isAvailable).length;
    const canRecover = available >= dataChunks;
    
    return {
      total,
      available,
      lost: total - available,
      dataAvailable,
      canRecover,
      recoveryRate: total > 0 ? (available / total) * 100 : 0,
    };
  }, [chunksWithLoss, dataChunks]);

  return (
    <div className="app">
      <header className="header">
        <h1>Reed-Solomon Encoding - Esempio Visivo</h1>
        <p className="subtitle">
          Simulazione di come Ethereum usa Reed-Solomon per distribuire dati tra i peer
        </p>
      </header>

      <div className="container">
        <div className="control-group">
          <label htmlFor="input-data">
            <strong>📝 Dati da Codificare:</strong>
          </label>
          <textarea
            id="input-data"
            value={inputData}
            onChange={(e) => setInputData(e.target.value)}
            placeholder="Inserisci i dati da codificare..."
            rows={2}
          />
        </div>

        <div className="stats-panel">
          <div className="stat">
            <span className="stat-label">Chunks Totali:</span>
            <span className="stat-value">{stats.total}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Chunks Disponibili:</span>
            <span className="stat-value success">{stats.available}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Chunks Persi:</span>
            <span className="stat-value error">{stats.lost}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Recovery Possibile:</span>
            <span className={`stat-value ${stats.canRecover ? 'success' : 'error'}`}>
              {stats.canRecover ? 'Sì ✓' : 'No ✗'}
            </span>
          </div>
        </div>

        <ChunkVisualization
          chunks={chunksWithLoss}
          dataChunks={dataChunks}
        />

        <div className="graph-with-controls">
          <CoordinatePlane
            chunks={chunksWithLoss}
            dataChunks={dataChunks}
          />
          
          <div className="compact-controls">
            <Controls
              inputData={inputData}
              setInputData={setInputData}
              dataChunks={dataChunks}
              setDataChunks={setDataChunks}
              parityChunks={parityChunks}
              setParityChunks={setParityChunks}
              lostChunks={lostChunks}
              setLostChunks={setLostChunks}
              maxLoss={chunksWithLoss.length}
            />
          </div>
        </div>

        <div className="result-panel">
          <div className="result-section">
            <h3>Dati Originali</h3>
            <div className="data-box original">
              {inputData || <em>Inserisci dei dati...</em>}
            </div>
          </div>

          <div className="result-section">
            <h3>Dati Ricostruiti</h3>
            <div className={`data-box ${decodedData === inputData ? 'success' : decodedData ? 'warning' : 'error'}`}>
              {decodedData === inputData && '✓ '}
              {decodedData || 'Impossibile ricostruire - troppi chunks persi'}
            </div>
            {decodedData && decodedData !== inputData && (
              <p className="warning-text">
                ⚠️ I dati sono stati ricostruiti ma potrebbero essere incompleti o errati
              </p>
            )}
          </div>
        </div>

        <div className="explanation">
          <h3>Come Funziona</h3>
          <ol>
            <li>
              <strong>Encoding:</strong> I dati vengono divisi in {dataChunks} chunks di dati. 
              Vengono poi generati {parityChunks} chunks di parità usando operazioni matematiche 
              (in questo esempio semplificato usiamo XOR, ma Ethereum usa algebra di Galois).
            </li>
            <li>
              <strong>Distribuzione:</strong> I chunks vengono distribuiti tra i peer della rete Ethereum. 
              Ogni peer può avere solo alcuni chunks.
            </li>
            <li>
              <strong>Recovery:</strong> Anche se alcuni chunks vengono persi (fino a {parityChunks} chunks), 
              i dati originali possono essere ricostruiti usando i chunks di parità.
            </li>
            <li>
              <strong>Vantaggi:</strong> Questo permette a Ethereum di garantire la disponibilità dei dati 
              anche se alcuni peer vanno offline, senza richiedere che ogni peer abbia tutti i dati.
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}

export default App;

