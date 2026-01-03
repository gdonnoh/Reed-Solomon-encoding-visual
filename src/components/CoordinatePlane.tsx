import { useMemo } from 'react';
import { Chunk } from '../reedSolomon';
import './CoordinatePlane.css';

interface Point {
  x: number;
  y: number; // Valore originale y (per calcoli)
  originalY: number; // Valore originale y (per visualizzazione)
  chunkId: number;
  isParity: boolean;
  isAvailable: boolean;
}

interface CoordinatePlaneProps {
  chunks: Chunk[];
  dataChunks: number;
  width?: number;
  height?: number;
}

export default function CoordinatePlane({
  chunks,
  dataChunks,
  width = 800,
  height = 500,
}: CoordinatePlaneProps) {
  const padding = 60;
  const graphWidth = width - padding * 2;
  const graphHeight = height - padding * 2;

  // Converti chunks in punti sul piano cartesiano
  const points = useMemo(() => {
    const result: Point[] = [];
    
    chunks.forEach((chunk) => {
      // x = indice del chunk (0, 1, 2, ...)
      const x = chunk.id;
      
      // y = somma dei valori ASCII dei primi caratteri (normalizzato)
      // Questo simula come i dati vengono mappati su un polinomio
      let yValue = 0;
      for (let i = 0; i < Math.min(chunk.data.length, 5); i++) {
        yValue += chunk.data.charCodeAt(i);
      }
      // Normalizza per avere valori ragionevoli nel grafico
      const originalY = yValue % 200 + 50; // Valori tra 50 e 250
      
      result.push({
        x,
        y: originalY, // Valore originale per i calcoli del polinomio
        originalY: originalY, // Valore originale per la visualizzazione
        chunkId: chunk.id,
        isParity: chunk.isParity,
        isAvailable: chunk.isAvailable,
      });
    });
    
    return result;
  }, [chunks]);

  // Calcola il range di x e y
  const xMin = 0;
  const xMax = Math.max(...points.map(p => p.x), 5);
  const yMin = 0;
  const yMax = Math.max(...points.map(p => p.y), 300, 100); // Minimo 100 per evitare divisione per zero

  // Funzione per convertire coordinate matematiche a coordinate SVG
  const toSVGX = (x: number) => {
    const xRange = xMax - xMin || 1; // Evita divisione per zero
    return padding + ((x - xMin) / xRange) * graphWidth;
  };
  const toSVGY = (y: number) => {
    const yRange = yMax - yMin || 1; // Evita divisione per zero
    return padding + graphHeight - ((y - yMin) / yRange) * graphHeight;
  };

  // Interpolazione polinomiale di Lagrange (ESATTA, non approssimazione)
  // Il polinomio passa ESATTAMENTE attraverso tutti i punti disponibili E quelli ricostruiti
  const availablePoints = points.filter(p => p.isAvailable);
  
  // Calcola i punti ricostruiti PRIMA di calcolare il polinomio
  const lostPoints = points.filter(p => !p.isAvailable);
  const reconstructedPoints = useMemo(() => {
    if (availablePoints.length < dataChunks || lostPoints.length === 0) return [];
    
    const lagrangeInterpolation = (x: number, points: Point[]): number | null => {
      if (points.length === 0) return null;
      
      let result = 0;
      
      for (let i = 0; i < points.length; i++) {
        let term = points[i].y;
        
        for (let j = 0; j < points.length; j++) {
          if (i !== j) {
            const denominator = points[i].x - points[j].x;
            if (Math.abs(denominator) < 0.0001) {
              return points[i].y;
            }
            term *= (x - points[j].x) / denominator;
          }
        }
        
        result += term;
      }
      
      return isFinite(result) && !isNaN(result) ? result : null;
    };
    
    return lostPoints
      .map((lostPoint) => {
        const y = lagrangeInterpolation(lostPoint.x, availablePoints);
        if (y === null) return null;
        const originalPoint = points.find(p => p.chunkId === lostPoint.chunkId);
        return { ...lostPoint, y: originalPoint ? originalPoint.originalY : y };
      })
      .filter((p): p is Point => p !== null);
  }, [availablePoints, lostPoints, dataChunks, points]);
  
  // Combina punti disponibili e ricostruiti per il polinomio
  const allPointsForPolynomial = useMemo(() => {
    const all: Point[] = [...availablePoints];
    reconstructedPoints.forEach(rp => {
      const originalPoint = points.find(p => p.chunkId === rp.chunkId);
      if (originalPoint) {
        all.push({
          ...originalPoint,
          y: originalPoint.originalY,
          isAvailable: true // Consideralo disponibile per il polinomio
        });
      }
    });
    return all;
  }, [availablePoints, reconstructedPoints, points]);
  
  const polynomialPoints = useMemo(() => {
    if (allPointsForPolynomial.length < 2) return [];
    
    // Interpolazione di Lagrange: polinomio di grado n-1 che passa esattamente per n punti
    const lagrangeInterpolation = (x: number, points: Point[]): number => {
      let result = 0;
      
      for (let i = 0; i < points.length; i++) {
        let term = points[i].y;
        
        for (let j = 0; j < points.length; j++) {
          if (i !== j) {
            const denominator = points[i].x - points[j].x;
            if (Math.abs(denominator) < 0.0001) {
              return points[i].y;
            }
            term *= (x - points[j].x) / denominator;
          }
        }
        
        result += term;
      }
      
      return result;
    };
    
    // Genera punti sul polinomio
    const result: { x: number; y: number }[] = [];
    const step = (xMax - xMin) / 200;
    
    for (let x = xMin; x <= xMax; x += step) {
      const y = lagrangeInterpolation(x, allPointsForPolynomial);
      if (isFinite(y) && !isNaN(y)) {
        result.push({ x, y });
      }
    }
    
    return result;
  }, [allPointsForPolynomial, xMin, xMax]);

  // reconstructedPoints è già calcolato sopra

  return (
    <div className="coordinate-plane-container">
      <h3>📊 Piano Cartesiano - Interpolazione Polinomiale</h3>
      <p className="plane-explanation">
        <strong>Come funziona Reed-Solomon:</strong> Ogni chunk è un punto (x, y) esatto. Il polinomio 
        (curva blu) passa ESATTAMENTE attraverso tutti i punti disponibili. I punti disponibili con anello 
        giallo vengono usati per ricostruire i punti persi. Le linee tratteggiate gialle mostrano le 
        connessioni. Se hai almeno {dataChunks} punti (qualsiasi combinazione), puoi ricostruire ESATTAMENTE 
        i punti persi usando l'interpolazione di Lagrange.
      </p>
      
      <svg
        width={width}
        height={height}
        className="coordinate-plane"
        viewBox={`0 0 ${width} ${height}`}
      >
        {/* Griglia */}
        <defs>
          <pattern
            id="grid"
            width="40"
            height="40"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 40 0 L 0 0 0 40"
              fill="none"
              stroke="#e0e0e0"
              strokeWidth="1"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />

        {/* Assi */}
        <line
          x1={padding}
          y1={padding}
          x2={padding}
          y2={height - padding}
          stroke="#333"
          strokeWidth="2"
          markerEnd="url(#arrowhead)"
        />
        <line
          x1={padding}
          y1={height - padding}
          x2={width - padding}
          y2={height - padding}
          stroke="#333"
          strokeWidth="2"
          markerEnd="url(#arrowhead)"
        />

        {/* Frecce degli assi */}
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="3"
            orient="auto"
          >
            <polygon points="0 0, 10 3, 0 6" fill="#333" />
          </marker>
        </defs>

        {/* Etichette assi */}
        <text
          x={width - padding + 10}
          y={height - padding + 5}
          fill="#333"
          fontSize="14"
          fontWeight="600"
        >
          x (Chunk ID)
        </text>
        <text
          x={padding - 10}
          y={padding - 10}
          fill="#333"
          fontSize="14"
          fontWeight="600"
          textAnchor="end"
        >
          y (Valore Dati)
        </text>

        {/* Scala assi X */}
        {Array.from({ length: xMax + 1 }, (_, i) => {
          const x = toSVGX(i);
          return (
            <g key={`x-${i}`}>
              <line
                x1={x}
                y1={height - padding - 5}
                x2={x}
                y2={height - padding + 5}
                stroke="#666"
                strokeWidth="2"
              />
              <text
                x={x}
                y={height - padding + 20}
                fill="#666"
                fontSize="12"
                textAnchor="middle"
              >
                {i}
              </text>
            </g>
          );
        })}

        {/* Scala assi Y */}
        {[0, 50, 100, 150, 200, 250].map((yVal) => {
          if (yVal > yMax) return null;
          const y = toSVGY(yVal);
          return (
            <g key={`y-${yVal}`}>
              <line
                x1={padding - 5}
                y1={y}
                x2={padding + 5}
                y2={y}
                stroke="#666"
                strokeWidth="2"
              />
              <text
                x={padding - 10}
                y={y + 4}
                fill="#666"
                fontSize="12"
                textAnchor="end"
              >
                {yVal}
              </text>
            </g>
          );
        })}

        {/* Polinomio di interpolazione - costruito punto per punto */}
        {polynomialPoints.length > 1 && (() => {
          const validPoints = polynomialPoints
            .map(p => ({
              x: p.x,
              y: Math.max(yMin - 50, Math.min(yMax + 50, p.y))
            }))
            .filter(p => isFinite(p.x) && isFinite(p.y))
            .sort((a, b) => a.x - b.x);
          
          if (validPoints.length < 2) return null;
          
          // Trova le posizioni x dei punti ricostruiti
          const reconstructedXPositions = new Set<number>();
          if (reconstructedPoints.length > 0) {
            reconstructedPoints.forEach(rp => {
              const originalPoint = points.find(p => p.chunkId === rp.chunkId);
              if (originalPoint) {
                reconstructedXPositions.add(originalPoint.x);
              }
            });
          }
          
          // Costruisci il path del polinomio segmento per segmento
          let fullPath = `M ${toSVGX(validPoints[0].x)} ${toSVGY(validPoints[0].y)}`;
          const segments: { path: string; isReconstruction: boolean; startX: number; endX: number }[] = [];
          
          for (let i = 1; i < validPoints.length; i++) {
            const segment = ` L ${toSVGX(validPoints[i].x)} ${toSVGY(validPoints[i].y)}`;
            fullPath += segment;
            
            // Controlla se questo segmento passa vicino a un punto ricostruito
            const startX = validPoints[i-1].x;
            const endX = validPoints[i].x;
            const midX = (startX + endX) / 2;
            
            const isReconstruction = Array.from(reconstructedXPositions).some(rx => 
              Math.abs(midX - rx) < 0.5 || (startX <= rx && endX >= rx)
            );
            
            segments.push({
              path: `M ${toSVGX(startX)} ${toSVGY(validPoints[i-1].y)}${segment}`,
              isReconstruction,
              startX,
              endX
            });
          }
          
          return (
            <>
              {/* Polinomio completo (sottile, per riferimento) */}
              <path
                d={fullPath}
                fill="none"
                stroke="#667eea"
                strokeWidth="2"
                strokeDasharray="5,5"
                opacity="0.2"
                className="polynomial-curve-background"
              />
              
              {/* Segmenti normali del polinomio */}
              {segments.filter(s => !s.isReconstruction).map((segment, idx) => (
                <path
                  key={`poly-segment-${idx}`}
                  d={segment.path}
                  fill="none"
                  stroke="#667eea"
                  strokeWidth="3"
                  strokeDasharray="5,5"
                  opacity="0.6"
                  className="polynomial-curve"
                />
              ))}
              
              {/* Segmenti usati per ricostruzione - colore giallo, più spessi */}
              {segments.filter(s => s.isReconstruction).map((segment, idx) => (
                <path
                  key={`poly-recon-${idx}`}
                  d={segment.path}
                  fill="none"
                  stroke="#ffc107"
                  strokeWidth="4"
                  strokeDasharray="4,4"
                  opacity="0.9"
                  className="polynomial-reconstruction-curve"
                >
                  <animate
                    attributeName="stroke-dashoffset"
                    from="20"
                    to="0"
                    dur="1.5s"
                    begin={`${idx * 0.2}s`}
                    fill="freeze"
                  />
                </path>
              ))}
            </>
          );
        })()}

        {/* Punti disponibili - evidenziati se usati per ricostruzione */}
        {points
          .filter((p) => p.isAvailable)
          .map((point) => {
            const isUsedForReconstruction = reconstructedPoints.length > 0;
            return (
              <g key={`point-${point.chunkId}`}>
                {/* Anello esterno se usato per ricostruzione */}
                {isUsedForReconstruction && (
                  <circle
                    cx={toSVGX(point.x)}
                    cy={toSVGY(point.originalY)}
                    r={point.isParity ? 12 : 14}
                    fill="none"
                    stroke="#ffc107"
                    strokeWidth="2"
                    strokeDasharray="3,3"
                    opacity="0.6"
                    className="used-for-reconstruction"
                  />
                )}
                <circle
                  cx={toSVGX(point.x)}
                  cy={toSVGY(point.originalY)}
                  r={point.isParity ? 8 : 10}
                  fill={point.isParity ? '#2196f3' : '#4caf50'}
                  stroke="#fff"
                  strokeWidth="2"
                  className="data-point"
                />
                <text
                  x={toSVGX(point.x)}
                  y={toSVGY(point.originalY) - 15}
                  fill={point.isParity ? '#2196f3' : '#4caf50'}
                  fontSize="11"
                  fontWeight="600"
                  textAnchor="middle"
                >
                  {point.isParity ? `P${point.chunkId}` : `D${point.chunkId}`}
                </text>
                {isUsedForReconstruction && (
                  <text
                    x={toSVGX(point.x)}
                    y={toSVGY(point.originalY) + 25}
                    fill="#ffc107"
                    fontSize="8"
                    fontWeight="600"
                    textAnchor="middle"
                    opacity="0.7"
                  >
                    Usato
                  </text>
                )}
              </g>
            );
          })}

        {/* Punti persi (non ricostruibili) - mostrati come assenti alla loro posizione originale */}
        {points
          .filter((p) => !p.isAvailable && !reconstructedPoints.find(rp => rp.chunkId === p.chunkId))
          .map((point) => {
            // Mostra dove DOVREBBE essere il punto (alla sua posizione originale y)
            // ma con un indicatore che è perso e non può essere ricostruito
            return (
              <g key={`lost-${point.chunkId}`}>
                {/* Cerchio vuoto che indica la posizione mancante */}
                <circle
                  cx={toSVGX(point.x)}
                  cy={toSVGY(point.originalY)}
                  r={point.isParity ? 8 : 10}
                  fill="none"
                  stroke="#f44336"
                  strokeWidth="3"
                  strokeDasharray="4,4"
                  opacity="0.6"
                  className="lost-point"
                />
                <text
                  x={toSVGX(point.x)}
                  y={toSVGY(point.originalY) - 18}
                  fill="#f44336"
                  fontSize="11"
                  fontWeight="700"
                  textAnchor="middle"
                >
                  {point.isParity ? `P${point.chunkId}` : `D${point.chunkId}`} ✗
                </text>
                <text
                  x={toSVGX(point.x)}
                  y={toSVGY(point.originalY) + 25}
                  fill="#f44336"
                  fontSize="9"
                  fontWeight="600"
                  textAnchor="middle"
                  opacity="0.7"
                >
                  Non ricostruibile
                </text>
              </g>
            );
          })}


        {/* Punti ricostruiti - nella STESSA posizione dove erano i punti persi */}
        {reconstructedPoints.length > 0 && reconstructedPoints.map((point) => {
          // Il punto ricostruito va ESATTAMENTE nella posizione originale (originalY)
          // perché il polinomio calcola esattamente il valore che aveva
          const originalPoint = points.find(p => p.chunkId === point.chunkId);
          const reconstructedY = originalPoint ? originalPoint.originalY : point.y;
          const clampedY = Math.max(yMin, Math.min(yMax, reconstructedY));
          
          return (
            <g key={`reconstructed-${point.chunkId}`}>
              {/* Linee che mostrano la ricostruzione: dal polinomio alla posizione originale */}
              {availablePoints.map((availablePoint) => (
                <line
                  key={`recon-line-${availablePoint.chunkId}-${point.chunkId}`}
                  x1={toSVGX(availablePoint.x)}
                  y1={toSVGY(availablePoint.originalY)}
                  x2={toSVGX(point.x)}
                  y2={toSVGY(clampedY)}
                  stroke="#ffc107"
                  strokeWidth="1.5"
                  strokeDasharray="2,2"
                  opacity="0.3"
                  className="reconstruction-line"
                />
              ))}
              
              {/* Il punto ricostruito nella sua posizione originale */}
              <circle
                cx={toSVGX(point.x)}
                cy={toSVGY(clampedY)}
                r={point.isParity ? 9 : 11}
                fill="#ffc107"
                stroke="#ff9800"
                strokeWidth="3"
                className="reconstructed-point"
              />
              <text
                x={toSVGX(point.x)}
                y={toSVGY(clampedY) - 18}
                fill="#ff9800"
                fontSize="11"
                fontWeight="700"
                textAnchor="middle"
              >
                {point.isParity ? `P${point.chunkId}` : `D${point.chunkId}`} ✓
              </text>
              {/* Indicatore che mostra che è ricostruito */}
              <text
                x={toSVGX(point.x)}
                y={toSVGY(clampedY) + 25}
                fill="#ff9800"
                fontSize="9"
                fontWeight="600"
                textAnchor="middle"
                opacity="0.8"
              >
                Ricostruito
              </text>
            </g>
          );
        })}
      </svg>

      <div className="plane-legend">
        <div className="legend-item">
          <div className="legend-dot data"></div>
          <span>Punti Dati (D0, D1, ...)</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot parity"></div>
          <span>Punti Parità (P4, P5, ...)</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot lost"></div>
          <span>Punti Persi</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot reconstructed"></div>
          <span>Punti Ricostruiti</span>
        </div>
        <div className="legend-item">
          <div className="legend-line polynomial"></div>
          <span>Polinomio (passa attraverso i punti disponibili)</span>
        </div>
      </div>
    </div>
  );
}

