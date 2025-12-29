export interface OrderItem {
  id: string;
  itemNumber?: string;
  itemName: string;
  quantity: number;
  originalQuantity?: number; // Track initial supervisor quantity
  notes?: string;
  shippedQuantity?: number; // To track how many have been dispatched
}

export type Role = 'sales' | 'assistant' | 'finance' | 'warehouse' | 'driver_supervisor' | 'truck_driver';

export type OrderStatus = 
  | 'Pending Assistant' 
  | 'Pending Finance' 
  | 'Approved' 
  | 'Rejected' 
  | 'Ready for Driver' 
  | 'Partially Shipped'
  | 'In Transit' 
  | 'Completed'
  | 'On Hold'
  | 'Canceled';

export interface HistoryItem {
  role: string;
  action: string;
  date: string;
  user?: string; 
  email?: string; 
}

export interface EmergencyReport {
    date: string;
    details: string;
    hasImage: boolean;
    resolved: boolean;
}

export interface Shipment {
    id: string;
    driverName: string;
    driverPhone: string;
    carNumber: string;
    warehouseLocation: string;
    dispatchTime: string;
    actualPickupTime?: string; // Captured when driver clicks "Picked Up"
    items: { itemName: string; quantity: number }[];
    status: 'Assigned' | 'Picked Up' | 'Delivered' | 'Emergency';
    emergency?: EmergencyReport;
    deliveryPhoto?: string; // Base64 encoded string of delivery proof
}

export interface SalesOrder {
  id?: string;
  customerName: string;
  areaLocation: string;
  orderDate: string;
  receivingDate: string; // New required field
  deliveryShift: 'أول نقلة' | 'ثانى نقلة' | 'باليل'; // New dropdown field
  deliveryType?: 'Outsource' | 'Own Cars'; // New field for delivery method
  serialNumber?: string;
  items: OrderItem[];
  overallNotes?: string;
  warehouseNote?: string; // New field for prominent warehouse notes
  status?: OrderStatus;
  history?: HistoryItem[];
  createdBy?: string; 
  creatorName?: string;
  shipments?: Shipment[]; // List of split shipments
  adminEmergencyNote?: string;
  adminEmergencyActive?: boolean;
  adminEmergencyTimestamp?: string; // ISO string to track expiration
}

export interface SharePointPayload {
  Title: string; 
  OrderDate: string;
  CustomerLocation: string;
  OrderJSON: string; 
  Status: OrderStatus;
}

export interface DriverProfile {
    name: string;
    phone: string;
    carNumber: string;
}

export interface UserProfile {
    pin: string;
    name: string;
    email: string;
    role: Role;
    isAdmin?: boolean;
}