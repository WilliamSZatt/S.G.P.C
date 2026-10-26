import { useEffect, useState, useRef } from 'react';
import { useApp } from '../contexts/AppContext';
import AuthLayout from '../components/AuthLayout';
import { Search, Plus, Minus, X, Barcode, CreditCard, ShoppingCart, Check, User } from '../components/Icons';
import { api } from '../lib/api';

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const ESTIMATED_TAX_RATE = 0.0865;

interface CartItem { product: Product; qty: number }
interface Product { id: string; name: string; description: string; sku: string; ean?: string; category: string; price: number; quantity: number; minStock: number; status: 'active' | 'inactive' }
interface Client { id: string; name: string; email: string; status: 'active' | 'inactive' }

type PayMethod = 'dinheiro' | 'credito' | 'debito' | 'pix';
type SaleState = 'idle' | 'loading' | 'success' | 'error-stock' | 'error-payment' | 'error-network';
type ScanState = 'ready' | 'scanning' | 'found' | 'not-found' | 'error';

const PAY_METHODS: { key: PayMethod; label: string; icon: string }[] = [
  { key: 'dinheiro', label: 'Dinheiro', icon: '💵' },
  { key: 'pix', label: 'PIX', icon: '📲' },
  { key: 'credito', label: 'Crédito', icon: '💳' },
  { key: 'debito', label: 'Débito', icon: '🏧' },
];

export default function POSPage() {
  const { showToast } = useApp();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [clientError, setClientError] = useState('');
  const [discount, setDiscount] = useState('');
  const [payMethod, setPayMethod] = useState<PayMethod | null>(null);
  const [cashReceived, setCashReceived] = useState('');
  const [saleState, setSaleState] = useState<SaleState>('idle');
  const [lastSale, setLastSale] = useState<{
    id: string;
    subtotal: number;
    discount: number;
    total: number;
    change: number;
    clientName: string;
    items: CartItem[];
    completedAt: string;
  } | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [scanState, setScanState] = useState<ScanState>('ready');
  const [scanResult, setScanResult] = useState<Product | null>(null);
  const [showClientPicker, setShowClientPicker] = useState(false);
  const [clientSearch, setClientSearch] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [allowDiscount, setAllowDiscount] = useState(true);
  const [requireClient, setRequireClient] = useState(true);
  const [printReceipt, setPrintReceipt] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get<{ items: Product[] }>('/inventory/products', { params: { status: 'active' } }),
      api.get<{ items: Client[] }>('/clients', { params: { status: 'active', limit: 100 } }),
      api.get<{ store: { allowDiscount: boolean; requireClient: boolean; printReceipt: boolean } }>('/auth/store')
    ])
      .then(([productResponse, clientResponse, storeResponse]) => {
        setProducts(productResponse.data.items.map(product => ({ ...product, status: product.status.toLowerCase() as Product['status'] })));
        setClients(clientResponse.data.items.map(client => ({ ...client, status: client.status.toLowerCase() as Client['status'] })));
        setAllowDiscount(storeResponse.data.store.allowDiscount);
        setRequireClient(storeResponse.data.store.requireClient);
        setPrintReceipt(storeResponse.data.store.printReceipt);
      })
      .catch(() => showToast({ type: 'error', message: 'Não foi possível carregar produtos e clientes.' }));
  }, [showToast]);

  const filteredProducts = products.filter(p => p.status === 'active' && (!search || p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase()) || (p.ean || '').includes(search)));

  const subtotal = cart.reduce((s, i) => s + i.product.price * i.qty, 0);
  const discountAmt = parseFloat(discount) || 0;
  const total = Math.max(0, subtotal - discountAmt);
  const change = payMethod === 'dinheiro' ? Math.max(0, (parseFloat(cashReceived) || 0) - total) : 0;

  const addToCart = (p: Product) => {
    if (p.quantity === 0) { showToast({ type: 'error', message: 'Produto sem estoque disponível.' }); return; }
    setCart(prev => {
      const exists = prev.find(i => i.product.id === p.id);
      if (exists) {
        if (exists.qty >= p.quantity) { showToast({ type: 'warning', message: 'Quantidade máxima em estoque atingida.' }); return prev; }
        return prev.map(i => i.product.id === p.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { product: p, qty: 1 }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart(prev => prev.map(i => i.product.id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i).filter(i => i.qty > 0));
  };

  const removeFromCart = (id: string) => setCart(prev => prev.filter(i => i.product.id !== id));

  const simulateScan = () => {
    setScanState('scanning');
    setTimeout(() => {
      const available = products.filter(p => p.status === 'active' && p.quantity > 0);
      const found = available[Math.floor(Math.random() * available.length)];
      if (found) { setScanState('found'); setScanResult(found); }
      else setScanState('not-found');
    }, 1800);
  };

  const addScanned = () => {
    if (scanResult) { addToCart(scanResult); setShowScanner(false); setScanState('ready'); setScanResult(null); }
  };

  const finalizeSale = async () => {
    if (cart.length === 0) { showToast({ type: 'error', message: 'O carrinho está vazio.' }); return; }
    if (requireClient && !selectedClient) { setClientError('Associe um cliente antes de finalizar a venda.'); return; }
    if (!payMethod) { showToast({ type: 'error', message: 'Selecione uma forma de pagamento.' }); return; }
    if (payMethod === 'dinheiro' && (parseFloat(cashReceived) || 0) < total) {
      showToast({ type: 'error', message: 'Valor recebido insuficiente.' }); return;
    }
    setSaleState('loading');
    try {
      const { data } = await api.post<{ sale: { number: string; total: number; change: number | null } }>('/sales', {
        clientId: selectedClient || undefined,
        discount: discountAmt,
        paymentMethod: payMethod,
        cashReceived: payMethod === 'dinheiro' ? Number(cashReceived) : undefined,
        items: cart.map(item => ({ productId: item.product.id, quantity: item.qty }))
      });
      const productResponse = await api.get<{ items: Product[] }>('/inventory/products', { params: { status: 'active' } });
      setProducts(productResponse.data.items.map(product => ({ ...product, status: product.status.toLowerCase() as Product['status'] })));
      setLastSale({
        id: data.sale.number,
        subtotal,
        discount: discountAmt,
        total: data.sale.total,
        change: data.sale.change ?? 0,
        clientName: selectedClientName || '',
        items: cart,
        completedAt: new Date().toISOString()
      });
      setSaleState('success');
      if (printReceipt) window.setTimeout(() => window.print(), 100);
    } catch {
      setSaleState('error-network');
      showToast({ type: 'error', message: 'Não foi possível finalizar a venda.' });
    }
  };

  const newSale = () => {
    setCart([]); setPayMethod(null); setDiscount(''); setCashReceived(''); setSelectedClient(''); setClientError('');
    setSaleState('idle'); setLastSale(null);
  };

  const selectedClientName = selectedClient ? clients.find(c => c.id === selectedClient)?.name : null;
  const filteredClients = clients.filter(c => c.status === 'active' && (!clientSearch || c.name.toLowerCase().includes(clientSearch.toLowerCase()) || c.email.toLowerCase().includes(clientSearch.toLowerCase())));

  return (
    <AuthLayout title="Vendas / PDV">
      <div className="flex h-full flex-col lg:flex-row min-h-0 max-h-[calc(100vh-57px)]">
        {/* Left: Product catalog */}
        <div className="flex-1 flex flex-col min-h-0 border-r border-gray-100">
          {/* Search */}
          <div className="p-4 border-b border-gray-100 flex gap-2">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nome, SKU ou EAN..." className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E8753D]/20 focus:border-[#E8753D]" />
            </div>
            <button onClick={() => { setShowScanner(true); setScanState('ready'); setScanResult(null); }} className="flex items-center gap-2 bg-[#1F2926] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-[#2a3a36] transition-colors flex-shrink-0">
              <Barcode size={16} />
              <span className="hidden sm:inline">Escanear</span>
            </button>
          </div>

          {/* Products grid */}
          <div className="flex-1 overflow-y-auto p-4">
            {filteredProducts.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <div className="text-3xl mb-2">🔍</div>
                <div className="text-sm">Nenhum produto encontrado</div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-3">
                {filteredProducts.map(p => {
                  const inCart = cart.find(i => i.product.id === p.id);
                  const outOfStock = p.quantity === 0;
                  return (
                    <button
                      key={p.id}
                      onClick={() => addToCart(p)}
                      disabled={outOfStock}
                      className={`relative text-left p-3 rounded-xl border transition-all ${outOfStock ? 'bg-gray-50 border-gray-100 opacity-50 cursor-not-allowed' : inCart ? 'border-[#E8753D] bg-[#E8753D]/5 hover:bg-[#E8753D]/10' : 'border-gray-200 bg-white hover:border-[#E8753D] hover:shadow-sm'}`}
                    >
                      {inCart && (
                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#E8753D] text-white text-[10px] font-bold flex items-center justify-center">{inCart.qty}</div>
                      )}
                      <div className="text-xs text-gray-400 mb-0.5 font-mono">{p.sku}</div>
                      <div className="text-sm font-medium text-gray-800 leading-tight line-clamp-2 mb-1.5">{p.name}</div>
                      <div className="font-display font-bold text-[#1F2926]">{fmt(p.price)}</div>
                      <div className={`text-[10px] mt-0.5 ${p.quantity <= 5 ? 'text-amber-500' : 'text-gray-400'}`}>
                        {outOfStock ? 'Sem estoque' : `${p.quantity} disponível`}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right: Cart */}
        <div className="w-full lg:w-96 flex flex-col bg-white border-t lg:border-t-0 max-h-[50vh] lg:max-h-full">
          {saleState === 'success' && lastSale ? (
            /* Success state */
            <div className="print-receipt flex-1 flex flex-col items-center justify-center p-6 text-center">
              <div className="receipt-paper w-full max-w-md bg-white text-gray-700 px-5 py-6 text-left">
                <div className="text-center">
                  <div className="font-mono font-bold tracking-[0.25em] text-lg text-[#1F2926]">COMÉRCIOOS</div>
                  <div className="text-[11px] text-gray-500 mt-1">COMPROVANTE DE VENDA</div>
                  <div className="text-[11px] text-gray-400 mt-1">{new Date(lastSale.completedAt).toLocaleString('pt-BR')}</div>
                </div>
                <div className="receipt-divider my-4">--------------------------------</div>
                <div className="flex justify-between text-xs font-mono">
                  <span>VENDA</span><span>{lastSale.id}</span>
                </div>
                <div className="flex justify-between text-xs mt-1">
                  <span>CLIENTE</span><span className="font-medium">{lastSale.clientName}</span>
                </div>
                <div className="receipt-divider my-4">--------------------------------</div>
                <div className="flex justify-between text-xs font-mono font-bold mb-2">
                  <span>DESCRIÇÃO</span><span>VALOR</span>
                </div>
                <div className="space-y-1 text-xs font-mono">
                  {lastSale.items.map(item => <div key={item.product.id} className="flex justify-between gap-4"><span>{item.qty}x {item.product.name}</span><span>{fmt(item.product.price * item.qty)}</span></div>)}
                </div>
                <div className="receipt-divider my-4">--------------------------------</div>
                <div className="flex justify-between text-sm font-mono"><span>SUBTOTAL</span><span>{fmt(lastSale.subtotal)}</span></div>
                {lastSale.discount > 0 && <div className="flex justify-between text-sm font-mono"><span>DESCONTO</span><span>−{fmt(lastSale.discount)}</span></div>}
                <div className="flex justify-between text-xs font-mono mt-1"><span>IMPOSTO INCLUSO (8,65%)</span><span>{fmt(lastSale.total - (lastSale.total / (1 + ESTIMATED_TAX_RATE)))}</span></div>
                <div className="flex justify-between text-xl font-mono font-bold text-[#1F2926] mt-3"><span>TOTAL</span><span>{fmt(lastSale.total)}</span></div>
                <div className="receipt-divider my-4">--------------------------------</div>
                <div className="flex justify-between text-sm font-mono"><span>PAGAMENTO</span><span className="capitalize">{payMethod}</span></div>
                {lastSale.change > 0 && <div className="flex justify-between text-sm font-mono"><span>TROCO</span><span>{fmt(lastSale.change)}</span></div>}
                <div className="receipt-divider my-4">--------------------------------</div>
                <div className="text-center font-mono text-xs tracking-[0.2em]">OBRIGADO PELA PREFERÊNCIA!</div>
              </div>
              <button onClick={newSale} className="print-hidden w-full bg-[#E8753D] text-white font-semibold py-3 rounded-xl hover:bg-[#d4662e] transition-colors mb-2">
                Nova venda
              </button>
              <button onClick={() => window.print()} className="print-hidden w-full border border-gray-200 text-gray-600 text-sm py-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                Imprimir comprovante
              </button>
            </div>
          ) : (
            <>
              {/* Cart header */}
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart size={18} className="text-[#1F2926]" />
                  <span className="font-display font-semibold text-[#1F2926]">Carrinho</span>
                  {cart.length > 0 && <span className="bg-[#E8753D] text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">{cart.reduce((s, i) => s + i.qty, 0)}</span>}
                </div>
                {cart.length > 0 && (
                  <button onClick={() => setCart([])} className="text-xs text-[#C65B42] hover:underline">Limpar</button>
                )}
              </div>

              {/* Cart items */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {cart.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <ShoppingCart size={32} className="mx-auto mb-2 opacity-30" />
                    <div className="text-sm">Selecione produtos ao lado</div>
                  </div>
                ) : (
                  cart.map(item => (
                    <div key={item.product.id} className="flex items-center gap-3 bg-[#F6F7F8] rounded-xl p-3">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-800 truncate">{item.product.name}</div>
                        <div className="text-xs text-gray-500">{fmt(item.product.price)} cada</div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => updateQty(item.product.id, -1)} className="w-6 h-6 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:border-gray-300 transition-colors">
                          <Minus size={12} />
                        </button>
                        <span className="w-6 text-center text-sm font-semibold">{item.qty}</span>
                        <button onClick={() => updateQty(item.product.id, 1)} className="w-6 h-6 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:border-gray-300 transition-colors">
                          <Plus size={12} />
                        </button>
                      </div>
                      <div className="text-sm font-display font-bold text-[#1F2926] w-16 text-right">{fmt(item.product.price * item.qty)}</div>
                      <button onClick={() => removeFromCart(item.product.id)} className="text-gray-300 hover:text-[#C65B42] transition-colors">
                        <X size={14} />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Cart footer */}
              {cart.length > 0 && (
                <div className="border-t border-gray-100 p-4 space-y-3">
                  {/* Client */}
                  <button onClick={() => setShowClientPicker(true)} className={`w-full flex items-center gap-2 p-2.5 rounded-xl border border-dashed transition-colors text-sm ${clientError ? 'border-red-400' : 'border-gray-300 hover:border-[#E8753D]'}`}>
                    <User size={15} className="text-gray-400" />
                    <span className={selectedClientName ? 'text-gray-700' : 'text-gray-500'}>{selectedClientName || 'Associar cliente (obrigatório)'}</span>
                    {selectedClientName && <button onClick={(e) => { e.stopPropagation(); setSelectedClient(''); }} className="ml-auto text-gray-400 hover:text-gray-600"><X size={13} /></button>}
                  </button>
                  {clientError && <p className="text-xs text-red-600">{clientError}</p>}

                  {/* Discount */}
                  {allowDiscount && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500 flex-shrink-0">Desconto (R$)</span>
                      <input type="number" value={discount} onChange={e => setDiscount(e.target.value)} placeholder="0,00" className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8753D]/20 focus:border-[#E8753D] text-right" />
                    </div>
                  )}

                  {/* Summary */}
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>{fmt(subtotal)}</span></div>
                    {discountAmt > 0 && <div className="flex justify-between text-[#4F8B69]"><span>Desconto</span><span>−{fmt(discountAmt)}</span></div>}
                    <div className="flex justify-between font-display font-bold text-[#1F2926] text-base border-t border-gray-100 pt-1"><span>Total</span><span>{fmt(total)}</span></div>
                  </div>

                  {/* Payment */}
                  <div>
                    <div className="text-xs font-medium text-gray-500 mb-2">Forma de pagamento</div>
                    <div className="grid grid-cols-2 gap-2">
                      {PAY_METHODS.map(m => (
                        <button key={m.key} onClick={() => setPayMethod(m.key)} className={`flex items-center gap-2 p-2 rounded-xl border text-sm font-medium transition-all ${payMethod === m.key ? 'border-[#E8753D] bg-[#E8753D]/5 text-[#E8753D]' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                          <span>{m.icon}</span>{m.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Cash */}
                  {payMethod === 'dinheiro' && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500 flex-shrink-0">Recebido (R$)</span>
                        <input type="number" value={cashReceived} onChange={e => setCashReceived(e.target.value)} placeholder="0,00" className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8753D]/20 focus:border-[#E8753D] text-right" />
                      </div>
                      {(parseFloat(cashReceived) || 0) >= total && (
                        <div className="flex justify-between text-sm font-semibold text-[#4F8B69] bg-[#4F8B69]/10 rounded-lg px-3 py-2">
                          <span>Troco</span><span>{fmt(change)}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Finalize */}
                  <button
                    onClick={finalizeSale}
                    disabled={saleState === 'loading'}
                    className="w-full bg-[#E8753D] text-white font-semibold py-3 rounded-xl hover:bg-[#d4662e] transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
                  >
                    {saleState === 'loading' ? (
                      <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Finalizando...</>
                    ) : `Finalizar venda · ${fmt(total)}`}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Scanner modal */}
      {showScanner && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="font-display font-semibold text-[#1F2926]">Escanear produto</h2>
              <button onClick={() => { setShowScanner(false); setScanState('ready'); setScanResult(null); }} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              {/* Camera area */}
              <div className="relative bg-[#1F2926] rounded-xl aspect-video flex items-center justify-center overflow-hidden">
                {scanState === 'ready' && (
                  <div className="text-center text-white/70 text-sm">
                    <Barcode size={40} className="mx-auto mb-2 opacity-40" />
                    <div>Aponte para o código de barras</div>
                  </div>
                )}
                {scanState === 'scanning' && (
                  <div className="text-center text-white">
                    <div className="w-12 h-12 border-4 border-[#E8753D] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <div className="text-sm">Procurando...</div>
                    <div className="absolute inset-x-0 top-1/2 h-0.5 bg-[#E8753D] animate-pulse" />
                  </div>
                )}
                {scanState === 'found' && scanResult && (
                  <div className="text-center text-white p-4">
                    <div className="w-10 h-10 rounded-full bg-[#4F8B69] flex items-center justify-center mx-auto mb-2">
                      <Check size={20} />
                    </div>
                    <div className="font-semibold">{scanResult.name}</div>
                    <div className="text-sm opacity-70">{fmt(scanResult.price)} · {scanResult.quantity} un.</div>
                  </div>
                )}
                {scanState === 'not-found' && (
                  <div className="text-center text-white">
                    <div className="text-2xl mb-2">❌</div>
                    <div className="text-sm">Código não encontrado</div>
                  </div>
                )}
                {/* Corner marks */}
                <div className="absolute top-2 left-2 w-5 h-5 border-t-2 border-l-2 border-[#E8753D] rounded-tl" />
                <div className="absolute top-2 right-2 w-5 h-5 border-t-2 border-r-2 border-[#E8753D] rounded-tr" />
                <div className="absolute bottom-2 left-2 w-5 h-5 border-b-2 border-l-2 border-[#E8753D] rounded-bl" />
                <div className="absolute bottom-2 right-2 w-5 h-5 border-b-2 border-r-2 border-[#E8753D] rounded-br" />
              </div>

              {scanState === 'found' && scanResult ? (
                <button onClick={addScanned} className="w-full bg-[#4F8B69] text-white font-semibold py-3 rounded-xl hover:bg-[#3d6e54] transition-colors">
                  Adicionar ao carrinho
                </button>
              ) : scanState === 'not-found' ? (
                <button onClick={() => setScanState('ready')} className="w-full bg-[#1F2926] text-white font-semibold py-3 rounded-xl hover:bg-[#2a3a36] transition-colors">
                  Tentar novamente
                </button>
              ) : (
                <button onClick={simulateScan} disabled={scanState === 'scanning'} className="w-full bg-[#E8753D] text-white font-semibold py-3 rounded-xl hover:bg-[#d4662e] transition-colors disabled:opacity-70">
                  {scanState === 'scanning' ? 'Procurando...' : 'Simular leitura'}
                </button>
              )}

              <div className="text-xs text-gray-400 text-center">Ou busque manualmente no campo de pesquisa</div>
            </div>
          </div>
        </div>
      )}

      {/* Client picker */}
      {showClientPicker && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="font-display font-semibold text-[#1F2926]">Selecionar cliente</h2>
              <button onClick={() => setShowClientPicker(false)} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400"><X size={18} /></button>
            </div>
            <div className="p-4">
              <div className="relative mb-3">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={clientSearch} onChange={e => setClientSearch(e.target.value)} placeholder="Buscar cliente..." className="w-full pl-8 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E8753D]/20 focus:border-[#E8753D]" />
              </div>
              <div className="space-y-1 max-h-60 overflow-y-auto">
                {filteredClients.map(c => (
                <button key={c.id} onClick={() => { setSelectedClient(c.id); setClientError(''); setShowClientPicker(false); }} className={`w-full text-left px-3 py-2.5 rounded-xl hover:bg-gray-50 text-sm transition-colors ${selectedClient === c.id ? 'bg-[#E8753D]/5 text-[#E8753D]' : 'text-gray-800'}`}>
                    <div className="font-medium">{c.name}</div>
                    <div className="text-xs text-gray-400">{c.phone}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </AuthLayout>
  );
}
