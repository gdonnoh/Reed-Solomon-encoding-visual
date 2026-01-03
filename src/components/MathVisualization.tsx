import { useState } from 'react';
import { Chunk, getEncodingDetails } from '../reedSolomon';
import './MathVisualization.css';

interface MathVisualizationProps {
  inputData: string;
  dataChunks: number;
  parityChunks: number;
  chunks: Chunk[];
  decodedData: string | null;
}

export default function MathVisualization({
  inputData,
  dataChunks,
  parityChunks,
  chunks,
  decodedData,
}: MathVisualizationProps) {
  const [activeTab, setActiveTab] = useState<'encoding' | 'bytes' | 'parity'>('encoding');
  const [selectedParity, setSelectedParity] = useState<number | null>(null);
  const [selectedBytePos, setSelectedBytePos] = useState<number>(0);

  if (!inputData || chunks.length === 0) {
    return (
      <div className="math-visualization">
        <p className="empty-state">Inserisci dei dati per vedere i calcoli matematici</p>
      </div>
    );
  }

  const encodingDetails = getEncodingDetails(inputData, dataChunks, parityChunks);

  return (
    <div className="math-visualization">
      <h3>📐 Visualizzazione Matematica</h3>
      
      <div className="math-tabs">
        <button
          className={activeTab === 'encoding' ? 'active' : ''}
          onClick={() => setActiveTab('encoding')}
        >
          🔢 Processo Encoding
        </button>
        <button
          className={activeTab === 'bytes' ? 'active' : ''}
          onClick={() => setActiveTab('bytes')}
        >
          💾 Bytes & Hex
        </button>
        <button
          className={activeTab === 'parity' ? 'active' : ''}
          onClick={() => setActiveTab('parity')}
        >
          🔒 Calcolo Parità
        </button>
      </div>

      <div className="math-content">
        {activeTab === 'encoding' && (
          <div className="encoding-steps">
            <h4>Passi di Encoding</h4>
            {encodingDetails.steps.map((step, idx) => (
              <div key={idx} className="math-step">
                <div className="step-header">
                  <span className="step-number">{idx + 1}</span>
                  <span className="step-title">{step.step}</span>
                </div>
                <div className="step-operation">
                  <code>{step.operation}</code>
                </div>
                <div className="step-values">
                  {step.values.map((val, vIdx) => (
                    <div key={vIdx} className="value-item">
                      <span className="value-label">{val.label}:</span>
                      <span className="value-content">
                        {typeof val.value === 'string' ? (
                          <span className="value-text">{val.value}</span>
                        ) : (
                          <span className="value-number">{val.value}</span>
                        )}
                        {val.hex && (
                          <span className="value-hex">(0x{val.hex})</span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
                {step.resultHex && (
                  <div className="step-result">
                    <strong>Risultato:</strong> {step.result} 
                    {typeof step.result === 'number' && (
                      <span className="result-hex"> (0x{step.resultHex})</span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'bytes' && (
          <div className="bytes-visualization">
            <h4>Rappresentazione Bytes (Esadecimale)</h4>
            
            {/* Matrice di Encoding */}
            <div className="encoding-matrix">
              <h5>Matrice di Encoding</h5>
              <div className="matrix-container">
                <table className="matrix-table">
                  <thead>
                    <tr>
                      <th>Chunk</th>
                      {Array.from({ length: Math.max(...encodingDetails.bytes.map(b => b.length)) }, (_, i) => (
                        <th key={i}>Byte {i}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {chunks.map((chunk, chunkIdx) => {
                      const bytes = encodingDetails.bytes[chunkIdx] || [];
                      return (
                        <tr
                          key={chunk.id}
                          className={`matrix-row ${chunk.isParity ? 'parity-row' : 'data-row'} ${!chunk.isAvailable ? 'lost-row' : ''}`}
                        >
                          <td className="chunk-name-cell">
                            {chunk.isParity ? '🔒 P' : '📦 D'}{chunk.id}
                            {!chunk.isAvailable && <span className="lost-indicator">✗</span>}
                          </td>
                          {Array.from({ length: Math.max(...encodingDetails.bytes.map(b => b.length)) }, (_, byteIdx) => (
                            <td key={byteIdx} className="byte-cell-matrix">
                              {byteIdx < bytes.length ? (
                                <div className="byte-value-matrix">
                                  <span className="byte-hex-matrix">
                                    {bytes[byteIdx].toString(16).padStart(2, '0').toUpperCase()}
                                  </span>
                                  <span className="byte-dec-matrix">
                                    {bytes[byteIdx]}
                                  </span>
                                </div>
                              ) : (
                                <span className="empty-byte">—</span>
                              )}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p className="matrix-explanation">
                Questa matrice mostra come i dati sono organizzati. Ogni riga è un chunk, ogni colonna è una posizione byte.
                I chunks di parità (righe blu) sono calcolati facendo XOR dei bytes corrispondenti dei chunks di dati.
              </p>
            </div>

            <div className="bytes-grid">
              {chunks.map((chunk, chunkIdx) => {
                const bytes = encodingDetails.bytes[chunkIdx] || [];
                return (
                  <div
                    key={chunk.id}
                    className={`bytes-chunk ${chunk.isParity ? 'parity' : 'data'} ${!chunk.isAvailable ? 'lost' : ''}`}
                  >
                    <div className="bytes-chunk-header">
                      <span className="bytes-chunk-type">
                        {chunk.isParity ? '🔒 Parità' : '📦 Dati'} #{chunk.id}
                      </span>
                      {!chunk.isAvailable && <span className="lost-badge">✗ Perso</span>}
                    </div>
                    <div className="bytes-content">
                      <div className="bytes-hex">
                        {bytes.length > 0 ? (
                          bytes.map((byte, byteIdx) => (
                            <span
                              key={byteIdx}
                              className={`byte-cell ${selectedBytePos === byteIdx && selectedParity === chunk.id ? 'highlighted' : ''}`}
                              onClick={() => {
                                if (chunk.isParity) {
                                  setSelectedParity(chunk.id);
                                  setSelectedBytePos(byteIdx);
                                }
                              }}
                              title={`Byte ${byteIdx}: ${byte} (0x${byte.toString(16).padStart(2, '0').toUpperCase()})`}
                            >
                              {byte.toString(16).padStart(2, '0').toUpperCase()}
                            </span>
                          ))
                        ) : (
                          <span className="empty-bytes">—</span>
                        )}
                      </div>
                      <div className="bytes-decimal">
                        {bytes.length > 0 && (
                          <span className="bytes-label">Decimale: </span>
                        )}
                        {bytes.slice(0, 10).map((b, i) => (
                          <span key={i} className="byte-decimal">{b}</span>
                        ))}
                        {bytes.length > 10 && <span>...</span>}
                      </div>
                      <div className="bytes-text">
                        {chunk.data.slice(0, 30)}
                        {chunk.data.length > 30 && '...'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'parity' && (
          <div className="parity-visualization">
            <h4>Calcolo Chunks di Parità</h4>
            <div className="parity-selector">
              <label>Seleziona chunk di parità da analizzare:</label>
              <select
                value={selectedParity || ''}
                onChange={(e) => {
                  const val = e.target.value ? parseInt(e.target.value, 10) : null;
                  setSelectedParity(val);
                  setSelectedBytePos(0);
                }}
              >
                <option value="">— Seleziona —</option>
                {chunks
                  .filter(c => c.isParity)
                  .map(c => (
                    <option key={c.id} value={c.id}>
                      Parità #{c.id}
                    </option>
                  ))}
              </select>
            </div>

            {selectedParity !== null && 
             encodingDetails.parityCalculations[selectedParity] && 
             encodingDetails.parityCalculations[selectedParity].length > 0 && (
              <div className="parity-calculations">
                <h5>Calcoli per Parità #{selectedParity}</h5>
                <div className="byte-position-selector">
                  <label>Posizione byte:</label>
                  <input
                    type="range"
                    min="0"
                    max={Math.max(0, encodingDetails.parityCalculations[selectedParity].length - 1)}
                    value={selectedBytePos}
                    onChange={(e) => setSelectedBytePos(parseInt(e.target.value, 10))}
                  />
                  <span>{selectedBytePos} / {encodingDetails.parityCalculations[selectedParity].length - 1}</span>
                </div>

                {encodingDetails.parityCalculations[selectedParity][selectedBytePos] && (
                  <div className="parity-step-detailed">
                    <div className="parity-step-header">
                      <h6>{encodingDetails.parityCalculations[selectedParity][selectedBytePos].step}</h6>
                    </div>
                    <div className="parity-operation">
                      <code>{encodingDetails.parityCalculations[selectedParity][selectedBytePos].operation}</code>
                    </div>
                    <div className="parity-xor-visualization">
                      <div className="xor-flow">
                        <div className="xor-inputs">
                          {encodingDetails.parityCalculations[selectedParity][selectedBytePos].values.map((val, idx) => (
                            <div key={idx} className="xor-input-card">
                              <div className="xor-label">{val.label}</div>
                              <div className="xor-value">
                                <div className="value-display">
                                  <span className="xor-hex">0x{val.hex}</span>
                                  <span className="xor-decimal">({val.value})</span>
                                </div>
                                {typeof val.value === 'number' && (
                                  <div className="binary-breakdown">
                                    <div className="binary-label">Binario:</div>
                                    <div className="binary-bits">
                                      {val.value.toString(2).padStart(8, '0').split('').map((bit, bitIdx) => (
                                        <span key={bitIdx} className={`bit bit-${bit}`}>{bit}</span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                              {idx < encodingDetails.parityCalculations[selectedParity][selectedBytePos].values.length - 1 && (
                                <div className="xor-arrow">⊕</div>
                              )}
                            </div>
                          ))}
                        </div>
                        <div className="xor-equals">=</div>
                        <div className="xor-result-card">
                          <div className="xor-result-label">Parità P{selectedParity}[{selectedBytePos}]</div>
                          <div className="xor-result-value">
                            <div className="value-display">
                              <span className="xor-hex">
                                0x{encodingDetails.parityCalculations[selectedParity][selectedBytePos].resultHex}
                              </span>
                              <span className="xor-decimal">
                                ({encodingDetails.parityCalculations[selectedParity][selectedBytePos].result})
                              </span>
                            </div>
                            {typeof encodingDetails.parityCalculations[selectedParity][selectedBytePos].result === 'number' && (
                              <div className="binary-breakdown">
                                <div className="binary-label">Binario:</div>
                                <div className="binary-bits">
                                  {(encodingDetails.parityCalculations[selectedParity][selectedBytePos].result as number)
                                    .toString(2).padStart(8, '0').split('').map((bit, bitIdx) => (
                                    <span key={bitIdx} className={`bit bit-${bit}`}>{bit}</span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="parity-explanation">
                      <p>
                        <strong>Come funziona:</strong> Ogni byte di parità è calcolato facendo XOR (⊕) 
                        tra i bytes corrispondenti di tutti i chunks di dati, più un pattern univoco 
                        per distinguere questo chunk di parità dagli altri.
                      </p>
                      <p>
                        XOR ha la proprietà che: <code>A ⊕ B ⊕ B = A</code>, 
                        quindi possiamo ricostruire un byte mancante se abbiamo tutti gli altri.
                      </p>
                      {chunks.filter(c => !c.isAvailable).length > 0 && (
                        <div className="recovery-info">
                          <p>
                            <strong>Recovery:</strong> Attualmente {chunks.filter(c => !c.isAvailable).length} chunk(s) sono persi.
                            {chunks.filter(c => c.isAvailable).length >= dataChunks ? (
                              <span className="recovery-success"> ✓ Recovery possibile!</span>
                            ) : (
                              <span className="recovery-error"> ✗ Recovery impossibile - servono almeno {dataChunks} chunks</span>
                            )}
                          </p>
                          {decodedData && decodedData === inputData && (
                            <p className="recovery-success-detail">
                              ✓ I dati sono stati ricostruiti con successo usando i chunks di parità!
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

