# Reed-Solomon Encoding - Esempio Visivo Interattivo

Un esempio visivo e interattivo di come funziona il Reed-Solomon encoding, specificamente nel contesto di Ethereum e la distribuzione dei dati tra i peer.

## 🎯 Scopo

Questo progetto dimostra visivamente come:
- I dati vengono divisi in chunks
- Vengono generati chunks di parità per la ridondanza
- I dati possono essere ricostruiti anche se alcuni chunks vengono persi
- Ethereum usa questo meccanismo per garantire la disponibilità dei dati nella rete

## 🚀 Come Usare

### Installazione

```bash
npm install
```

### Avvio in Modalità Sviluppo

```bash
npm run dev
```

Apri il browser su `http://localhost:5173`

### Build per Produzione

```bash
npm run build
```

## 📚 Come Funziona

### Reed-Solomon Encoding

Reed-Solomon è un codice di correzione degli errori che permette di:
1. **Dividere i dati** in N chunks di dati
2. **Generare M chunks di parità** usando operazioni matematiche (algebra di Galois)
3. **Ricostruire i dati originali** anche se fino a M chunks vengono persi

### Nel Contesto di Ethereum

Ethereum usa Reed-Solomon encoding per:
- **Danksharding**: Distribuire i dati dei blob tra i validatori
- **Data Availability Sampling**: Permettere ai nodi di verificare la disponibilità dei dati senza scaricarli tutti
- **Fault Tolerance**: Garantire che i dati rimangano disponibili anche se alcuni peer vanno offline

### Esempio Pratico

Se hai:
- 4 chunks di dati
- 2 chunks di parità
- Totale: 6 chunks

Puoi perdere fino a 2 chunks (qualsiasi combinazione) e ancora ricostruire i dati originali!

## 🎨 Componenti

- **Controls**: Controlli interattivi per modificare i parametri
- **ChunkVisualization**: Visualizzazione grafica dei chunks (dati vs parità, disponibili vs persi)
- **Stats Panel**: Statistiche in tempo reale sulla recovery
- **Result Panel**: Confronto tra dati originali e ricostruiti

## 🔧 Integrazione in MDX

Per integrare questo componente nel tuo blog React/MDX:

1. Copia la cartella `src` nel tuo progetto
2. Importa i componenti necessari:

```tsx
import ReedSolomonDemo from './components/ReedSolomonDemo'

export default function BlogPost() {
  return (
    <div>
      <h1>Reed-Solomon Encoding</h1>
      <ReedSolomonDemo />
    </div>
  )
}
```

Oppure puoi estrarre solo la logica e creare un componente più leggero per MDX.

## ⚠️ Nota sull'Implementazione

Questa è un'implementazione **semplificata** per scopi educativi. In produzione, Ethereum usa:
- Algebra di Galois (GF(2^8)) per operazioni matematiche precise
- Algoritmi più sofisticati per la ricostruzione
- Ottimizzazioni per performance e sicurezza

## 📝 Licenza

MIT

