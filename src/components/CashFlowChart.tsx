import React, { useMemo } from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export const CashFlowChart: React.FC<{ simulationData: any }> = ({ simulationData }) => {
  const data = useMemo(() => {
    if (!simulationData) return [];

    const bid = simulationData.bid?.value || 0;
    const downPaymentPercent = simulationData.downPaymentPercent ?? 100;
    const installments = simulationData.installments ?? 1;
    const interestRate = simulationData.interestRate ?? 0;
    const holdingMonths = simulationData.holdingMonths ?? 12;
    const saleValue = simulationData.saleValue?.value || 0;

    const downPayment = bid * (downPaymentPercent / 100);
    const financed = bid - downPayment;
    const monthlyRate = interestRate / 100 / 12;
    
    let installment = 0;
    if (monthlyRate > 0 && installments > 0) {
      installment = (financed * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -installments));
    } else if (installments > 0) {
      installment = financed / installments;
    }

    const expenses = (simulationData.debts?.value || 0) + (simulationData.costs?.value || 0) + (simulationData.renovation?.value || 0) + (simulationData.commission?.value || 0) + (simulationData.itbi?.value || 0) + (simulationData.assessoria?.value || 0) + (simulationData.entrada?.value || 0) + (simulationData.legalFees?.value || 0) + (simulationData.extraFees?.value || 0) + (simulationData.holdingCosts?.value || 0);

    const chartData = [];
    let cumulativeBalance = -(downPayment + expenses);
    
    chartData.push({ month: 0, flow: cumulativeBalance, balance: cumulativeBalance });

    for (let i = 1; i <= holdingMonths; i++) {
      let flow = (i < holdingMonths) ? -installment : (saleValue - installment - (i < installments ? (financed * Math.pow(1 + monthlyRate, i) - (installment * (Math.pow(1 + monthlyRate, i) - 1)) / monthlyRate) : 0));
      cumulativeBalance += flow;
      chartData.push({ month: i, flow: flow, balance: cumulativeBalance });
    }

    return chartData;
  }, [simulationData]);

  return (
    <div className="p-4 bg-white rounded-xl shadow-sm border border-brand-ink/10 h-[400px]">
      <h3 className="text-lg font-semibold mb-4">Fluxo de Caixa e Saldo Acumulado</h3>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" label={{ value: 'Mês', position: 'insideBottom', offset: -10 }} />
          <YAxis />
          <Tooltip formatter={(value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)} />
          <Legend />
          <Bar dataKey="flow" name="Fluxo Mensal" fill="#8884d8" />
          <Line type="monotone" dataKey="balance" name="Saldo Acumulado" stroke="#82ca9d" strokeWidth={2} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};
