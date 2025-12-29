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

const SearchableSelect = ({ options, value, onChange, placeholder, className, strict }: { options: any[], value: string, onChange: (val: string) => void, placeholder?: string, className?: string, strict?: boolean }) => {
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
  const statusKeyMap: Record<string, string> = { 'Pending Assistant': 'status_pendingAssistant', 'Pending Finance': 'status_pendingFinance', 'Approved': 'status_approved', 'Rejected': 'status_rejected', 'Ready for Driver': 'status_readyDriver', 'Partially Shipped': 'status_partiallyShipped', 'In Transit': 'status_inTransit', 'Completed': 'status_completed', 'On Hold': 'status_onHold', 'Canceled': 'status_canceled' };
  const style = status ? styles[status] : 'bg-gray-700 text-gray-300';
  const label = status ? t[statusKeyMap[status]] || status : status;
  return <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${style} whitespace-nowrap font-['Alexandria']`}>{label}</span>;
};

// --- MAIN APP ---

export default function App() {
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const t = TRANSLATIONS[lang];
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [globalOrders, setGlobalOrders] = useState<SalesOrder[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [loginTargetRole, setLoginTargetRole] = useState<Role | null>(null);

  const [salesView, setSalesView] = useState<'entry' | 'history'>('entry');
  const [searchTerm, setSearchTerm] = useState('');
  const [isMagicImportOpen, setIsMagicImportOpen] = useState(false);

  const [order, setOrder] = useState<SalesOrder>({
    customerName: '', areaLocation: '', orderDate: new Date().toISOString().split('T')[0], receivingDate: '', deliveryShift: 'أول نقلة', deliveryType: 'Own Cars', items: [], overallNotes: '', serialNumber: generateSerialNumber()
  });
  const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'submitting' | 'success'>('idle');
  const [validationError, setValidationError] = useState<string | null>(null);

  // Load orders
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

  const handleSubmitOrder = async () => {
    if (!order.customerName || !order.areaLocation || !order.receivingDate) {
      setValidationError(t.validationClient);
      return;
    }
    if (order.items.length === 0) {
      setValidationError(t.validationItems);
      return;
    }

    setSubmissionStatus('submitting');
    const newOrder: SalesOrder = {
      ...order,
      id: generateId(),
      status: 'Pending Assistant',
      createdBy: currentUser?.email,
      creatorName: currentUser?.name,
      history: [{ role: 'Sales Supervisor', action: 'Order Created', date: new Date().toLocaleString(), user: currentUser?.name || 'User' }]
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
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6">
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
                  <div className={`p-3 rounded-xl bg-${r.color}-500/10 text-${r.color}-500 group-hover:scale-110 transition-transform`}>
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
                  <div className="relative">
                    <Calendar className="absolute left-4 top-3.5 text-gray-500 pointer-events-none