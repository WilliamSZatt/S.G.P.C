import { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { Check, ChevronDown, Zap } from '../components/Icons';

const FAQ_ITEMS = [
  { q: 'O ComércioOS é gratuito?', a: 'Oferecemos um plano demonstrativo gratuito para explorar todas as funcionalidades da plataforma. Para uso em produção, consulte nossos planos disponíveis.' },
  { q: 'Preciso instalar algum software?', a: 'Não. O ComércioOS é 100% web. Acesse de qualquer computador, tablet ou celular com um navegador moderno.' },
  { q: 'Meus dados ficam seguros?', a: 'Sim. Utilizamos criptografia em todos os dados e seguimos as diretrizes da LGPD. Seus dados nunca são compartilhados com terceiros.' },
  { q: 'Posso usar no celular?', a: 'Sim, o sistema é responsivo e funciona em dispositivos móveis. O PDV foi especialmente otimizado para uso em tablets.' },
  { q: 'Quantos usuários posso cadastrar?', a: 'Depende do plano contratado. No plano demonstrativo, você pode cadastrar até 5 usuários com diferentes perfis de acesso.' },
];

const FEATURES = [
  { icon: '🏪', title: 'PDV Rápido', desc: 'Finalize vendas em segundos com busca por código de barras, nome ou SKU.' },
  { icon: '📦', title: 'Controle de Estoque', desc: 'Acompanhe entradas, saídas e receba alertas de produtos com estoque crítico.' },
  { icon: '👥', title: 'Gestão de Clientes', desc: 'Cadastre clientes, acompanhe o histórico de compras e fidelize seu público.' },
  { icon: '📊', title: 'Relatórios Gerenciais', desc: 'Analise receitas, despesas e indicadores de desempenho em tempo real.' },
  { icon: '👤', title: 'Controle de Acesso', desc: 'Defina permissões por perfil: Administrador/Gerente e Operador/Funcionário.' },
];

const SERVICES = [
  {
    icon: '🚀',
    title: 'Implantação Assistida',
    desc: 'Nossa equipe acompanha a configuração inicial do sistema, migração de dados e treinamento da equipe no seu ritmo.',
    tags: ['Onboarding', 'Configuração', 'Treinamento'],
  },
  {
    icon: '🛒',
    title: 'PDV na Nuvem',
    desc: 'Ponto de venda completo, sem hardware obrigatório. Funciona em qualquer dispositivo com acesso à internet.',
    tags: ['Vendas', 'Mobilidade', 'Sem instalação'],
  },
  {
    icon: '📋',
    title: 'Gestão comercial integrada',
    desc: 'Centralize vendas, clientes, estoque e relatórios em uma única plataforma.',
    tags: ['Vendas', 'Estoque', 'Relatórios'],
  },
  {
    icon: '📈',
    title: 'Business Intelligence',
    desc: 'Relatórios gerenciais detalhados com gráficos, KPIs e comparativos de período para decisões baseadas em dados.',
    tags: ['Relatórios', 'Análise', 'Decisões'],
  },
  {
    icon: '🔒',
    title: 'Segurança e LGPD',
    desc: 'Criptografia ponta a ponta, controle de acesso por perfil e conformidade com a Lei Geral de Proteção de Dados.',
    tags: ['Segurança', 'LGPD', 'Privacidade'],
  },
  {
    icon: '🤝',
    title: 'Suporte Dedicado',
    desc: 'Atendimento em português por WhatsApp, e-mail e base de conhecimento. Resposta rápida para quem não pode parar.',
    tags: ['Suporte', 'WhatsApp', 'Português'],
  },
];

const HOW_IT_WORKS = [
  { step: '01', title: 'Cadastre seu comércio', desc: 'Preencha os dados do estabelecimento e crie sua conta de Administrador.' },
  { step: '02', title: 'Configure o sistema', desc: 'Adicione produtos, configure o estoque inicial e cadastre sua equipe.' },
  { step: '03', title: 'Comece a vender', desc: 'Abra o PDV e registre suas vendas com rapidez e segurança.' },
  { step: '04', title: 'Acompanhe os resultados', desc: 'Visualize relatórios e tome decisões baseadas em dados reais do seu negócio.' },
];

const NAV_LINKS: [string, string][] = [
  ['sobre', 'Sobre'],
  ['como-funciona', 'Como funciona'],
  ['servicos', 'Serviços'],
  ['planos', 'Planos'],
  ['faq', 'FAQ'],
];

function SatisfactionDonut({ value }: { value: number }) {
  const cx = 90, cy = 82, R = 66, strokeW = 13;
  // Flat semicircle: left (180°) → right (0°), clockwise
  const startA = Math.PI;
  const spanA  = Math.PI;
  const valueA = startA + (value / 100) * spanA;
  const p = (r: number, a: number): [number, number] => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  const arc = (a1: number, a2: number, r: number) => {
    const [x1, y1] = p(r, a1);
    const [x2, y2] = p(r, a2);
    return `M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`;
  };
  const ticks = Array.from({ length: 11 }, (_, i) => startA + (i / 10) * spanA);
  const [nx, ny] = p(R - 14, valueA);

  return (
    <svg width="180" height="108" viewBox="0 0 180 108" className="flex-shrink-0">
      <defs>
        <linearGradient id="gGrad" gradientUnits="userSpaceOnUse"
          x1={p(R, startA)[0]} y1={p(R, startA)[1]}
          x2={p(R, startA + spanA)[0]} y2={p(R, startA + spanA)[1]}>
          <stop offset="0%"   stopColor="#C65B42"/>
          <stop offset="50%"  stopColor="#E8753D"/>
          <stop offset="100%" stopColor="#4F8B69"/>
        </linearGradient>
        <filter id="gGlow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="3.5" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* Halo */}
      <path d={arc(startA, startA + spanA, R)} fill="none"
        stroke="rgba(255,255,255,0.04)" strokeWidth={strokeW + 10} strokeLinecap="butt"/>
      {/* Track */}
      <path d={arc(startA, startA + spanA, R)} fill="none"
        stroke="rgba(255,255,255,0.09)" strokeWidth={strokeW} strokeLinecap="butt"/>
      {/* Filled glow layer */}
      <path d={arc(startA, valueA, R)} fill="none"
        stroke="url(#gGrad)" strokeWidth={strokeW} strokeLinecap="butt"
        filter="url(#gGlow)" opacity="0.45"/>
      {/* Filled arc */}
      <path d={arc(startA, valueA, R)} fill="none"
        stroke="url(#gGrad)" strokeWidth={strokeW} strokeLinecap="butt"/>

      {/* Flat base line */}
      <line x1={cx - R - strokeW / 2} y1={cy} x2={cx + R + strokeW / 2} y2={cy}
        stroke="rgba(255,255,255,0.08)" strokeWidth="1"/>

      {/* Tick marks */}
      {ticks.map((a, i) => {
        const major = i % 5 === 0;
        const [ox, oy] = p(R - strokeW / 2 - 1, a);
        const [ix, iy] = p(R - strokeW / 2 - (major ? 8 : 5), a);
        return <line key={i} x1={ox} y1={oy} x2={ix} y2={iy}
          stroke={major ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.2)'}
          strokeWidth={major ? 1.5 : 1} strokeLinecap="round"/>;
      })}

      {/* Needle shadow */}
      <line x1={cx} y1={cy} x2={nx + 1} y2={ny + 1}
        stroke="rgba(0,0,0,0.35)" strokeWidth="3" strokeLinecap="round"/>
      {/* Needle */}
      <line x1={cx} y1={cy} x2={nx} y2={ny}
        stroke="white" strokeWidth="2.5" strokeLinecap="round"/>

      {/* Hub */}
      <circle cx={cx} cy={cy} r="9"   fill="rgba(255,255,255,0.12)"/>
      <circle cx={cx} cy={cy} r="6.5" fill="white"/>
      <circle cx={cx} cy={cy} r="3"   fill="#E8753D"/>

      {/* Range labels */}
      <text x={p(R + strokeW / 2 + 8, startA)[0]} y={cy + 4}
        textAnchor="end" fontSize="8" fill="rgba(255,255,255,0.35)" fontFamily="'DM Sans',sans-serif">0</text>
      <text x={p(R + strokeW / 2 + 8, startA + spanA)[0]} y={cy + 4}
        textAnchor="start" fontSize="8" fill="rgba(255,255,255,0.35)" fontFamily="'DM Sans',sans-serif">100</text>

      {/* Value below hub */}
      <text x={cx} y={cy + 20} textAnchor="middle" fontSize="20" fontWeight="700"
        fill="white" fontFamily="'Space Grotesk',sans-serif">{value}%</text>
    </svg>
  );
}

export default function Home() {
  const { navigate } = useApp();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-full bg-[#FFF9F4]">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-[#FFF9F4]/95 backdrop-blur border-b border-[#1F2926]/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="font-display font-bold text-xl text-[#1F2926]">ComércioOS</div>

            <div className="hidden md:flex items-center gap-6 text-sm font-medium text-[#1F2926]/70">
              {NAV_LINKS.map(([id, label]) => (
                <button key={id} onClick={() => scrollTo(id)} className="hover:text-[#1F2926] transition-colors">{label}</button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <button onClick={() => navigate('login')} className="hidden sm:block text-sm font-medium text-[#1F2926] hover:text-[#E8753D] transition-colors">
                Entrar
              </button>
              <button onClick={() => navigate('register')} className="bg-[#E8753D] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[#d4662e] transition-colors">
                Começar agora
              </button>
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-[#1F2926]">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
              </button>
            </div>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden border-t border-[#1F2926]/10 py-4 space-y-2">
              {NAV_LINKS.map(([id, label]) => (
                <button key={id} onClick={() => scrollTo(id)} className="block w-full text-left py-2 text-sm font-medium text-[#1F2926]/70 hover:text-[#1F2926]">{label}</button>
              ))}
              <button onClick={() => navigate('login')} className="block w-full text-left py-2 text-sm font-medium text-[#1F2926]">Entrar</button>
            </div>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-20 pb-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-[#4F8B69]/10 text-[#4F8B69] text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
              <Zap size={13} />
              Plataforma SaaS para pequenos comércios
            </div>
            <h1 className="font-display font-bold text-4xl lg:text-5xl text-[#1F2926] leading-tight mb-6">
              A gestão do seu comércio, simples e no controle.
            </h1>
            <p className="text-[#1F2926]/60 text-lg leading-relaxed mb-8">
              Centralize vendas, clientes, estoque e resultados em uma única plataforma. Do PDV ao relatório gerencial, tudo integrado.
            </p>
            <div className="flex flex-wrap gap-3">
              <button onClick={() => navigate('register')} className="bg-[#E8753D] text-white font-semibold px-6 py-3 rounded-xl hover:bg-[#d4662e] transition-colors shadow-lg shadow-[#E8753D]/20">
                Começar gratuitamente
              </button>
              <button onClick={() => scrollTo('funcionalidades')} className="border border-[#1F2926]/20 text-[#1F2926] font-semibold px-6 py-3 rounded-xl hover:bg-[#1F2926]/5 transition-colors">
                Conhecer a plataforma
              </button>
            </div>
          </div>

          {/* Dashboard preview */}
          <div className="relative">
            <div className="bg-[#1F2926] rounded-2xl p-5 shadow-2xl">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-[#C65B42]"/>
                <div className="w-3 h-3 rounded-full bg-amber-400"/>
                <div className="w-3 h-3 rounded-full bg-[#4F8B69]"/>
                <div className="ml-2 flex-1 bg-white/10 rounded h-4 text-[10px] text-white/40 flex items-center px-2">app.comercioos.com.br</div>
              </div>
              <div className="bg-[#F6F7F8] rounded-xl p-3">
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {[
                    { label: 'Receita', value: 'R$ 48.720', color: '#4F8B69', up: true },
                    { label: 'Ticket Médio', value: 'R$ 89,40', color: '#4D7CA8', up: false },
                    { label: 'Vendas Hoje', value: '47', color: '#E8753D', up: true },
                    { label: 'Estoque Baixo', value: '3 itens', color: '#C65B42', up: false },
                  ].map(item => (
                    <div key={item.label} className="bg-white rounded-lg p-2.5">
                      <div className="text-[10px] text-gray-500">{item.label}</div>
                      <div className="font-display font-bold text-sm text-gray-900 mt-0.5">{item.value}</div>
                      <div className="text-[10px] font-medium mt-0.5" style={{ color: item.color }}>{item.up ? '↑ 12,4%' : '↓ 2,3%'}</div>
                    </div>
                  ))}
                </div>
                <div className="bg-white rounded-lg p-2.5">
                  <div className="text-[10px] text-gray-500 mb-2">Receitas e Despesas — Set/2026</div>
                  <div className="flex items-end gap-1 h-14">
                    {[60,70,65,75,80,82,90].map((h, i) => (
                      <div key={i} className="flex-1 flex flex-col gap-0.5 justify-end">
                        <div className="rounded-sm bg-[#4F8B69]/30" style={{ height: `${h * 0.7}%` }}/>
                        <div className="rounded-sm bg-[#C65B42]/30" style={{ height: `${h * 0.5}%` }}/>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-3 -right-3 bg-[#E8753D] text-white text-xs font-semibold px-3 py-2 rounded-xl shadow-lg">
              PDV em 3 cliques ⚡
            </div>
          </div>
        </div>
      </section>

      {/* Benefits bar */}
      <section className="bg-white py-16 border-y border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: '⚡', title: 'Agilidade no atendimento', desc: 'PDV otimizado para velocidade no balcão.' },
              { icon: '📦', title: 'Controle de estoque', desc: 'Alertas automáticos de produtos críticos.' },
              { icon: '📊', title: 'Clareza dos dados', desc: 'Relatórios claros e indicadores em tempo real.' },
              { icon: '🔗', title: 'Centralização total', desc: 'Vendas, clientes, estoque e relatórios em um só lugar.' },
            ].map(item => (
              <div key={item.title} className="text-center">
                <div className="text-3xl mb-3">{item.icon}</div>
                <div className="font-display font-semibold text-[#1F2926] mb-2">{item.title}</div>
                <div className="text-sm text-gray-500">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="funcionalidades" className="py-20 max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <h2 className="font-display font-bold text-3xl text-[#1F2926] mb-4">Tudo que seu comércio precisa</h2>
          <p className="text-gray-500 max-w-xl mx-auto">Uma plataforma completa para gerenciar seu negócio do início ao fim.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map(f => (
            <div key={f.title} className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="text-3xl mb-4">{f.icon}</div>
              <h3 className="font-display font-semibold text-[#1F2926] mb-2">{f.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

      </section>

      {/* About */}
      <section id="sobre" className="bg-[#1F2926] py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="text-[#E8753D] text-sm font-semibold mb-4">Sobre o ComércioOS</div>
              <h2 className="font-display font-bold text-3xl text-white mb-6">Feito para o pequeno comércio brasileiro</h2>
              <p className="text-white/60 leading-relaxed mb-6">
                O ComércioOS nasceu da necessidade real de pequenos comerciantes: centralizar a gestão sem precisar de múltiplos sistemas ou planilhas. Nossa plataforma foi desenhada para ser simples, rápida e acessível.
              </p>
              <ul className="space-y-3">
                {['Sem instalação — 100% na nuvem', 'Dados seguros com criptografia', 'Acesso por perfil de usuário', 'Suporte em português'].map(item => (
                  <li key={item} className="flex items-center gap-3 text-white/80 text-sm">
                    <div className="w-5 h-5 rounded-full bg-[#4F8B69] flex items-center justify-center flex-shrink-0">
                      <Check size={12} />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-col gap-4">
              {/* Donut satisfaction chart */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-center gap-5">
                {/* Gauge */}
                <div className="flex-shrink-0">
                  <SatisfactionDonut value={98} />
                </div>
                {/* Content */}
                <div className="flex flex-col gap-3 min-w-0">
                  <div>
                    <div className="text-white/40 text-[10px] font-semibold tracking-widest uppercase mb-1">Satisfação</div>
                    <div className="font-display font-bold text-3xl text-white leading-none">98%</div>
                    <div className="text-white/50 text-xs mt-1 leading-snug">dos clientes aprovam a plataforma</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-1.5">
                      {['#E8753D','#4F8B69','#4D7CA8','#C65B42'].map(c => (
                        <div key={c} className="w-6 h-6 rounded-full border-2 border-[#1F2926] flex items-center justify-center text-[9px] font-bold text-white" style={{ background: c }}>✓</div>
                      ))}
                    </div>
                    <span className="text-white/40 text-xs">+2.400 comércios</span>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#C65B42] inline-block"/>
                      <span className="text-white/40 text-[10px]">Regular</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#E8753D] inline-block"/>
                      <span className="text-white/40 text-[10px]">Bom</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#4F8B69] inline-block"/>
                      <span className="text-white/40 text-[10px]">Ótimo</span>
                    </div>
                  </div>
                </div>
              </div>
              {/* Other stats */}
              <div className="grid grid-cols-3 gap-4">
                {[
                  { val: '2.400+', label: 'Comércios cadastrados' },
                  { val: 'R$ 8M+', label: 'Em vendas processadas' },
                  { val: '24/7', label: 'Disponibilidade' },
                ].map(s => (
                  <div key={s.label} className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <div className="font-display font-bold text-xl text-[#E8753D]">{s.val}</div>
                    <div className="text-white/60 text-xs mt-1 leading-snug">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="como-funciona" className="py-20 max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <h2 className="font-display font-bold text-3xl text-[#1F2926] mb-4">Como funciona</h2>
          <p className="text-gray-500">Em 4 passos simples você está operando.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {HOW_IT_WORKS.map(step => (
            <div key={step.step} className="relative">
              <div className="font-display font-bold text-5xl text-[#E8753D]/15 mb-2">{step.step}</div>
              <h3 className="font-display font-semibold text-[#1F2926] mb-2">{step.title}</h3>
              <p className="text-sm text-gray-500">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Services */}
      <section id="servicos" className="bg-[#F6F7F8] py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-[#E8753D]/10 text-[#E8753D] text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
              O que oferecemos
            </div>
            <h2 className="font-display font-bold text-3xl text-[#1F2926] mb-4">Nossos serviços</h2>
            <p className="text-gray-500 max-w-xl mx-auto">Muito além de um software — somos parceiros no crescimento do seu comércio.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {SERVICES.map(s => (
              <div key={s.title} className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-md transition-shadow group">
                <div className="text-3xl mb-4">{s.icon}</div>
                <h3 className="font-display font-semibold text-[#1F2926] mb-2 group-hover:text-[#E8753D] transition-colors">{s.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed mb-4">{s.desc}</p>
                <div className="flex flex-wrap gap-1.5">
                  {s.tags.map(tag => (
                    <span key={tag} className="text-[11px] font-medium bg-[#1F2926]/5 text-[#1F2926]/60 px-2 py-0.5 rounded-full">{tag}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <button
              onClick={() => navigate('register')}
              className="bg-[#E8753D] text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-[#d4662e] transition-colors shadow-lg shadow-[#E8753D]/20"
            >
              Quero conhecer de perto
            </button>
          </div>
        </div>
      </section>

      {/* Plans */}
      <section id="planos" className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">Dados demonstrativos</div>
            <h2 className="font-display font-bold text-3xl text-[#1F2926] mb-4">Planos demonstrativos</h2>
            <p className="text-gray-500">Explore as funcionalidades sem compromisso. Planos reais serão anunciados em breve.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: 'Básico', price: 'Demonstrativo', features: ['PDV completo', 'Até 3 usuários', 'Estoque ilimitado', 'Relatórios básicos'], highlight: false },
              { name: 'Profissional', price: 'Demonstrativo', features: ['PDV completo', 'Usuários ilimitados', 'Gestão de estoque', 'Relatórios avançados', 'Suporte prioritário'], highlight: true },
              { name: 'Empresarial', price: 'Demonstrativo', features: ['Tudo do Profissional', 'Multi-loja', 'API de integração', 'Treinamento dedicado', 'SLA garantido'], highlight: false },
            ].map(plan => (
              <div key={plan.name} className={`rounded-2xl p-6 border ${plan.highlight ? 'bg-[#1F2926] border-[#1F2926] text-white' : 'bg-white border-gray-100'}`}>
                <div className={`text-sm font-semibold mb-1 ${plan.highlight ? 'text-[#E8753D]' : 'text-gray-500'}`}>{plan.price}</div>
                <div className={`font-display font-bold text-2xl mb-6 ${plan.highlight ? 'text-white' : 'text-[#1F2926]'}`}>{plan.name}</div>
                <ul className="space-y-2 mb-6">
                  {plan.features.map(f => (
                    <li key={f} className={`flex items-center gap-2 text-sm ${plan.highlight ? 'text-white/80' : 'text-gray-600'}`}>
                      <Check size={14} className="text-[#4F8B69]" />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => navigate('register')}
                  className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-colors ${plan.highlight ? 'bg-[#E8753D] text-white hover:bg-[#d4662e]' : 'border border-[#1F2926]/20 text-[#1F2926] hover:bg-gray-50'}`}
                >
                  Começar gratuitamente
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#151e1b] pt-16 pb-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          {/* FAQ in footer */}
          <div className="mb-12">
            <h3 id="faq" className="font-display font-bold text-white text-xl mb-6">Perguntas frequentes</h3>
            <div className="grid md:grid-cols-2 gap-3">
              {FAQ_ITEMS.map((item, i) => (
                <div key={i} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between p-4 text-left"
                  >
                    <span className="font-medium text-white/80 text-sm">{item.q}</span>
                    <ChevronDown size={15} className={`text-white/40 transition-transform flex-shrink-0 ml-4 ${openFaq === i ? 'rotate-180' : ''}`} />
                  </button>
                  {openFaq === i && (
                    <div className="px-4 pb-4 text-sm text-white/50 leading-relaxed border-t border-white/10 pt-3">
                      {item.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <div className="font-display font-bold text-white text-lg">ComércioOS</div>
              <div className="text-white/40 text-xs mt-1">Plataforma SaaS para pequenos comércios</div>
            </div>
            <div className="text-white/40 text-xs text-center">
              © 2026 ComércioOS — Protótipo demonstrativo. Dados fictícios.
            </div>
            <div className="flex gap-4 text-white/40 text-xs">
              <span>Termos de Uso</span>
              <span>Privacidade</span>
            </div>
          </div>
        </div>
      </footer>

      {/* WhatsApp floating button */}
      <a
        href="https://wa.me/5511999999999"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
        style={{ background: '#25D366' }}
        aria-label="Falar pelo WhatsApp"
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      </a>
    </div>
  );
}
