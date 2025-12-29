
import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Trash2, Send, ShoppingCart, User, MapPin, Calendar, FileText, CheckCircle2, 
  ClipboardList, ArrowRight, History, ArrowLeft, Package, AlertCircle, LogOut, 
  ShieldCheck, Truck, XCircle, Check, Users, Navigation, Wheat, Pencil, Lock, X, 
  KeyRound, ChevronDown, Hash, Phone, PauseCircle, AlertTriangle, Save, Mail, 
  Search, FileSpreadsheet, Download, Eye, EyeOff, Languages, Siren, Clock, 
  RefreshCw, Upload, Filter, CircleCheck, Sparkles, ShieldAlert, Camera, Image as LucideImage, Maximize2
} from 'lucide-react';
import { PRODUCT_CATALOG, CUSTOMER_LIST, WAREHOUSES, DRIVERS_FLEET, DELIVERY_SHIFTS } from './constants';
import { OrderItem, SalesOrder, OrderStatus, HistoryItem, Role, Shipment, EmergencyReport, UserProfile } from './types';
import { getUserByPin } from './users';
import { TRANSLATIONS } from './translations';
import { MagicParser } from './components/MagicParser';

// --- CLOUD CONFIGURATION ---
const CLOUD_STORAGE_KEY = 'ifcg_global_orders_v15_cloud_distributed';

// --- HELPERS ---
const generateId = () => Math.random().toString(36).substr(2, 9);
const generateSerialNumber = () => `SO-${Math.floor(100000 + Math.random() * 900000)}`;
const INPUT_CLASS = "w-full px-4 py-3 rounded-lg border border-gray-600 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all placeholder-gray-500 text-white bg-gray-800 font-medium shadow-sm font-['Alexandria']";

const calculateDuration = (startISO: string, endISO: string) => {
    const start = new Date(startISO).getTime();
    const end = new Date(endISO).getTime();
    const diffMs = end - start;
    if (diffMs <= 0) return "0m";
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
};

// --- SUB-COMPONENTS (FROM ORIGINAL UI) ---

const SearchableSelect = ({ options, value, onChange, placeholder, className, strict }: { options: any[], value: string, onChange: (val: string) => void, placeholder?: string, className?: string, strict?: boolean }) => {
    const [isOpen, setIsOpen] = useState(false);
    const normalizedOptions = (options || []).map(o => typeof o === 'string' ? o : (o?.name || String(o)));
    const filtered = normalizedOptions.filter(o => (o || '').toLowerCase().includes((value || '').toLowerCase()));
    return (
      <div className="relative group">
        <div className="relative">
          <input className={`${className || INPUT_CLASS} ltr:pr-10 rtl:pl-10 rtl:pr-4`} value={value} onChange={(e) => { onChange(e.target.value); setIsOpen(true); }} onFocus={() => setIsOpen(true)} onBlur={() => { setTimeout(() => { setIsOpen(false); if (strict && value) { const exactMatch = normalizedOptions.find(opt => opt.toLowerCase() === value.toLowerCase()); if (!exactMatch) { onChange(''); } else { onChange(exactMatch); } } }, 200); }} placeholder={placeholder} />
          <button type="button" className="absolute ltr:right-3 rtl:left-3 top-1/2 -translate-y-1/2 text-gray-400 p-1 hover:text-blue-600 transition-colors focus:outline-none" onMouseDown={(e) => { e.preventDefault(); setIsOpen(!isOpen); }} tabIndex={-1}><ChevronDown className={`w-5 h-5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} /></button>
        </div>
        {isOpen && filtered.length > 0 && (
          <div className="absolute z-50 w-full bg-gray-800 mt-1 border border-gray-700 rounded-lg shadow-xl max-h-60 overflow-y-auto left-0">
              {filtered.map((opt, i) => (
                  <div key={i} className="px-4 py-3 hover:bg-gray-700 cursor-pointer text-sm text-gray-200 border-b border-gray-700 last:border-0 font-medium transition-colors" onMouseDown={(e) => { e.preventDefault(); onChange(opt); setIsOpen(false); }}>{opt}</div>
              ))}
          </div>
        )}
      </div>
    );
};

const StatusBadge = ({ status, t }: { status?: OrderStatus, t: any }) => {
  const styles = {
    'Pending Assistant': 'bg-indigo-900/30 text-indigo-300 border-indigo-800',
    'Pending Finance': 'bg-purple-900/30 text-purple-300 border-purple-800',
    'Approved': 'bg-green-900/30 text-green-300 border-green-800', 
    'Ready for Driver': 'bg-yellow-900/30 text-yellow-300 border-yellow-800',
    'Partially Shipped': 'bg-blue-900/30 text-blue-300 border-blue-800',
    'In Transit': 'bg-blue-900/30 text-blue-300 border-blue-800',
    'Completed': 'bg-emerald-900/30 text-emerald-300 border-emerald-800',
    'Rejected': 'bg-red-900/30 text-red-300 border-red-800',
    'On Hold': 'bg-orange-900/30 text-orange-300 border-orange-800',
    'Emergency': 'bg-red-600 text-white border-red-500 animate-pulse',
    'Canceled': 'bg-gray-700 text-gray-400 border-gray-600',
  };
  const statusKeyMap: Record<string, string> = { 'Pending Assistant': 'status_pendingAssistant', 'Pending Finance': 'status_pendingFinance', 'Approved': 'status_approved', 'Rejected': 'status_rejected', 'Ready for Driver': 'status_readyDriver', 'Partially Shipped': 'status_partiallyShipped', 'In Transit': 'status_inTransit', 'Completed': 'status_completed', 'On Hold': 'status_onHold', 'Emergency': 'status_emergency', 'Canceled': 'status_canceled' };
  const style = status ? styles[status] : 'bg-gray-700 text-gray-300';
  const label = status ? t[statusKeyMap[status]] || status : status;
  return <span className={`px-3 py-1 rounded-full text-xs font-bold border ${style} whitespace-nowrap font-['Alexandria']`}>{label}</span>;
};

// --- APP CORE ---

export default function App() {
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const t = TRANSLATIONS[lang];
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [globalOrders, setGlobalOrders] = useState<SalesOrder[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [loginTargetRole, setLoginTargetRole] = useState<Role | null>(null);

  // Added initiateLogin helper function
  const initiateLogin = (role: Role) => setLoginTargetRole(role);
  
  const [salesView, setSalesView] = useState<'entry' | 'history'>('entry');
  const [assistantView, setAssistantView] = useState<'pending' | 'history'>('pending');
  const [financeView, setFinanceView] = useState<'pending' | 'history'>('pending');
  const [warehouseView, setWarehouseView] = useState<'pending' | 'history'>('pending');
  const [driverView, setDriverView] = useState<'ready' | 'history'>('ready');
  const [truckDriverView, setTruckDriverView] = useState<'trips' | 'history'>('trips');

  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const [warehouseEditingId, setWarehouseEditingId] = useState<string | null>(null);
  const [financeEditingId, setFinanceEditingId] = useState<string | null>(null);
  const [driverAdjustingId, setDriverAdjustingId] = useState<string | null>(null);
  const [dispatchingOrderId, setDispatchingOrderId] = useState<string | null>(null);
  const [reassignShipment, setReassignShipment] = useState<{orderId: string, shipment: Shipment} | null>(null);
  const [emergencyModalOpen, setEmergencyModalOpen] = useState<{open: boolean, shipmentId?: string, orderId?: string}>({open: false});
  const [adminEmergencyModalOpen, setAdminEmergencyModalOpen] = useState<{open: boolean, orderId?: string, action?: 'cancel' | 'transfer'}>({open: false});
  const [adminTransferModalOpen, setAdminTransferModalOpen] = useState<{open: boolean, orderId?: string}>({open: false});
  const [isMagicImportOpen, setIsMagicImportOpen] = useState(false);

  const [pendingDeliveryPhoto, setPendingDeliveryPhoto] = useState<{orderId: string, shipmentId: string} | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [fullSizeImage, setFullSizeImage] = useState<string | null>(null);

  const [order, setOrder] = useState<SalesOrder>({
    customerName: '', areaLocation: '', orderDate: new Date().toISOString().split('T')[0], receivingDate: '', deliveryShift: 'أول نقلة', deliveryType: 'Own Cars', items: [], overallNotes: '', serialNumber: generateSerialNumber(), adminEmergencyNote: ''
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'submitting' | 'success'>('idle');
  const [validationError, setValidationError] = useState<string | null>(null);

  // --- CLOUD SYNC ENGINE ---
  
  const syncWithCloud = async () => {
    setIsSyncing(true);
    try {
      const cloudData = JSON.parse(localStorage.getItem(CLOUD_STORAGE_KEY) || '[]');
      setGlobalOrders(cloudData);
    } catch (err) {
      console.error("Cloud Sync Failure:", err);
    } finally {
      setTimeout(() => setIsSyncing(false), 800);
    }
  };

  const atomicUpdate = async (updateFn: (current: SalesOrder[]) => SalesOrder[]) => {
    setIsSyncing(true);
    try {
      const latestData = JSON.parse(localStorage.getItem(CLOUD_STORAGE_KEY) || '[]');
      const updatedData = updateFn(latestData);
      localStorage.setItem(CLOUD_STORAGE_KEY, JSON.stringify(updatedData));
      setGlobalOrders(updatedData);
    } catch (err) {
      console.error("Atomic Update Failed:", err);
    } finally {
      setTimeout(() => setIsSyncing(false), 400);
    }
  };

  useEffect(() => {
    syncWithCloud();
    const poll = setInterval(() => syncWithCloud(), 10000);
    return () => clearInterval(poll);
  }, []);

  useEffect(() => {
      document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = lang;
      document.documentElement.classList.add('dark');
  }, [lang]);

  // --- LOGIC FUNCTIONS (TRANSITIONED TO CLOUD) ---

  const handleAdjustItems = async (orderId: string, newItems: OrderItem[], roleName: string) => {
    await atomicUpdate(prev => prev.map(o => {
        if (o.id !== orderId) return o;
        const trackedItems = newItems.map(item => {
            const prevItem = o.items.find(pi => pi.id === item.id);
            return { ...item, originalQuantity: prevItem?.originalQuantity ?? prevItem?.quantity ?? item.quantity };
        });
        return {
            ...o, items: trackedItems,
            history: [...(o.history || []), { role: roleName, action: 'Adjusted Quantities only and added notes', date: new Date().toLocaleString(), user: currentUser?.name || 'Unknown' }]
        };
    }));
    setWarehouseEditingId(null);
    setFinanceEditingId(null);
    setDriverAdjustingId(null);
  };

  const handleAdminEmergencyAction = async (orderId: string, action: 'cancel' | 'transfer', reason: string, newCustomerName?: string) => {
    await atomicUpdate(prev => prev.map(o => {
        if (o.id !== orderId) return o;
        const history = [...(o.history || [])];
        const nowStr = new Date().toISOString();
        let newStatus: OrderStatus = 'Completed'; 
        let updatedCustomerName = o.customerName;
        let updatedAreaLocation = o.areaLocation;
        
        if (action === 'cancel') {
            newStatus = 'Canceled';
            history.push({ role: 'System Admin', action: `EMERGENCY CANCEL: ${reason}`, date: new Date().toLocaleString(), user: currentUser?.name || 'Admin' });
        } else if (action === 'transfer' && newCustomerName) {
            newStatus = 'Completed';
            updatedCustomerName = newCustomerName;
            const foundCust = CUSTOMER_LIST.find(c => c.name === newCustomerName);
            if (foundCust) updatedAreaLocation = foundCust.location;
            history.push({ role: 'System Admin', action: `EMERGENCY TRANSFER to client ${newCustomerName}: ${reason}`, date: new Date().toLocaleString(), user: currentUser?.name || 'Admin' });
        }

        return {
            ...o, status: newStatus, customerName: updatedCustomerName, areaLocation: updatedAreaLocation, adminEmergencyNote: reason, adminEmergencyActive: true, adminEmergencyTimestamp: nowStr, history: history
        };
    }));
    setAdminEmergencyModalOpen({ open: false });
    setAdminTransferModalOpen({ open: false });
  };

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus, roleName: string, actionNote: string) => {
    await atomicUpdate(prev => prev.map(o => {
        if (o.id !== orderId) return o;
        const isWarehouse = roleName === 'Warehouse';
        let finalStatus = newStatus;
        if (isWarehouse && newStatus === 'Ready for Driver' && o.deliveryType === 'Outsource') {
            finalStatus = 'Completed';
        }
        return {
            ...o, status: finalStatus, warehouseNote: isWarehouse ? actionNote : o.warehouseNote,
            history: [...(o.history || []), { role: roleName, action: (isWarehouse && finalStatus === 'Completed') ? 'Marked Delivered (Outsource)' : actionNote, date: new Date().toLocaleString(), user: currentUser?.name || 'Unknown' }]
        };
    }));
  };

  const createShipment = async (orderId: string, shipmentData: Shipment) => {
      await atomicUpdate(prev => prev.map(o => {
          if (o.id !== orderId) return o;
          const newShipments = [...(o.shipments || []), shipmentData];
          const totalOrdered = o.items.reduce((sum, i) => sum + i.quantity, 0);
          const totalShipped = newShipments.reduce((sum, s) => s.status === 'Emergency' ? sum : sum + s.items.reduce((is, i) => is + i.quantity, 0), 0);
          const status: OrderStatus = totalShipped >= totalOrdered ? 'In Transit' : 'Partially Shipped';
          return {
              ...o, status: status, shipments: newShipments,
              history: [...(o.history || []), { role: 'Driver Supervisor', action: `Dispatched Shipment to ${shipmentData.driverName}`, date: new Date().toLocaleString(), user: currentUser?.name || 'Logistics' }]
          };
      }));
      setDispatchingOrderId(null);
  };

  const handleReassignDriver = async (newDriver: Shipment) => {
      if(!reassignShipment) return;
      await atomicUpdate(prev => prev.map(o => {
          if (o.id !== reassignShipment.orderId) return o;
          const updatedShipments = o.shipments?.map(s => {
              if (s.id !== reassignShipment.shipment.id) return s;
              return { ...s, driverName: newDriver.driverName, driverPhone: newDriver.driverPhone, carNumber: newDriver.carNumber, dispatchTime: newDriver.dispatchTime, status: 'Assigned', emergency: undefined } as Shipment;
          });
          return {
              ...o, status: 'In Transit', shipments: updatedShipments,
              history: [...(o.history || []), { role: 'Driver Supervisor', action: `RE-ASSIGNED: Trip transferred from ${reassignShipment.shipment.driverName} to ${newDriver.driverName}`, date: new Date().toLocaleString(), user: currentUser?.name || 'Logistics' }]
          };
      }));
      setReassignShipment(null);
  }

  const handleDriverAction = async (orderId: string, shipmentId: string, action: 'Picked Up' | 'Delivered', photo?: string) => {
      const now = new Date().toISOString();
      await atomicUpdate(prev => prev.map(o => {
          if (o.id !== orderId) return o;
          let newStatus = o.status;
          let historyMessage = `Shipment ${action}`;
          const updatedShipments = o.shipments?.map(s => {
              if (s.id !== shipmentId) return s;
              if (action === 'Picked Up') return { ...s, status: action, actualPickupTime: now };
              if (action === 'Delivered') {
                  if (s.actualPickupTime) {
                      const duration = calculateDuration(s.actualPickupTime, now);
                      historyMessage += ` (Trip Duration: ${duration})`;
                  }
                  return { ...s, status: action, deliveryPhoto: photo };
              }
              return s;
          });
          if (action === 'Delivered') {
              const allDelivered = updatedShipments?.every(s => s.status === 'Delivered');
              const totalOrdered = o.items.reduce((sum, i) => sum + i.quantity, 0);
              const totalShipped = updatedShipments?.reduce((sum, s) => sum + s.items.reduce((is, i) => is + i.quantity, 0), 0) || 0;
              if (allDelivered && totalShipped >= totalOrdered) newStatus = 'Completed';
          }
          return {
              ...o, status: newStatus, shipments: updatedShipments as Shipment[],
              history: [...(o.history || []), { role: 'Truck Driver', action: historyMessage, date: new Date().toLocaleString(), user: currentUser?.name || 'Driver' }]
          };
      }));
      setPendingDeliveryPhoto(null);
  };

  const handleEmergency = async (orderId: string, shipmentId: string, report: EmergencyReport) => {
    await atomicUpdate(prev => prev.map(o => {
        if (o.id !== orderId) return o;
        const updatedShipments = o.shipments?.map(s => {
            if (s.id !== shipmentId) return s;
            return { ...s, status: 'Emergency' as const, emergency: report };
        });
        return {
            ...o, status: 'On Hold', shipments: updatedShipments,
            history: [...(o.history || []), { role: 'Truck Driver', action: `EMERGENCY/ACCIDENT: ${report.details}. Requesting Re-Assignment.`, date: new Date().toLocaleString(), user: currentUser?.name || 'Driver' }]
        }
    }));
    setEmergencyModalOpen({open: false});
  };

  const handleResolveEmergency = async (orderId: string, shipmentId: string) => {
    await atomicUpdate(prev => prev.map(o => {
        if (o.id !== orderId) return o;
        const updatedShipments = o.shipments?.map(s => {
            if (s.id !== shipmentId) return s;
            return { ...s, status: 'Picked Up' as const, emergency: undefined };
        });
        return {
            ...o, status: 'In Transit', shipments: updatedShipments,
            history: [...(o.history || []), { role: 'Truck Driver', action: `Emergency Resolved - Resuming Delivery`, date: new Date().toLocaleString(), user: currentUser?.name || 'Driver' }]
        }
    }));
  };

  const handleGenericSubmit = async () => {
    setValidationError(null);
    if (!order.customerName || !order.areaLocation || !order.receivingDate) { setValidationError(t.validationClient); return; }
    if (order.items.length === 0) { setValidationError(t.validationItems); return; }
    
    const isAdminEdit = currentUser?.isAdmin && editingId;
    if (isAdminEdit && !order.adminEmergencyNote?.trim()) { setValidationError(t.admin_reason_placeholder); return; }

    setSubmissionStatus('submitting');
    await atomicUpdate(prev => {
        if (editingId) {
            return prev.map(o => {
                if (o.id !== editingId) return o;
                const history = [...(o.history || [])];
                const nowStr = new Date().toISOString();
                const newStatus: OrderStatus = isAdminEdit ? 'Completed' : (currentUser?.role === 'assistant' ? (o.status || 'Pending Assistant') : 'Pending Assistant');

                if (isAdminEdit) history.push({ role: 'System Admin', action: `EMERGENCY EDIT OVERRIDE: ${order.adminEmergencyNote}`, date: new Date().toLocaleString(), user: currentUser?.name || 'Admin' });
                else if (currentUser?.role === 'assistant') history.push({ role: 'Sales Assistant', action: `Modified Details Snapshot`, date: new Date().toLocaleString(), user: currentUser?.name || 'Assistant' });
                else history.push({ role: 'Sales Supervisor', action: 'Order Updated', date: new Date().toLocaleString(), user: currentUser?.name || 'Sales User' });

                return {
                    ...order, id: editingId, status: newStatus, history, adminEmergencyActive: isAdminEdit ? true : o.adminEmergencyActive,
                    adminEmergencyNote: isAdminEdit ? order.adminEmergencyNote : o.adminEmergencyNote,
                    adminEmergencyTimestamp: isAdminEdit ? nowStr : o.adminEmergencyTimestamp
                };
            });
        } else {
            const newOrder: SalesOrder = {
                ...order, id: generateId(), serialNumber: order.serialNumber || generateSerialNumber(), status: 'Pending Assistant', createdBy: currentUser?.email, creatorName: currentUser?.name,
                items: order.items.map(i => ({ ...i, originalQuantity: i.quantity })),
                history: [{ role: 'Sales Supervisor', action: 'Order Created', date: new Date().toLocaleString(), user: currentUser?.name || 'Sales User' }]
            };
            return [newOrder, ...prev];
        }
    });

    setSubmissionStatus('success');
    setTimeout(() => {
        setSubmissionStatus('idle'); setEditingId(null);
        setOrder({ customerName: '', areaLocation: '', orderDate: new Date().toISOString().split('T')[0], receivingDate: '', deliveryShift: 'أول نقلة', deliveryType: 'Own Cars', items: [], overallNotes: '', serialNumber: generateSerialNumber(), adminEmergencyNote: '' });
        if (currentUser?.role !== 'assistant') setSalesView('history'); 
    }, 1500);
  };

  // --- TRUCK DRIVER RENDERING ---
  if (currentUser && currentUser.role === 'truck_driver') {
      const myTrips = globalOrders.filter(o => o.shipments?.some(s => s.driverName === currentUser.name && (s.status === 'Assigned' || s.status === 'Picked Up' || s.status === 'Emergency')));
      const historyTrips = globalOrders.filter(o => o.shipments?.some(s => s.driverName === currentUser.name && s.status === 'Delivered'));
      const displayedOrders = (truckDriverView === 'trips' ? myTrips : historyTrips).map(o => ({
          ...o, shipments: o.shipments?.filter(s => s.driverName === currentUser.name && (truckDriverView === 'trips' ? s.status !== 'Delivered' : s.status === 'Delivered'))
      })).filter(o => o.shipments && o.shipments.length > 0);

      return (
          <div className="min-h-screen bg-gray-950 pb-20 font-['Alexandria']">
              <input type="file" ref={cameraInputRef} className="hidden" accept="image/*" capture="environment" onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file && pendingDeliveryPhoto) {
                      const reader = new FileReader();
                      reader.onloadend = () => handleDriverAction(pendingDeliveryPhoto.orderId, pendingDeliveryPhoto.shipmentId, 'Delivered', reader.result as string);
                      reader.readAsDataURL(file);
                  }
              }} />
              <input type="file" ref={galleryInputRef} className="hidden" accept="image/*" onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file && pendingDeliveryPhoto) {
                      const reader = new FileReader();
                      reader.onloadend = () => handleDriverAction(pendingDeliveryPhoto.orderId, pendingDeliveryPhoto.shipmentId, 'Delivered', reader.result as string);
                      reader.readAsDataURL(file);
                  }
              }} />
              <RoleHeader user={currentUser} onLogout={() => setCurrentUser(null)} t={t} lang={lang} setLang={setLang} />
              <NotificationBanner count={myTrips.length} t={t} adminAlerts={globalOrders.filter(o => o.adminEmergencyActive)} />
              <div className="max-w-4xl mx-auto px-4 mt-6">
                <div className="flex bg-gray-800 rounded-xl p-1.5 shadow-sm border border-gray-700">
                    <button onClick={() => setTruckDriverView('trips')} className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${truckDriverView === 'trips' ? 'bg-red-600 text-white shadow-md' : 'text-gray-400 hover:bg-gray-700 hover:text-white'}`}>{t.tab_myTrips} ({myTrips.length})</button>
                    <button onClick={() => setTruckDriverView('history')} className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${truckDriverView === 'history' ? 'bg-red-600 text-white shadow-md' : 'text-gray-400 hover:bg-gray-700 hover:text-white'}`}>{t.tab_history}</button>
                </div>
              </div>
              <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
                  {displayedOrders.length === 0 && <EmptyState message={truckDriverView === 'trips' ? t.emptyTrips : t.emptyHistory} />}
                  {displayedOrders.map(order => (
                      <div key={order.id} className="bg-gray-800 rounded-2xl shadow-xl border border-gray-700 overflow-hidden">
                          <div className="p-5 border-b border-gray-700 bg-gray-900/40 flex justify-between items-start">
                              <div className="space-y-1"><h3 className="text-white font-black text-xl leading-relaxed">{order.customerName}</h3><p className="text-gray-400 text-sm flex items-center gap-2 mt-1"><MapPin className="w-4 h-4 text-blue-500"/> {order.areaLocation}</p></div>
                              <span className="text-[10px] font-mono text-gray-500 font-bold bg-gray-950 px-2 py-1 rounded border border-gray-800">{order.serialNumber}</span>
                          </div>
                          {order.shipments?.map(shipment => (
                              <div key={shipment.id} className="p-5 space-y-6">
                                  <div className="flex justify-between items-start bg-gray-900/50 p-4 rounded-xl border border-gray-700">
                                      <div><div className="text-[10px] font-black text-gray-500 uppercase mb-1">{t.warehouse}</div><div className="text-white font-bold">{shipment.warehouseLocation}</div></div>
                                      <div className="text-right"><div className="text-[10px] font-black text-gray-500 uppercase mb-1">{t.dispatchTime}</div><div className="text-white font-bold">{shipment.dispatchTime}</div></div>
                                  </div>
                                  <div className="bg-gray-900 rounded-xl p-4 border border-gray-700 space-y-4">
                                      {shipment.items.map((item, idx) => (
                                          <div key={idx} className="flex flex-col border-b border-gray-800 pb-3 last:border-0 last:pb-0">
                                              <span className="font-bold text-gray-200 mb-2 leading-relaxed">{item.itemName}</span>
                                              <span className="font-black text-white bg-gray-800 px-4 py-1.5 rounded-lg w-fit text-base border border-gray-700">x{item.quantity}</span>
                                          </div>
                                      ))}
                                  </div>
                                  {truckDriverView === 'trips' && (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between p-4 bg-gray-900/30 rounded-2xl border border-gray-800">
                                            <div className="flex items-center gap-3"><Package className={`w-6 h-6 ${shipment.status === 'Assigned' ? 'text-blue-400' : 'text-green-500'}`} /><span className="font-bold text-gray-300">{t.stepPickup}</span></div>
                                            <button disabled={shipment.status !== 'Assigned'} onClick={() => handleDriverAction(order.id!, shipment.id, 'Picked Up')} className={`px-6 py-2.5 rounded-xl font-black text-sm ${shipment.status === 'Assigned' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-500'}`}>{shipment.status === 'Assigned' ? t.confirmPickup : t.confirmed}</button>
                                        </div>
                                        <div className={`flex flex-col p-4 rounded-2xl border ${shipment.status === 'Picked Up' ? 'bg-gray-900/50 border-gray-700' : 'opacity-50'}`}>
                                            <div className="flex items-center justify-between mb-4"><div className="flex items-center gap-3"><Navigation className="w-6 h-6 text-gray-400" /><span className="font-bold text-gray-200">{t.stepDelivery}</span></div>
                                                {shipment.status === 'Picked Up' ? (
                                                    <div className="flex gap-2">
                                                        <button onClick={() => { setPendingDeliveryPhoto({orderId: order.id!, shipmentId: shipment.id}); cameraInputRef.current?.click(); }} className="p-3 bg-green-600 text-white rounded-xl"><Camera size={18}/></button>
                                                        <button onClick={() => { setPendingDeliveryPhoto({orderId: order.id!, shipmentId: shipment.id}); galleryInputRef.current?.click(); }} className="p-3 bg-blue-600 text-white rounded-xl"><LucideImage size={18}/></button>
                                                    </div>
                                                ) : <button disabled className="bg-gray-800 text-gray-500 px-6 py-2 rounded-xl">{t.confirmed}</button>}
                                            </div>
                                        </div>
                                    </div>
                                  )}
                              </div>
                          ))}
                      </div>
                  ))}
              </main>
          </div>
      );
  }

  // --- MAIN ROLE RENDERING ---
  if (!currentUser) {
      return (
          <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
              <div className="bg-gray-800 p-8 rounded-3xl shadow-xl max-w-md w-full border border-gray-700">
                  <CompanyLogo large />
                  <div className="mt-6 space-y-2">
                      <RoleButton icon={<User size={18}/>} label={t.role_sales} color="blue" onClick={() => initiateLogin('sales')} />
                      <RoleButton icon={<Users size={18}/>} label={t.role_assistant} color="indigo" onClick={() => initiateLogin('assistant')} count={globalOrders.filter(o => o.status === 'Pending Assistant').length} />
                      <RoleButton icon={<ShieldCheck size={18}/>} label={t.role_finance} color="green" onClick={() => initiateLogin('finance')} count={globalOrders.filter(o => o.status === 'Pending Finance').length} />
                      <RoleButton icon={<Package size={18}/>} label={t.role_warehouse} color="orange" onClick={() => initiateLogin('warehouse')} count={globalOrders.filter(o => o.status === 'Approved' || o.status === 'On Hold').length} />
                      <RoleButton icon={<Truck size={18}/>} label={t.role_driver_supervisor} color="teal" onClick={() => initiateLogin('driver_supervisor')} count={globalOrders.filter(o => o.status === 'Ready for Driver' || o.status === 'Partially Shipped').length} />
                      <RoleButton icon={<Navigation size={18}/>} label={t.role_truck_driver} color="red" onClick={() => initiateLogin('truck_driver')} />
                  </div>
              </div>
              {loginTargetRole && <LoginModal role={loginTargetRole} onClose={() => setLoginTargetRole(null)} onSuccess={setCurrentUser} t={t} />}
          </div>
      );
  }

  const getBaseOrders = () => {
    if (!currentUser) return [];
    const all = globalOrders;
    if (currentUser.role === 'sales') return all.filter(o => o.createdBy === currentUser.email);
    if (currentUser.role === 'assistant') return assistantView === 'pending' ? all.filter(o => o.status === 'Pending Assistant') : all.filter(o => o.status !== 'Pending Assistant');
    if (currentUser.role === 'finance') return financeView === 'pending' ? all.filter(o => o.status === 'Pending Finance') : all.filter(o => o.status !== 'Pending Finance');
    if (currentUser.role === 'warehouse') return warehouseView === 'pending' ? all.filter(o => o.status === 'Approved' || o.status === 'On Hold') : all.filter(o => o.status !== 'Approved' && o.status !== 'On Hold');
    if (currentUser.role === 'driver_supervisor') return driverView === 'ready' ? all.filter(o => o.status === 'Ready for Driver' || o.status === 'Partially Shipped') : all.filter(o => o.status !== 'Ready for Driver' && o.status !== 'Partially Shipped');
    return all;
  };

  const filteredOrders = getBaseOrders().filter(o => {
    const term = searchTerm.toLowerCase();
    return o.customerName.toLowerCase().includes(term) || o.serialNumber?.toLowerCase().includes(term);
  });

  return (
    <div className="min-h-screen bg-gray-950 pb-20 font-['Alexandria']">
      <RoleHeader user={currentUser} onLogout={() => setCurrentUser(null)} t={t} lang={lang} setLang={setLang} />
      {editingId ? (
          <main className="max-w-4xl mx-auto px-4 py-6">
              <button onClick={() => setEditingId(null)} className="mb-6 p-2 bg-gray-800 rounded-full text-gray-400"><ArrowLeft /></button>
              <SalesEntryForm order={order} setOrder={setOrder} onSubmit={handleGenericSubmit} t={t} submissionStatus={submissionStatus} validationError={validationError} isEdit />
          </main>
      ) : (
          <main className="max-w-4xl mx-auto px-4 py-6">
              <MagicParser isOpen={isMagicImportOpen} onClose={() => setIsMagicImportOpen(false)} onParsed={(d) => setOrder(p => ({...p, ...d}))} />
              <div className="flex bg-gray-800 rounded-xl p-1 shadow-sm border border-gray-700 mb-6">
                  {currentUser.role === 'sales' && (<><button onClick={() => setSalesView('entry')} className={`flex-1 py-2 text-sm font-bold rounded-lg ${salesView === 'entry' ? 'bg-blue-600 text-white' : 'text-gray-400'}`}>{t.newOrder}</button><button onClick={() => setSalesView('history')} className={`flex-1 py-2 text-sm font-bold rounded-lg ${salesView === 'history' ? 'bg-blue-600 text-white' : 'text-gray-400'}`}>{t.myHistory}</button></>)}
                  {currentUser.role === 'driver_supervisor' && (<><button onClick={() => setDriverView('ready')} className={`flex-1 py-2 text-sm font-bold rounded-lg ${driverView === 'ready' ? 'bg-teal-600 text-white' : 'text-gray-400'}`}>{t.tab_toDispatch}</button><button onClick={() => setDriverView('history')} className={`flex-1 py-2 text-sm font-bold rounded-lg ${driverView === 'history' ? 'bg-teal-600 text-white' : 'text-gray-400'}`}>{t.tab_activeDelivered}</button></>)}
                  {/* Generic tab logic for other roles would follow here if added */}
              </div>
              {currentUser.role === 'sales' && salesView === 'entry' ? (
                  <SalesEntryForm order={order} setOrder={setOrder} onSubmit={handleGenericSubmit} t={t} submissionStatus={submissionStatus} validationError={validationError} />
              ) : (
                  <div className="space-y-4">
                      <SearchFilterBar searchTerm={searchTerm} onSearch={setSearchTerm} count={filteredOrders.length} t={t} />
                      {filteredOrders.map(o => (
                          <OrderCard key={o.id} order={o} t={t} actions={
                              currentUser.role === 'assistant' && o.status === 'Pending Assistant' ? <ActionWidget t={t} primaryLabel={t.approveQty} primaryColor="indigo" onPrimary={(n) => updateOrderStatus(o.id!, 'Pending Finance', 'Assistant', n)} onSecondary={(n) => updateOrderStatus(o.id!, 'Rejected', 'Assistant', n)} secondaryLabel={t.reject} />
                              : currentUser.role === 'finance' && o.status === 'Pending Finance' ? <ActionWidget t={t} primaryLabel={t.approveOrder} primaryColor="green" onPrimary={(n) => updateOrderStatus(o.id!, 'Approved', 'Finance', n)} onSecondary={(n) => updateOrderStatus(o.id!, 'Rejected', 'Finance', n)} secondaryLabel={t.reject} />
                              : currentUser.role === 'warehouse' && o.status === 'Approved' ? <button onClick={() => updateOrderStatus(o.id!, 'Ready for Driver', 'Warehouse', 'Packed')} className="w-full bg-orange-600 text-white py-3 rounded-xl font-bold">{t.markReady}</button>
                              : currentUser.role === 'driver_supervisor' && (o.status === 'Ready for Driver' || o.status === 'Partially Shipped') ? <DispatchSplitForm order={o} onDispatch={(s) => createShipment(o.id!, s)} onCancel={() => {}} t={t} />
                              : null
                          } />
                      ))}
                  </div>
              )}
          </main>
      )}
    </div>
  );
}

// --- SHARED COMPONENTS (AS PROVIDED BY USER) ---

const CompanyLogo = ({ large }: any) => (<div className="flex flex-col items-center justify-center"><Wheat className={`text-blue-500 ${large ? 'w-16 h-16' : 'w-8 h-8'}`} /><span className={`font-black tracking-tighter text-blue-500 leading-none ${large ? 'text-4xl mt-2' : 'text-xl'}`}>IFCG</span></div>);
const RoleButton = ({ icon, label, color, onClick, count }: any) => { const colors: any = { blue: 'bg-blue-900/20 text-blue-400', indigo: 'bg-indigo-900/20 text-indigo-400', green: 'bg-green-900/20 text-green-400', orange: 'bg-orange-900/20 text-orange-400', teal: 'bg-teal-900/20 text-teal-400', red: 'bg-red-900/20 text-red-400' }; return (<button onClick={onClick} className="w-full flex items-center justify-between p-4 bg-gray-800 border border-gray-700 rounded-2xl group transition-all"><div className="flex items-center gap-3"><div className={`p-2 rounded-lg ${colors[color]}`}>{icon}</div><span className="font-bold text-white text-lg">{label}</span></div>{count > 0 && <span className="bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">{count}</span>}</button>); };
const LoginModal = ({ role, onClose, onSuccess, t }: any) => { const [pin, setPin] = useState(''); const handleLogin = () => { const u = getUserByPin(pin); if (u && u.role === role) onSuccess(u); else alert(t.invalidCode); }; return (<div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"><div className="bg-gray-800 p-8 rounded-3xl border border-gray-700 w-full max-w-sm"><h3 className="text-white font-bold mb-4">{t.enterPin}</h3><input type="password" value={pin} onChange={e => setPin(e.target.value)} className={INPUT_CLASS} autoFocus /><button onClick={handleLogin} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold mt-4 shadow-lg">{t.accessDashboard}</button><button onClick={onClose} className="w-full text-gray-500 mt-2 font-bold">{t.cancel}</button></div></div>); };
const RoleHeader = ({ user, onLogout, t, lang, setLang }: any) => (<header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-40"><div className="max-w-4xl mx-auto px-4 h-20 flex items-center justify-between"><div className="flex items-center gap-3"><div className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">{t[`role_${user.role}`]}</div><div className="text-sm font-bold text-gray-200">{user.name}</div></div><div className="flex gap-2"><button onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')} className="p-2 bg-gray-800 text-gray-400 rounded-lg"><Languages size={18}/></button><button onClick={onLogout} className="p-2 bg-red-900/20 text-red-500 rounded-lg"><LogOut size={18}/></button></div></div></header>);
const NotificationBanner = ({ count, t }: any) => count > 0 ? (<div className="bg-blue-600/10 py-3 px-4 border-b border-blue-500/20"><div className="max-w-4xl mx-auto flex items-center gap-3 text-blue-400"><Siren size={18} className="animate-pulse" /><p className="text-sm font-bold">{t.notificationMsg} ({count})</p></div></div>) : null;
const EmptyState = ({ message }: any) => (<div className="text-center py-20 bg-gray-800/30 rounded-3xl border-2 border-dashed border-gray-800"><ClipboardList className="w-16 h-16 text-gray-700 mx-auto mb-4" /><p className="text-gray-500 font-medium">{message}</p></div>);
const SearchFilterBar = ({ searchTerm, onSearch, count, t }: any) => (<div className="relative"><Search className="absolute left-3 top-3.5 w-5 h-5 text-gray-500" /><input value={searchTerm} onChange={e => onSearch(e.target.value)} placeholder={t.searchPlaceholder} className={`${INPUT_CLASS} pl-10 bg-gray-800/50`} /></div>);
const ActionWidget = ({ onPrimary, primaryLabel, primaryColor, onSecondary, secondaryLabel, t }: any) => { const [note, setNote] = useState(''); const colors: any = { indigo: 'bg-indigo-600', green: 'bg-green-600' }; return (<div className="space-y-3 mt-4"><textarea value={note} onChange={e => setNote(e.target.value)} placeholder={t.addNote} className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-sm text-white h-20 outline-none" /><div className="flex gap-2"><button onClick={() => onPrimary(note)} className={`flex-1 ${colors[primaryColor]} text-white py-2.5 rounded-xl font-bold`}>{primaryLabel}</button>{onSecondary && <button onClick={() => onSecondary(note)} className="flex-1 bg-red-900/20 text-red-500 rounded-xl font-bold">{secondaryLabel}</button>}</div></div>); };

const SalesEntryForm = ({ order, setOrder, onSubmit, t, submissionStatus, validationError, isEdit }: any) => (
    <div className="space-y-6">
        <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 space-y-4">
            <h3 className="text-white font-bold">{t.clientInfo}</h3>
            <SearchableSelect options={CUSTOMER_LIST} placeholder={t.selectClient} value={order.customerName} onChange={v => setOrder({...order, customerName: v})} />
            <input placeholder={t.location} className={INPUT_CLASS} value={order.areaLocation} onChange={e => setOrder({...order, areaLocation: e.target.value})} />
            <div className="grid grid-cols-2 gap-3"><input type="date" className={INPUT_CLASS} value={order.receivingDate} onChange={e => setOrder({...order, receivingDate: e.target.value})} /><select className={INPUT_CLASS} value={order.deliveryShift} onChange={e => setOrder({...order, deliveryShift: e.target.value})}>{DELIVERY_SHIFTS.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
        </div>
        <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 space-y-4">
            <div className="flex justify-between items-center"><h3 className="text-white font-bold">{t.orderItems}</h3><button onClick={() => setOrder({...order, items: [...order.items, {id: generateId(), itemName: '', quantity: 1}]})} className="text-blue-500 font-bold text-xs">+ {t.addItem}</button></div>
            {order.items.map((item: any, idx: number) => (
                <div key={item.id} className="bg-gray-900/50 p-4 rounded-xl border border-gray-700 relative">
                    <button onClick={() => setOrder({...order, items: order.items.filter((i: any) => i.id !== item.id)})} className="absolute top-2 right-2 text-red-500"><Trash2 size={16}/></button>
                    <SearchableSelect options={PRODUCT_CATALOG} placeholder={t.searchProduct} value={item.itemName} onChange={v => { const n = [...order.items]; n[idx].itemName = v; setOrder({...order, items: n}); }} />
                    <input type="number" className={`${INPUT_CLASS} mt-2`} value={item.quantity} onChange={e => { const n = [...order.items]; n[idx].quantity = parseInt(e.target.value) || 0; setOrder({...order, items: n}); }} />
                </div>
            ))}
        </div>
        {validationError && <div className="text-red-400 text-sm font-bold">{validationError}</div>}
        <button onClick={onSubmit} className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold shadow-lg" disabled={submissionStatus === 'submitting'}>{submissionStatus === 'submitting' ? t.processing : t.submitOrder}</button>
    </div>
);

const OrderCard = ({ order, t, actions }: any) => {
    const [exp, setExp] = useState(false);
    return (
        <div className="bg-gray-800 rounded-2xl border border-gray-700 shadow-lg overflow-hidden transition-all">
            <div className="p-4 cursor-pointer" onClick={() => setExp(!exp)}>
                <div className="flex justify-between items-start mb-2">
                    <div><div className="flex items-center gap-2"><StatusBadge status={order.status} t={t} /><span className="text-xs font-mono text-gray-500">{order.serialNumber}</span></div><h4 className="text-white font-bold mt-1 text-lg">{order.customerName}</h4></div>
                    <ChevronDown className={`text-gray-500 transition-transform ${exp ? 'rotate-180' : ''}`} />
                </div>
                <div className="text-[10px] text-gray-500 flex items-center gap-2"><MapPin size={10}/> {order.areaLocation} | <Calendar size={10}/> {order.receivingDate}</div>
            </div>
            {exp && (
                <div className="p-4 pt-0 border-t border-gray-700/50 space-y-4 animate-in fade-in slide-in-from-top-1">
                    <div className="bg-gray-900/40 p-3 rounded-xl border border-gray-700/50 space-y-2">
                        {order.items.map((i: any, idx: number) => (
                            <div key={idx} className="flex justify-between text-xs text-gray-300"><span>{i.itemName}</span><span className="font-black text-blue-400">x{i.quantity}</span></div>
                        ))}
                    </div>
                    {actions}
                </div>
            )}
        </div>
    );
};

const DispatchSplitForm = ({ order, onDispatch, t }: any) => {
    const [warehouse, setWarehouse] = useState('');
    const [time, setTime] = useState('');
    const [driver, setDriver] = useState('');
    return (
        <div className="space-y-3 mt-4 bg-teal-900/10 p-4 rounded-xl border border-teal-900/30">
            <SearchableSelect options={WAREHOUSES} value={warehouse} onChange={setWarehouse} placeholder={t.selectWarehouse} />
            <div className="grid grid-cols-2 gap-2">
                <input type="time" className={INPUT_CLASS} value={time} onChange={e => setTime(e.target.value)} />
                <SearchableSelect options={DRIVERS_FLEET.map(d => d.name)} value={driver} onChange={setDriver} placeholder={t.selectDriver} />
            </div>
            <button onClick={() => {
                const dObj = DRIVERS_FLEET.find(df => df.name === driver);
                if (dObj) onDispatch({ id: generateId(), driverName: dObj.name, driverPhone: dObj.phone, carNumber: dObj.carNumber, warehouseLocation: warehouse, dispatchTime: time, items: order.items, status: 'Assigned' });
            }} className="w-full bg-teal-600 text-white py-3 rounded-xl font-bold shadow-lg">{t.dispatchOrder}</button>
        </div>
    );
};
