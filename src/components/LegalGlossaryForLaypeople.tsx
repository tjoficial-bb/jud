import React, { useState } from 'react';
import { BookOpen, Search, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface GlossaryTerm {
  term: string;
  definition: string;
  laymanExplanation: string;
  category: 'Geral' | 'Dívidas' | 'Garantias' | 'Processo';
}

const GLOSSARY_TERMS: GlossaryTerm[] = [
  {
    term: 'Arrematante',
    definition: 'Aquele que adquire um bem em leilão público (judicial ou extrajudicial) mediante o maior lance.',
    laymanExplanation: 'O comprador vencedor do leilão. É quem dá o lance final e passa a ser o novo proprietário do imóvel.',
    category: 'Geral'
  },
  {
    term: 'Executado',
    definition: 'O devedor em um processo judicial de execução contra quem é promovida a expropriação de bens.',
    laymanExplanation: 'O antigo proprietário do imóvel que acumulou uma dívida não paga. O juiz determinou o leilão do imóvel dele para saldar esse débito com o credor.',
    category: 'Processo'
  },
  {
    term: 'Alienação Fiduciária',
    definition: 'Negócio jurídico pelo qual o devedor, a título de garantia, transfere ao credor a propriedade resolúvel de coisa imóvel.',
    laymanExplanation: 'A forma padrão de financiamento hoje. Você compra o imóvel com dinheiro do banco, mas o imóvel fica no nome do banco como garantia. Se você não pagar as parcelas, o banco retoma o imóvel diretamente (extrajudicialmente) e o leva a leilão.',
    category: 'Garantias'
  },
  {
    term: 'Consolidação da Propriedade',
    definition: 'Ato de registro em que o credor fiduciário passa a ter a propriedade plena e definitiva do imóvel, devido ao inadimplemento do devedor.',
    laymanExplanation: 'O momento em que o banco oficializa no cartório que o imóvel agora é 100% dele por falta de pagamento do financiamento. Isso dá o direito legal para o banco leiloar o imóvel.',
    category: 'Garantias'
  },
  {
    term: 'Propter Rem',
    definition: 'Obrigação acessória real que se vincula à propriedade do próprio bem, transmitindo-se ao novo adquirente.',
    laymanExplanation: 'Dívidas "ligadas à coisa" (ao próprio imóvel), como condomínio e IPTU. Elas perseguem o imóvel de forma que, se o edital do leilão não disser o contrário, quem arrematar pode herdar essas dívidas anteriores.',
    category: 'Dívidas'
  },
  {
    term: 'Sub-rogação sobre o preço',
    definition: 'Transferência de direitos ou encargos. No leilão de imóveis, refere-se ao mecanismo pelo qual as dívidas fiscais anteriores (como IPTU) são pagas diretamente com o valor do lance dado pelo arrematante.',
    laymanExplanation: 'Uma excelente proteção para o comprador. Significa que as dívidas de IPTU anteriores serão descontadas do dinheiro que você pagou pelo lance. O imóvel é entregue a você totalmente limpo e quitado desses impostos.',
    category: 'Dívidas'
  },
  {
    term: 'Imissão na Posse',
    definition: 'Ato judicial que confere a posse de direito e de fato de um bem àquele que adquiriu a propriedade sem a possuir.',
    laymanExplanation: 'O processo ou ordem do juiz para retirar eventuais ocupantes do imóvel e entregar as chaves definitivamente nas suas mãos, permitindo que você entre e tome posse física do bem.',
    category: 'Processo'
  },
  {
    term: 'Preço Vil',
    definition: 'Preço considerado irrisório, incapaz de satisfazer minimamente a execução. Geralmente fixado abaixo de 50% do valor da avaliação judicial.',
    laymanExplanation: 'Um lance excessivamente baixo. A lei brasileira proíbe arrematar imóveis por valores muito baixos (normalmente menos da metade do valor real de mercado), pois isso pode gerar a anulação do leilão por parte do juiz.',
    category: 'Geral'
  },
  {
    term: 'Evicção',
    definition: 'Perda da propriedade ou posse de um bem por força de sentença judicial que reconhece direito anterior de terceiro.',
    laymanExplanation: 'É o risco (raro na assessoria especializada) do negócio ser desfeito pela justiça devido a alguma anulação do leilão. Se isso acontecer, você tem o direito garantido por lei de receber todo o seu dinheiro de volta.',
    category: 'Geral'
  },
  {
    term: 'Carta de Arrematação',
    definition: 'Documento judicial oficial que serve como título de propriedade para o arrematante transferir o imóvel para seu nome no Cartório de Registro de Imóveis.',
    laymanExplanation: 'O "recibo oficial" e escritura expedidos pelo juiz após o leilão. É o documento definitivo que você levará ao cartório de imóveis para registrar que você é o novo e legítimo dono.',
    category: 'Processo'
  },
  {
    term: 'Praça (ou Leilão)',
    definition: 'Designação das sessões públicas onde os bens penhorados são oferecidos para lances.',
    laymanExplanation: 'As rodadas do leilão. A 1ª praça ocorre pelo valor total avaliado do imóvel. Se ninguém comprar, abre-se a 2ª praça (geralmente poucos dias depois), onde o imóvel é oferecido com grande desconto (geralmente 50%).',
    category: 'Geral'
  }
];

export const LegalGlossaryForLaypeople: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [expandedTerms, setExpandedTerms] = useState<Record<string, boolean>>({});

  const toggleTerm = (term: string) => {
    setExpandedTerms(prev => ({
      ...prev,
      [term]: !prev[term]
    }));
  };

  const categories = ['Todos', 'Geral', 'Dívidas', 'Garantias', 'Processo'];

  const filteredTerms = GLOSSARY_TERMS.filter(item => {
    const matchesSearch = item.term.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.laymanExplanation.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'Todos' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (!isOpen) {
    return (
      <div className="bg-brand-paper/70 rounded-2xl border border-brand-border/60 p-4 no-print flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-brand-primary/10 text-brand-primary rounded-xl">
            <BookOpen size={16} />
          </div>
          <div>
            <h5 className="text-xs font-bold text-brand-ink">Dicionário Jurídico Descomplicado ({GLOSSARY_TERMS.length} termos)</h5>
            <p className="text-[10px] text-brand-ink/50">Consulte o significado prático de termos como Arrematante, Alienação Fiduciária, Propter Rem, etc.</p>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary rounded-xl text-xs font-bold transition-all"
        >
          <span>Expandir Dicionário</span>
          <ChevronDown size={14} />
        </button>
      </div>
    );
  }

  return (
    <div className="bg-brand-paper rounded-[2rem] border border-brand-primary/10 p-6 sm:p-8 space-y-6 shadow-sm no-print animate-in fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-brand-border/40 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-brand-primary/10 text-brand-primary rounded-xl">
            <BookOpen size={20} />
          </div>
          <div>
            <h4 className="text-lg font-bold text-brand-primary font-sans">
              Dicionário Jurídico Descomplicado
            </h4>
            <p className="text-xs text-brand-ink/40 font-sans">
              Entenda os termos técnicos da análise como um especialista
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsOpen(false)}
          className="flex items-center gap-1 text-xs font-bold text-brand-ink/50 hover:text-brand-primary self-end md:self-auto"
        >
          <span>Recolher</span>
          <ChevronUp size={14} />
        </button>
      </div>
        
        {/* Category selector */}
        <div className="flex flex-wrap gap-1.5 bg-brand-bg/40 p-1 rounded-xl border border-brand-primary/5 self-start md:self-auto">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${selectedCategory === cat ? 'bg-brand-primary text-black' : 'text-brand-ink/65 hover:text-brand-primary'}`}
            >
              {cat}
            </button>
          ))}
        </div>

      {/* Search Input */}
      <div className="relative">
        <span className="absolute inset-y-0 left-3 flex items-center text-brand-ink/30 pointer-events-none">
          <Search size={16} />
        </span>
        <input
          type="text"
          placeholder="Pesquisar termo ou conceito (ex: IPTU, imissão, etc...)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-brand-bg/40 border border-brand-border/50 rounded-xl py-2.5 pl-10 pr-4 text-xs text-brand-ink outline-none focus:ring-1 focus:ring-brand-primary transition-all placeholder-brand-ink/30"
        />
      </div>

      {/* Grid of terms */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredTerms.length > 0 ? (
          filteredTerms.map((item) => {
            const isExpanded = expandedTerms[item.term] || false;
            return (
              <div 
                key={item.term}
                className="bg-brand-bg/30 border border-brand-border/30 rounded-2xl p-4 hover:border-brand-primary/20 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-brand-primary font-sans px-2.5 py-0.5 rounded-full bg-brand-primary/10 border border-brand-primary/10">
                      {item.term}
                    </span>
                    <span className="text-[10px] font-medium text-brand-ink/40 uppercase tracking-wider font-mono">
                      {item.category}
                    </span>
                  </div>
                  
                  {/* Layman/Simple description (Highlighted) */}
                  <p className="text-xs text-brand-ink font-sans leading-relaxed mt-1 mb-2 font-medium">
                    💡 <strong className="text-brand-ink">Em linguagem simples:</strong> {item.laymanExplanation}
                  </p>

                  {/* Technical definition collapsible */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-brand-border/30 animate-in fade-in duration-300">
                      <span className="text-[10px] uppercase font-bold text-brand-ink/30 tracking-wider block mb-1">Definição Técnica Jurídica</span>
                      <p className="text-[11px] text-brand-ink/65 italic leading-relaxed font-sans">
                        "{item.definition}"
                      </p>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => toggleTerm(item.term)}
                  className="mt-3 text-[11px] font-semibold text-brand-primary hover:text-brand-primary/80 flex items-center gap-1 self-end transition-colors"
                >
                  {isExpanded ? (
                    <>
                      Esconder termo jurídico <ChevronUp size={12} />
                    </>
                  ) : (
                    <>
                      Ver definição técnica <ChevronDown size={12} />
                    </>
                  )}
                </button>
              </div>
            );
          })
        ) : (
          <div className="col-span-full py-8 text-center text-xs text-brand-ink/40">
            Nenhum termo técnico encontrado para a busca realizada.
          </div>
        )}
      </div>
    </div>
  );
};
