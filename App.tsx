import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Trash2, Send, ShoppingCart, User, MapPin, Calendar, FileText, CheckCircle2, 
  ClipboardList, ArrowRight, History, ArrowLeft, Package, AlertCircle, LogOut, 
  ShieldCheck, Truck, XCircle, Check, Users, Navigation, Wheat, Pencil, Lock, X, 
  KeyRound, ChevronDown, Hash, Phone, PauseCircle, AlertTriangle, Save, Mail, 
  Search, FileSpreadsheet, Download, Eye, EyeOff, Languages, Siren, Clock, 
  RefreshCw, Upload, Filter, CircleCheck, Sparkles, ShieldAlert, Camera, Image as LucideImage, Maximize2,
  Loader2
} from 'lucide-react';
import { PRODUCT_CATALOG, CUSTOMER_LIST, WAREHOUSES, DRIVERS_FLEET, DELIVERY_SHIFTS } from './constants';
import { OrderItem, SalesOrder, OrderStatus, HistoryItem, Role, Shipment, EmergencyReport, UserProfile } from './types';
import { getUserByPin } from './users';
import { TRANSLATIONS } from './translations';
import { MagicParser } from './components/MagicParser';

const CLOUD_STORAGE_KEY = 'ifcg_global_orders_v1.7_cloud';

// --- HELPERS ---
const generateId = () => Math.random().toString(36).substr(2, 9);
const generateSerialNumber = () => `SO-${Math.floor(100000 + Math.random() * 900000)}`;
const INPUT_CLASS = "w-full px-4 py-3 rounded-xl border border-gray-700 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all placeholder-gray-500 text-white bg-gray-900/50 font-medium shadow-sm font-['Alexandria']";

// --- SUB-COMPONENTS ---

const SearchableSelect = ({ options, value, onChange, placeholder, className }: { options: any[], value: string, onChange: (val: string) => void, placeholder?: string, className?: string }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [localSearch, setLocalSearch] = useState(value);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => { setLocalSearch(value); }, [value]);

    const normalizedOptions = (options || []).map(o => typeof o === 'string' ? o : (o?.name || String(o)));
    const filtered = normalizedOptions.filter(o => (o || '').toLowerCase().includes((localSearch || '').toLowerCase()));

    return (
      <div className="relative" ref={containerRef}>
        <div className="relative">
          <input 
            className={`${className || INPUT_CLASS} pr-10`} 
            value={localSearch} 
            onChange={(e) => { setLocalSearch(e.target.value); setIsOpen(true); }} 
            onFocus={() => setIsOpen(true)} 
            placeholder={placeholder} 
          />
          <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 p-1 hover:text-blue-500 transition-colors" onClick={() => setIsOpen(!isOpen)}>
            <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
        {isOpen && (
          <div className="absolute z-[100] w-full bg-gray-800 mt-1 border border-gray-700 rounded-xl shadow-2xl max-h-60 overflow-y-auto left-0 animate-in fade-in zoom-in-95 duration-150">
              {filtered.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-gray-500">No results found</div>
              ) : (
                  filtered.map((opt, i) => (
                      <div 
                        key={i} 
                        className="px-4 py-3 hover:bg-blue-600 hover:text-white cursor-pointer text-sm text-gray-200 border-b border-gray-700/50 last:border-0 font-medium transition-colors" 
                        onMouseDown={() => { onChange(opt); setLocalSearch(opt); setIsOpen(false); }}
                      >
                        {opt}
                      </div>
                  ))
              )}
          </div>
        )}
      </div>
    );
};

const StatusBadge = ({ status, t }: { status?: OrderStatus, t: any }) => {
  const styles: Record<string, string> = {
    'Pending Assistant': 'bg-indigo-900/30 text-indigo-300 border-indigo-800',
    'Pending Finance': 'bg-purple-900/30 text-purple-300 border-purple-800',
    'Approved': 'bg-green-900/30 text-green-300 border-green-800', 
    'Ready for Driver': 'bg-yellow-900/30 text-yellow-300 border-yellow-800',
    'Partially Shipped': 'bg-blue-900/30 text-blue-300 border-blue-800',
    'In Transit': 'bg-blue-900/30 text-blue-300 border-blue-800',
    'Completed': 'bg-emerald-900/30 text-emerald-300 border-emerald-800',
    'Rejected': 'bg-red-900/30 text-red-300 border-red-800',
    'On Hold': 'bg-orange-900/30 text-orange-300 border-orange-800',
    'Canceled': 'bg-gray-700 text-gray-400 border-gray-600',
  };
  const statusKeyMap: Record<string, string> = { 
    'Pending Assistant': 'status_pendingAssistant', 
    'Pending Finance': 'status_pendingFinance', 
    'Approved': 'status_approved', 
    'Rejected': 'status_rejected', 
    'Ready for Driver': 'status_readyDriver', 
    'Partially Shipped': 'status_partiallyShipped', 
    'In Transit': 'status_inTransit', 
    'Completed': 'status_completed', 
    'On Hold': 'status_onHold', 
    'Canceled': 'status_canceled' 
  };
  const style = status ? styles[status] : 'bg-gray-700 text-gray-300';
  const label = status ? t[statusKeyMap[status]] || status : status;
  return <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${style} whitespace-nowrap font-['Alexandria']`}>{label}</span>;
};

const LoginModal = ({ role, onClose, onSuccess, t }: { role: Role, onClose: () => void, onSuccess: (user: UserProfile) => void, t: any }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleLogin = () => {
    const user = getUserByPin(pin);
    if (user && user.role === role) {
      onSuccess(user);
    } else {
      setError(true);
      setTimeout(() => setError(false), 1000);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-6">
      <div className={`bg-gray-900 border ${error ? 'border-red-500 animate-shake' : 'border-gray-800'} rounded-3xl p-8 w-full max-w-sm shadow-2xl space-y-6 transition-all`}>
        <div className="flex justify-between items-start">
          <div className="p-3 bg-blue-600/20 text-blue-500 rounded-2xl">
            <KeyRound size={28} />
          </div>
          <button onClick={onClose} className="p-2 text-gray-500 hover:text-white transition-colors"><X size={24} /></button>
        </div>
        <div>
          <h3 className="text-xl font-black text-white">{t.accessCode}</h3>
          <p className="text-gray-500 text-sm mt-1">{t.useCodeMsg}</p>
        </div>
        <input 
          type="password" 
          value={pin} 
          onChange={(e) => setPin(e.target.value)}
          placeholder={t.enterPin}
          className={`${INPUT_CLASS} text-center text-2xl tracking-[0.5em] font-black`}
          onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
          autoFocus
        />
        {error && <p className="text-red-500 text-xs font-bold text-center">{t.invalidCode}</p>}
        <button 
          onClick={handleLogin}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-blue-900/20 active:scale-95"
        >
          {t.accessDashboard}
        </button>
      </div>
    </div>
  );
};

// --- MAIN APP ---

export default function App() {
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const t = TRANSLATIONS[lang];
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [globalOrders, setGlobalOrders] = useState<SalesOrder[]>([]);
  const [loginTargetRole, setLoginTargetRole] = useState<Role | null>(null);

  const [salesView, setSalesView] = useState<'entry' | 'history'>('entry');
  const [searchTerm, setSearchTerm] = useState('');
  const [isMagicImportOpen, setIsMagicImportOpen] = useState(false);

  const [order, setOrder] = useState<SalesOrder>({
    customerName: '', areaLocation: '', orderDate: new Date().toISOString().split('T')[0], receivingDate: '', 
    deliveryShift: 'أول نقلة', deliveryType: 'Own Cars', items: [], overallNotes: '', serialNumber: generateSerialNumber()
  });
  const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'submitting' | 'success'>('idle');
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    const data = localStorage.getItem(CLOUD_STORAGE_KEY);
    if (data) setGlobalOrders(JSON.parse(data));
  }, []);

  useEffect(() => {
    localStorage.setItem(CLOUD_STORAGE_KEY, JSON.stringify(globalOrders));
  }, [globalOrders]);

  const handleMagicFill = (data: Partial<SalesOrder>) => {
    setOrder(prev => ({
      ...prev,
      ...data,
      items: data.items ? data.items.map(i => ({ ...i, id: generateId() })) : prev.items
    }));
  };

  const addItem = () => {
    setOrder({
      ...order,
      items: [...order.items, { id: generateId(), itemName: '', quantity: 0 }]
    });
  };

  const removeItem = (id: string) => {
    setOrder({
      ...order,
      items: order.items.filter(i => i.id !== id)
    });
  };

  const updateItem = (id: string, field: keyof OrderItem, value: any) => {
    setOrder({
      ...order,
      items: order.items.map(i => i.id === id ? { ...i, [field]: value } : i)
    });
  };

  const handleSubmitOrder = async () => {
    if (!order.customerName || !order.areaLocation || !order.receivingDate) {
      setValidationError(t.validationClient);
      return;
    }
    if (order.items.length === 0) {
      setValidationError(t.validationItems);
      return;
    }
    if (order.items.some(i => !i.itemName || i.quantity <= 0)) {
      setValidationError(t.validationItemDetails);
      return;
    }

    setValidationError(null);
    setSubmissionStatus('submitting');
    
    const newOrder: SalesOrder = {
      ...order,
      id: generateId(),
      status: 'Pending Assistant',
      createdBy: currentUser?.email,
      creatorName: currentUser?.name,
      history: [{ 
        role: 'Sales Supervisor', 
        action: 'Order Created', 
        date: new Date().toLocaleString(), 
        user: currentUser?.name || 'User' 
      }]
    };

    setTimeout(() => {
      setGlobalOrders([newOrder, ...globalOrders]);
      setSubmissionStatus('success');
      setTimeout(() => {
        setOrder({ customerName: '', areaLocation: '', orderDate: new Date().toISOString().split('T')[0], receivingDate: '', deliveryShift: 'أول نقلة', deliveryType: 'Own Cars', items: [], overallNotes: '', serialNumber: generateSerialNumber() });
        setSubmissionStatus('idle');
        setSalesView('history');
      }, 1500);
    }, 800);
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6 font-['Alexandria']">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <div className="inline-flex p-4 bg-blue-600/10 rounded-3xl mb-4">
              <Wheat className="w-12 h-12 text-blue-500" />
            </div>
            <h1 className="text-4xl font-black text-white tracking-tight">IFCG <span className="text-blue-500">SALES</span></h1>
            <p className="text-gray-500 mt-2 font-medium">{t.loginSubtitle}</p>
          </div>
          
          <div className="grid gap-3">
            {[
              { role: 'sales', label: t.role_sales, icon: User, color: 'blue' },
              { role: 'assistant', label: t.role_assistant, icon: Users, color: 'indigo' },
              { role: 'finance', label: t.role_finance, icon: ShieldCheck, color: 'green' },
              { role: 'warehouse', label: t.role_warehouse, icon: Package, color: 'orange' },
              { role: 'driver_supervisor', label: t.role_driver_supervisor, icon: Truck, color: 'teal' },
              { role: 'truck_driver', label: t.role_truck_driver, icon: Navigation, color: 'red' },
            ].map((r) => (
              <button 
                key={r.role}
                onClick={() => setLoginTargetRole(r.role as Role)}
                className="flex items-center justify-between p-5 bg-gray-900 border border-gray-800 rounded-2xl hover:border-blue-500/50 hover:bg-gray-800 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-gray-800 text-blue-500 group-hover:scale-110 transition-transform">
                    <r.icon size={22} />
                  </div>
                  <span className="font-bold text-gray-200 text-lg">{r.label}</span>
                </div>
                <ChevronDown className="w-5 h-5 text-gray-600 -rotate-90" />
              </button>
            ))}
          </div>
        </div>
        {loginTargetRole && <LoginModal role={loginTargetRole} onClose={() => setLoginTargetRole(null)} onSuccess={setCurrentUser} t={t} />}
      </div>
    );
  }

  const filteredOrders = globalOrders.filter(o => 
    (currentUser.role === 'sales' ? o.createdBy === currentUser.email : true) &&
    (o.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || o.serialNumber?.includes(searchTerm))
  );

  return (
    <div className="min-h-screen bg-gray-950 pb-20 font-['Alexandria'] text-gray-200">
      <MagicParser isOpen={isMagicImportOpen} onClose={() => setIsMagicImportOpen(false)} onParsed={handleMagicFill} />
      
      <header className="bg-gray-900/50 backdrop-blur-md border-b border-gray-800 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{t[`role_${currentUser.role}`]}</span>
            <span className="text-sm font-bold text-white">{currentUser.name}</span>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')} className="p-2.5 bg-gray-800 hover:bg-gray-700 text-gray-400 rounded-xl transition-colors"><Languages size={20}/></button>
            <button onClick={() => setCurrentUser(null)} className="p-2.5 bg-red-900/10 hover:bg-red-900/20 text-red-500 rounded-xl transition-colors"><LogOut size={20}/></button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {currentUser.role === 'sales' && (
          <div className="flex bg-gray-900 p-1 rounded-2xl border border-gray-800 mb-8 shadow-inner">
            <button onClick={() => setSalesView('entry')} className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${salesView === 'entry' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}>{t.newOrder}</button>
            <button onClick={() => setSalesView('history')} className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${salesView === 'history' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}>{t.myHistory} ({globalOrders.filter(o => o.createdBy === currentUser.email).length})</button>
          </div>
        )}

        {currentUser.role === 'sales' && salesView === 'entry' ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-end">
              <div>
                <h2 className="text-2xl font-black text-white">{t.newOrder}</h2>
                <p className="text-gray-500 text-sm mt-1">Enter order details for assistant review</p>
              </div>
              <button 
                onClick={() => setIsMagicImportOpen(true)}
                className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-900/20 hover:scale-105 active:scale-95 transition-all"
              >
                <Sparkles size={18} />
                <span className="text-sm">Magic Import</span>
              </button>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 space-y-6 shadow-xl">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase px-1">{t.clientName}</label>
                  <SearchableSelect options={CUSTOMER_LIST} placeholder={t.selectClient} value={order.customerName} onChange={v => setOrder({...order, customerName: v})} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase px-1">{t.location}</label>
                  <input placeholder={t.areaAddress} className={INPUT_CLASS} value={order.areaLocation} onChange={e => setOrder({...order, areaLocation: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase px-1">{t.receivingDate}</label>
                  <input type="date" className={INPUT_CLASS} value={order.receivingDate} onChange={e => setOrder({...order, receivingDate: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase px-1">{t.deliveryShift}</label>
                  <select className={INPUT_CLASS} value={order.deliveryShift} onChange={e => setOrder({...order, deliveryShift: e.target.value as any})}>
                    {DELIVERY_SHIFTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-800">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2"><ShoppingCart size={20} className="text-blue-500" /> {t.orderItems}</h3>
                  <button onClick={addItem} className="text-blue-500 hover:text-blue-400 font-bold text-sm flex items-center gap-1 bg-blue-500/10 px-3 py-1.5 rounded-lg transition-colors"><Plus size={16} /> {t.addItem}</button>
                </div>

                <div className="space-y-3">
                  {order.items.length === 0 ? (
                    <div className="text-center py-10 border-2 border-dashed border-gray-800 rounded-2xl">
                      <Package className="w-10 h-10 text-gray-700 mx-auto mb-2" />
                      <p className="text-gray-600 text-sm font-medium">{t.noItems}</p>
                    </div>
                  ) : (
                    order.items.map((item, idx) => (
                      <div key={item.id} className="flex flex-wrap gap-3 p-4 bg-gray-950 border border-gray-800 rounded-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex-1 min-w-[240px]">
                          <SearchableSelect options={PRODUCT_CATALOG} placeholder={t.searchProduct} value={item.itemName} onChange={v => updateItem(item.id, 'itemName', v)} />
                        </div>
                        <div className="w-32">
                          <input type="number" placeholder={t.qty} className={INPUT_CLASS} value={item.quantity || ''} onChange={e => updateItem(item.id, 'quantity', parseInt(e.target.value) || 0)} />
                        </div>
                        <button onClick={() => removeItem(item.id)} className="p-3 text-red-500 hover:bg-red-900/20 rounded-xl transition-all"><Trash2 size={20}/></button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase px-1">{t.overallNotes}</label>
                <textarea placeholder={t.overallNotesPlaceholder} className={`${INPUT_CLASS} h-24 resize-none`} value={order.overallNotes} onChange={e => setOrder({...order, overallNotes: e.target.value})} />
              </div>

              {validationError && (
                <div className="p-4 bg-red-900/20 border border-red-800 rounded-2xl flex items-center gap-3 text-red-400 text-sm font-bold">
                  <AlertCircle size={20} /> {validationError}
                </div>
              )}

              <button 
                onClick={handleSubmitOrder}
                disabled={submissionStatus !== 'idle'}
                className={`w-full py-4 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-3 shadow-xl ${
                  submissionStatus === 'success' ? 'bg-green-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
                } disabled:opacity-50`}
              >
                {submissionStatus === 'idle' && <><Send size={22} /> {t.submitOrder}</>}
                {submissionStatus === 'submitting' && <><Loader2 className="animate-spin" size={22} /> {t.processing}</>}
                {submissionStatus === 'success' && <><CheckCircle2 size={22} /> {t.successTitle}</>}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
              <input 
                placeholder={t.searchPlaceholder} 
                className={`${INPUT_CLASS} pl-12`} 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="grid gap-4">
              {filteredOrders.length === 0 ? (
                <div className="text-center py-20 bg-gray-900/30 rounded-3xl border border-gray-800">
                  <ClipboardList className="w-16 h-16 text-gray-800 mx-auto mb-4" />
                  <p className="text-gray-500 font-bold">{t.emptySearch}</p>
                </div>
              ) : (
                filteredOrders.map((o) => (
                  <div key={o.id} className="bg-gray-900 border border-gray-800 rounded-3xl p-5 hover:border-blue-500/30 transition-all group shadow-lg">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-blue-500 font-black text-lg">#{o.serialNumber}</span>
                          <StatusBadge status={o.status} t={t} />
                        </div>
                        <h3 className="font-black text-white text-xl">{o.customerName}</h3>
                        <p className="text-gray-500 text-xs flex items-center gap-1 font-bold mt-1"><MapPin size={12}/> {o.areaLocation}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-gray-600 font-bold uppercase tracking-tighter">{t.receivingDate}</p>
                        <p className="text-sm font-black text-gray-400">{o.receivingDate}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-gray-800">
                      <div className="flex items-center gap-4">
                        <div className="flex -space-x-2">
                           {/* Simple representation of items count */}
                           <div className="w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-[10px] font-black text-blue-500">{o.items.length}</div>
                        </div>
                        <span className="text-xs text-gray-500 font-bold">{t.totalQty}: {o.items.reduce((acc, i) => acc + i.quantity, 0)}</span>
                      </div>
                      <button className="text-blue-500 hover:bg-blue-500/10 p-2 rounded-xl transition-colors"><ArrowRight size={20}/></button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}