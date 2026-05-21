import React, { useState } from 'react';

// Simple IRR solver using Newton-Raphson
const calculateIRR = (cashFlows: number[], guess = 0.1) => {
  const maxIterations = 100;
  const precision = 1e-7;
  let irr = guess;

  for (let i = 0; i < maxIterations; i++) {
    let npv = 0;
    let dnpv = 0;
    for (let t = 0; t < cashFlows.length; t++) {
      npv += cashFlows[t] / Math.pow(1 + irr, t);
      dnpv -= t * cashFlows[t] / Math.pow(1 + irr, t + 1);
    }
    const newIrr = irr - npv / dnpv;
    if (Math.abs(newIrr - irr) < precision) return newIrr;
    irr = newIrr;
  }
  return irr;
};

export const TIRCalculator: React.FC = () => {
  const [cashFlows, setCashFlows] = useState<string[]>(['', '']);
  const [tir, setTir] = useState<number | null>(null);

  const handleAddFlow = () => setCashFlows([...cashFlows, '']);
  const handleRemoveFlow = (index: number) => setCashFlows(cashFlows.filter((_, i) => i !== index));
  const handleChange = (index: number, value: string) => {
    const newFlows = [...cashFlows];
    newFlows[index] = value;
    setCashFlows(newFlows);
  };

  const handleCalculate = () => {
    const flows = cashFlows.map(f => parseFloat(f)).filter(f => !isNaN(f));
    if (flows.length < 2) return;
    const result = calculateIRR(flows);
    setTir(result * 100);
  };

  return (
    <div className="p-4 bg-white rounded-xl shadow-sm border border-brand-ink/10">
      <h3 className="text-lg font-semibold mb-4">Calculadora de TIR</h3>
      {cashFlows.map((flow, index) => (
        <div key={index} className="flex gap-2 mb-2">
          <input
            type="number"
            value={flow}
            onChange={(e) => handleChange(index, e.target.value)}
            placeholder={`Fluxo ${index === 0 ? '(Investimento Inicial)' : index}`}
            className="w-full p-2 border rounded bg-white text-gray-900 focus:ring-2 focus:ring-brand-primary/50 outline-none transition-all"
          />
          <button onClick={() => handleRemoveFlow(index)} className="text-red-500">X</button>
        </div>
      ))}
      <button onClick={handleAddFlow} className="text-brand-primary mb-4">+ Adicionar Fluxo</button>
      <button onClick={handleCalculate} className="w-full p-2 bg-brand-primary text-black rounded font-bold">Calcular TIR</button>
      {tir !== null && (
        <div className="mt-4 text-center font-bold text-xl">
          TIR: {tir.toFixed(2)}%
        </div>
      )}
    </div>
  );
};
