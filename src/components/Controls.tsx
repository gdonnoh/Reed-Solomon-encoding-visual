import React from 'react';

interface ControlsProps {
  inputData: string;
  setInputData: (data: string) => void;
  dataChunks: number;
  setDataChunks: (chunks: number) => void;
  parityChunks: number;
  setParityChunks: (chunks: number) => void;
  lostChunks: number;
  setLostChunks: (chunks: number) => void;
  maxLoss: number;
}

export default function Controls({
  inputData,
  setInputData,
  dataChunks,
  setDataChunks,
  parityChunks,
  setParityChunks,
  lostChunks,
  setLostChunks,
  maxLoss,
}: ControlsProps) {
  return (
    <div className="controls">
      <div className="control-group">
        <label htmlFor="input-data">
          <strong>📝 Dati da Codificare:</strong>
        </label>
        <textarea
          id="input-data"
          value={inputData}
          onChange={(e) => setInputData(e.target.value)}
          placeholder="Inserisci i dati da codificare..."
          rows={3}
        />
      </div>

      <div className="sliders-container">
        <div className="slider-group">
          <div className="slider-header">
            <label htmlFor="data-chunks">
              <strong>📦 Chunks di Dati:</strong>
            </label>
            <div className="slider-value">{dataChunks}</div>
          </div>
          <div className="slider-wrapper">
            <input
              id="data-chunks"
              type="range"
              min="2"
              max="10"
              value={dataChunks}
              onChange={(e) => setDataChunks(parseInt(e.target.value, 10))}
              className="slider"
            />
            <div className="slider-labels">
              <span>2</span>
              <span>10</span>
            </div>
          </div>
          <span className="control-hint">
            Numero di chunks in cui dividere i dati
          </span>
        </div>

        <div className="slider-group">
          <div className="slider-header">
            <label htmlFor="parity-chunks">
              <strong>🔒 Chunks di Parità:</strong>
            </label>
            <div className="slider-value">{parityChunks}</div>
          </div>
          <div className="slider-wrapper">
            <input
              id="parity-chunks"
              type="range"
              min="1"
              max="5"
              value={parityChunks}
              onChange={(e) => setParityChunks(parseInt(e.target.value, 10))}
              className="slider"
            />
            <div className="slider-labels">
              <span>1</span>
              <span>5</span>
            </div>
          </div>
          <span className="control-hint">
            Ridondanza: puoi perdere fino a {parityChunks} chunk(s)
          </span>
        </div>

        <div className="slider-group lost-chunks-slider">
          <div className="slider-header">
            <label htmlFor="lost-chunks">
              <strong>⚠️ Chunks Persi:</strong>
            </label>
            <div className={`slider-value ${lostChunks > 0 ? 'error' : ''}`}>
              {lostChunks} / {maxLoss}
            </div>
          </div>
          <div className="slider-wrapper">
            <div className="slider-track">
              <div 
                className="slider-progress" 
                style={{ width: `${maxLoss > 0 ? (lostChunks / maxLoss) * 100 : 0}%` }}
              />
            </div>
            <input
              id="lost-chunks"
              type="range"
              min="0"
              max={maxLoss}
              value={lostChunks}
              onChange={(e) => setLostChunks(parseInt(e.target.value, 10))}
              className="slider lost-slider"
              disabled={maxLoss === 0}
              style={{
                '--value': lostChunks,
                '--max': maxLoss,
              } as React.CSSProperties}
            />
            <div className="slider-labels">
              <span>0</span>
              <span>{maxLoss}</span>
            </div>
          </div>
          <div className="recovery-indicator">
            {lostChunks === 0 ? (
              <span className="recovery-status success">✓ Tutti i chunks disponibili</span>
            ) : lostChunks <= parityChunks ? (
              <span className="recovery-status success">✓ Recovery possibile con {parityChunks} chunks di parità</span>
            ) : (
              <span className="recovery-status error">✗ Recovery impossibile - troppi chunks persi</span>
            )}
          </div>
          <span className="control-hint">
            Trascina lo slider per simulare peer che vanno offline
          </span>
        </div>
      </div>
    </div>
  );
}

