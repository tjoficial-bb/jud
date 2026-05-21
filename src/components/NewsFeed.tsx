import React from 'react';
import { Newspaper } from 'lucide-react';

const news = [
  { title: 'Mercado imobiliário mostra resiliência', date: '16/03/2026' },
  { title: 'Novas regras para leilões judiciais', date: '15/03/2026' },
  { title: 'Dicas para arrematar imóveis com ROI acima de 30%', date: '14/03/2026' },
];

export function NewsFeed() {
  return (
    <div className="premium-card p-8 bg-brand-paper border-brand-primary/10">
      <div className="flex items-center gap-3 mb-6">
        <Newspaper className="text-brand-primary" size={24} />
        <h3 className="text-xl font-serif font-medium text-brand-primary">Feed de Notícias</h3>
      </div>
      <div className="space-y-4">
        {news.map((item, i) => (
          <div key={i} className="p-4 bg-brand-bg/30 rounded-xl border border-brand-primary/10">
            <p className="font-bold text-brand-ink">{item.title}</p>
            <p className="text-xs text-brand-ink/40 mt-1">{item.date}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
