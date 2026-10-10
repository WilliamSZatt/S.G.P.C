export const STORE = {
  fantasyName: 'Mercado & Mercearia Silva',
  legalName: 'Mercado Silva Comércio de Alimentos Ltda.',
  cnpj: '12.345.678/0001-00',
  cnpjMasked: '12.***.***/**01-**',
  segment: 'Mercado e Mercearia',
  plan: 'Plano Demonstrativo',
  tenant: 'Mercado Silva — Loja Principal',
  email: 'contato@mercadosilva.com.br',
  phone: '(11) 3456-7890',
  address: 'Rua das Flores, 123',
  complement: 'Vila Mariana',
  city: 'São Paulo',
  state: 'SP',
  cep: '04024-000',
  ie: '123.456.789.000',
};

export interface Client {
  id: string;
  name: string;
  cpf: string;
  phone: string;
  email: string;
  totalSpent: number;
  lastPurchase: string;
  status: 'active' | 'inactive';
  purchases?: Sale[];
}

export interface Product {
  id: string;
  name: string;
  description: string;
  sku: string;
  ean?: string;
  category: string;
  price: number;
  quantity: number;
  minStock: number;
  status: 'active' | 'inactive';
}

export interface Sale {
  id: string;
  client: string;
  clientId?: string;
  total: number;
  payment: string;
  status: 'completed' | 'cancelled' | 'pending';
  date: string;
  items?: { name: string; qty: number; price: number }[];
}

export const CLIENTS: Client[] = [
  { id: '1', name: 'Ana Paula Ferreira', cpf: '***.***.321-**', phone: '(11) 99234-5678', email: 'ana.ferreira@email.com', totalSpent: 1847.50, lastPurchase: '04/09/2026', status: 'active' },
  { id: '2', name: 'Roberto Nascimento', cpf: '***.***.456-**', phone: '(11) 98765-4321', email: 'roberto.nascimento@email.com', totalSpent: 3210.00, lastPurchase: '03/09/2026', status: 'active' },
  { id: '3', name: 'Mariana Costa', cpf: '***.***.789-**', phone: '(11) 97654-3210', email: 'mariana.costa@email.com', totalSpent: 654.20, lastPurchase: '28/08/2026', status: 'active' },
  { id: '4', name: 'João Pedro Santos', cpf: '***.***.012-**', phone: '(11) 96543-2109', email: 'joao.santos@email.com', totalSpent: 2100.75, lastPurchase: '01/09/2026', status: 'active' },
  { id: '5', name: 'Fernanda Lima', cpf: '***.***.345-**', phone: '(11) 95432-1098', email: 'fernanda.lima@email.com', totalSpent: 890.40, lastPurchase: '20/08/2026', status: 'inactive' },
  { id: '6', name: 'Carlos Eduardo Mota', cpf: '***.***.678-**', phone: '(11) 94321-0987', email: 'carlos.mota@email.com', totalSpent: 4500.00, lastPurchase: '05/09/2026', status: 'active' },
  { id: '7', name: 'Beatriz Alves', cpf: '***.***.901-**', phone: '(11) 93210-9876', email: 'beatriz.alves@email.com', totalSpent: 312.80, lastPurchase: '15/08/2026', status: 'active' },
  { id: '8', name: 'Rodrigo Pereira', cpf: '***.***.234-**', phone: '(11) 92109-8765', email: 'rodrigo.pereira@email.com', totalSpent: 1560.90, lastPurchase: '30/08/2026', status: 'active' },
  { id: '9', name: 'Juliana Mendes', cpf: '***.***.567-**', phone: '(11) 91098-7654', email: 'juliana.mendes@email.com', totalSpent: 720.15, lastPurchase: '02/09/2026', status: 'active' },
  { id: '10', name: 'André Luiz Barros', cpf: '***.***.890-**', phone: '(11) 90987-6543', email: 'andre.barros@email.com', totalSpent: 220.30, lastPurchase: '28/07/2026', status: 'inactive' },
];

export const PRODUCTS: Product[] = [
  { id: '1', name: 'Arroz Branco Tipo 1', description: 'Arroz branco tipo 1, pacote 5kg', sku: 'ARR-001', ean: '7891000315507', category: 'Grãos', price: 28.90, quantity: 45, minStock: 10, status: 'active' },
  { id: '2', name: 'Feijão Carioca', description: 'Feijão carioca tipo 1, pacote 1kg', sku: 'FEI-001', ean: '7891000315514', category: 'Grãos', price: 8.90, quantity: 3, minStock: 10, status: 'active' },
  { id: '3', name: 'Leite Integral', description: 'Leite integral longa vida, caixa 1L', sku: 'LEI-001', ean: '7891000315521', category: 'Laticínios', price: 5.90, quantity: 72, minStock: 20, status: 'active' },
  { id: '4', name: 'Açúcar Cristal', description: 'Açúcar cristal, pacote 5kg', sku: 'ACU-001', ean: '7891000315538', category: 'Mercearia', price: 19.90, quantity: 0, minStock: 5, status: 'active' },
  { id: '5', name: 'Óleo de Soja', description: 'Óleo de soja refinado, 900ml', sku: 'OLE-001', ean: '7891000315545', category: 'Mercearia', price: 9.50, quantity: 28, minStock: 10, status: 'active' },
  { id: '6', name: 'Macarrão Espaguete', description: 'Macarrão espaguete nº 8, 500g', sku: 'MAC-001', ean: '7891000315552', category: 'Massas', price: 4.50, quantity: 38, minStock: 15, status: 'active' },
  { id: '7', name: 'Extrato de Tomate', description: 'Extrato de tomate, lata 340g', sku: 'EXT-001', ean: '7891000315569', category: 'Conservas', price: 3.20, quantity: 55, minStock: 20, status: 'active' },
  { id: '8', name: 'Café Torrado e Moído', description: 'Café torrado e moído, 500g', sku: 'CAF-001', ean: '7891000315576', category: 'Bebidas', price: 18.90, quantity: 7, minStock: 10, status: 'active' },
  { id: '9', name: 'Sabão em Pó', description: 'Sabão em pó multiação, 1kg', sku: 'SAB-001', ean: '7891000315583', category: 'Limpeza', price: 14.90, quantity: 22, minStock: 8, status: 'active' },
  { id: '10', name: 'Biscoito Recheado', description: 'Biscoito recheado de chocolate, 130g', sku: 'BIS-001', ean: '7891000315590', category: 'Snacks', price: 3.50, quantity: 64, minStock: 20, status: 'active' },
  { id: '11', name: 'Refrigerante Cola 2L', description: 'Refrigerante sabor cola, garrafa 2L', sku: 'REF-001', ean: '7891000315607', category: 'Bebidas', price: 9.90, quantity: 18, minStock: 10, status: 'active' },
  { id: '12', name: 'Frango Congelado', description: 'Frango inteiro congelado, aprox. 2kg', sku: 'FRA-001', ean: '7891000315614', category: 'Carnes', price: 24.90, quantity: 12, minStock: 5, status: 'active' },
  { id: '13', name: 'Manteiga com Sal', description: 'Manteiga com sal, pote 200g', sku: 'MAN-001', ean: '7891000315621', category: 'Laticínios', price: 11.90, quantity: 0, minStock: 8, status: 'inactive' },
  { id: '14', name: 'Água Mineral 500ml', description: 'Água mineral sem gás, 500ml', sku: 'AGU-001', ean: '7891000315638', category: 'Bebidas', price: 2.50, quantity: 96, minStock: 30, status: 'active' },
  { id: '15', name: 'Detergente Líquido', description: 'Detergente líquido neutro, 500ml', sku: 'DET-001', ean: '7891000315645', category: 'Limpeza', price: 2.90, quantity: 31, minStock: 10, status: 'active' },
];

export const RECENT_SALES: Sale[] = [
  { id: 'VND-2609001', client: 'Ana Paula Ferreira', clientId: '1', total: 87.40, payment: 'PIX', status: 'completed', date: '05/09/2026 14:32', items: [{ name: 'Arroz Branco Tipo 1', qty: 2, price: 28.90 }, { name: 'Feijão Carioca', qty: 3, price: 8.90 }] },
  { id: 'VND-2609002', client: 'Consumidor Final', total: 43.20, payment: 'Dinheiro', status: 'completed', date: '05/09/2026 13:58', items: [{ name: 'Leite Integral', qty: 4, price: 5.90 }, { name: 'Café Torrado e Moído', qty: 1, price: 18.90 }] },
  { id: 'VND-2609003', client: 'Roberto Nascimento', clientId: '2', total: 156.80, payment: 'Crédito', status: 'completed', date: '05/09/2026 12:41', items: [{ name: 'Frango Congelado', qty: 2, price: 24.90 }, { name: 'Óleo de Soja', qty: 3, price: 9.50 }, { name: 'Arroz Branco Tipo 1', qty: 3, price: 28.90 }] },
  { id: 'VND-2609004', client: 'Consumidor Final', total: 28.90, payment: 'Débito', status: 'completed', date: '05/09/2026 11:20', items: [{ name: 'Arroz Branco Tipo 1', qty: 1, price: 28.90 }] },
  { id: 'VND-2609005', client: 'Juliana Mendes', clientId: '9', total: 94.50, payment: 'PIX', status: 'completed', date: '05/09/2026 10:05', items: [{ name: 'Biscoito Recheado', qty: 4, price: 3.50 }, { name: 'Refrigerante Cola 2L', qty: 2, price: 9.90 }, { name: 'Detergente Líquido', qty: 3, price: 2.90 }, { name: 'Sabão em Pó', qty: 2, price: 14.90 }] },
];

export const NOTIFICATIONS = {
  admin: [
    { id: '1', type: 'warning', title: 'Estoque crítico', message: 'Feijão Carioca com apenas 3 unidades em estoque.', date: '05/09/2026 14:00', read: false, link: 'stock' },
    { id: '2', type: 'error', title: 'Estoque zerado', message: 'Açúcar Cristal sem estoque disponível.', date: '05/09/2026 13:30', read: false, link: 'stock' },
    { id: '3', type: 'success', title: 'Venda concluída', message: 'Venda VND-2609003 de R$ 156,80 finalizada com sucesso.', date: '05/09/2026 12:41', read: true, link: 'reports' },
    { id: '4', type: 'info', title: 'DAS demonstrativo', message: 'DAS de agosto/2026 vence em 20/09/2026. Valor: R$ 1.240,00.', date: '04/09/2026 09:00', read: true, link: 'fiscal' },
    { id: '5', type: 'info', title: 'Usuário alterado', message: 'Carlos Oliveira teve seu perfil atualizado por Letícia Souza.', date: '03/09/2026 16:45', read: true, link: 'users' },
    { id: '6', type: 'warning', title: 'Estoque crítico', message: 'Café Torrado e Moído com apenas 7 unidades.', date: '03/09/2026 08:20', read: true, link: 'stock' },
  ],
  operator: [
    { id: '1', type: 'success', title: 'Venda concluída', message: 'Venda VND-2609001 de R$ 87,40 finalizada com sucesso.', date: '05/09/2026 14:32', read: false, link: 'pos' },
    { id: '2', type: 'error', title: 'Produto sem estoque', message: 'Açúcar Cristal não possui unidades disponíveis.', date: '05/09/2026 13:30', read: false, link: 'stock' },
    { id: '3', type: 'warning', title: 'Estoque baixo', message: 'Feijão Carioca com estoque baixo (3 un.).', date: '05/09/2026 13:00', read: true, link: 'stock' },
    { id: '4', type: 'error', title: 'Código não encontrado', message: 'Código 7891000999999 não encontrado no catálogo.', date: '05/09/2026 11:15', read: true, link: 'pos' },
  ],
};

export const TEAM_MEMBERS = [
  { id: '1', name: 'Letícia Souza', email: 'leticia.souza@mercadosilva.com.br', phone: '(11) 99876-5432', role: 'admin', status: 'active', lastActivity: '05/09/2026 14:45', createdAt: '01/01/2025' },
  { id: '2', name: 'Carlos Oliveira', email: 'carlos.oliveira@mercadosilva.com.br', phone: '(11) 99765-4321', role: 'operator', status: 'active', lastActivity: '05/09/2026 14:30', createdAt: '15/03/2025' },
  { id: '3', name: 'Patrícia Ramos', email: 'patricia.ramos@mercadosilva.com.br', phone: '(11) 99654-3210', role: 'operator', status: 'active', lastActivity: '04/09/2026 18:20', createdAt: '10/06/2025' },
  { id: '4', name: 'Marcos Teixeira', email: 'marcos.teixeira@mercadosilva.com.br', phone: '(11) 99543-2109', role: 'operator', status: 'inactive', lastActivity: '01/08/2026 09:00', createdAt: '20/08/2025' },
];

export const DASHBOARD_DATA = {
  revenue: 48720.50,
  profit: 12430.80,
  expenses: 36289.70,
  avgTicket: 89.40,
  revenueChange: +12.4,
  profitChange: +8.2,
  expensesChange: +5.1,
  avgTicketChange: -2.3,
  chartData: [
    { month: 'Mar', revenue: 38200, expenses: 28400 },
    { month: 'Abr', revenue: 41500, expenses: 30200 },
    { month: 'Mai', revenue: 39800, expenses: 29100 },
    { month: 'Jun', revenue: 44300, expenses: 32000 },
    { month: 'Jul', revenue: 46100, expenses: 34500 },
    { month: 'Ago', revenue: 47200, expenses: 35800 },
    { month: 'Set', revenue: 48720, expenses: 36290 },
  ],
};

export const FISCAL_DATA = [
  { competence: 'Set/2026', revenue: 48720.50, expenses: 36289.70, taxes: 2436.02, das: 1240.00, dueDate: '20/10/2026', status: 'pendente' },
  { competence: 'Ago/2026', revenue: 47200.00, expenses: 35800.00, taxes: 2360.00, das: 1188.00, dueDate: '20/09/2026', status: 'pendente' },
  { competence: 'Jul/2026', revenue: 46100.00, expenses: 34500.00, taxes: 2305.00, das: 1152.50, dueDate: '20/08/2026', status: 'pago' },
  { competence: 'Jun/2026', revenue: 44300.00, expenses: 32000.00, taxes: 2215.00, das: 1107.50, dueDate: '20/07/2026', status: 'pago' },
  { competence: 'Mai/2026', revenue: 39800.00, expenses: 29100.00, taxes: 1990.00, das: 995.00, dueDate: '20/06/2026', status: 'pago' },
];
