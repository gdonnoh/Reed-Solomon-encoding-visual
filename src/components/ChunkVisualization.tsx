import React from 'react';
import { Chunk } from '../reedSolomon';

interface ChunkVisualizationProps {
  chunks: Chunk[];
  dataChunks: number;
}

export default function ChunkVisualization({
  chunks,
  dataChunks,
}: ChunkVisualizationProps) {
  const dataChunksList = chunks.filter(c => !c.isParity);
  const parityChunksList = chunks.filter(c => c.isParity);
  
  return (
    <div className="chunk-visualization">
      <h3>📦 Chunks</h3>
      
      <div className="chunks-section">
        <div className="chunks-group">
          <h4 className="chunks-group-title">Dati ({dataChunksList.filter(c => c.isAvailable).length}/{dataChunksList.length})</h4>
          <div className="chunks-list">
            {dataChunksList.map((chunk) => (
              <div
                key={chunk.id}
                className={`chunk-item ${chunk.isAvailable ? 'available' : 'lost'}`}
              >
                <div className="chunk-badge data">
                  D{chunk.id}
                </div>
                <div className="chunk-status-icon">
                  {chunk.isAvailable ? '✓' : '✗'}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="chunks-group">
          <h4 className="chunks-group-title">Parità ({parityChunksList.filter(c => c.isAvailable).length}/{parityChunksList.length})</h4>
          <div className="chunks-list">
            {parityChunksList.map((chunk) => (
              <div
                key={chunk.id}
                className={`chunk-item ${chunk.isAvailable ? 'available' : 'lost'}`}
              >
                <div className="chunk-badge parity">
                  P{chunk.id}
                </div>
                <div className="chunk-status-icon">
                  {chunk.isAvailable ? '✓' : '✗'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

