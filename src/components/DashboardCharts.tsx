import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Property } from '../types';

interface DashboardChartsProps {
  properties: Property[];
}

const COLORS = ['#D4AF37', '#10B981', '#EF4444', '#6366F1'];

export function DashboardCharts({ properties }: DashboardChartsProps) {
  const statusData = [
    { name: 'Em Análise', value: properties.filter(p => p.status === 'Analise').length },
    { name: 'Arrematado', value: properties.filter(p => p.status === 'Arrematado').length },
    { name: 'Perdido', value: properties.filter(p => p.status === 'Perdido').length },
  ];

  const roiData = properties.slice(0, 5).map(p => ({
    name: p.title.substring(0, 10) + '...',
    roi: 32 // Placeholder for actual ROI calculation
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="premium-card p-8 bg-brand-paper border-brand-primary/10">
        <h3 className="text-xl font-serif font-medium text-brand-primary mb-6">Imóveis por Status</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#8884d8" label>
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="premium-card p-8 bg-brand-paper border-brand-primary/10">
        <h3 className="text-xl font-serif font-medium text-brand-primary mb-6">ROI Estimado (Top 5)</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={roiData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="roi" fill="#D4AF37" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
