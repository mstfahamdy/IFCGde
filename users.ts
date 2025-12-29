import { Role, UserProfile } from './types';

export const AUTHORIZED_USERS: UserProfile[] = [
    // --- SALES SUPERVISORS ---
    { pin: 'Boda#210', name: 'Abd Rahman', email: 'ahmed.m@ifcg.com', role: 'sales' },
    { pin: 'Waleed*407', name: 'Waleed Saad', email: 'sarah.a@ifcg.com', role: 'sales' },
    { pin: 'Delta$2001', name: 'Ahmed Abd Ghani', email: 'mahmoud.ali@ifcg.com', role: 'sales' },
    { pin: 'Gamal@780', name: 'Mohamed Gmal', email: 'mahmoud.ali@ifcg.com', role: 'sales' },
    { pin: 'Ali_997', name: 'Ali', email: 'mahmoud.ali@ifcg.com', role: 'sales' },
    { pin: 'Khaled@2000', name: 'Khaled Mostafa', email: 'mahmoud.ali@ifcg.com', role: 'sales' },
    { pin: 'Radi_@589', name: 'Mostafa Rady', email: 'mahmoud.ali@ifcg.com', role: 'sales' },
    { pin: '100', name: 'Admin', email: 'mahmoud.ali@ifcg.com', role: 'sales' },

    // --- SALES ASSISTANTS ---
    { pin: '2-001', name: 'Mohamed Nagy', email: 'nour.h@ifcg.com', role: 'assistant' },
    { pin: '2-002', name: 'Hassan Rashad', email: 'admin@ifcg.com', role: 'assistant' },
    { pin: '2-003', name: 'Amar Hafza', email: 'admin@ifcg.com', role: 'assistant' },
    
    // --- ADMIN CONTROLLER (Emergency Access) ---
    { pin: 'Admin#99', name: 'Admin Controller', email: 'admin.control@ifcg.com', role: 'assistant', isAdmin: true },

    // --- FINANCE ---
    { pin: '83*001', name: 'Mohamed Adel', email: 'sherif.finance@ifcg.com', role: 'finance' },
    { pin: '83*002', name: 'Ahmed Ibrahim', email: 'sherif.finance@ifcg.com', role: 'finance' },

    // --- WAREHOUSE ---
    { pin: 'st2097', name: 'IFCG Stores', email: 'wh.main@ifcg.com', role: 'warehouse' },
    
    // --- DRIVER SUPERVISORS (LOGISTICS) ---
    { pin: '9805', name: 'Ahmed Salah', email: 'logistics@ifcg.com', role: 'driver_supervisor' },
    
    // --- TRUCK DRIVERS ---
    { pin: '1111', name: 'Mohamed Ahmed', email: 'driver1@ifcg.com', role: 'truck_driver' },
    { pin: '2222', name: 'Abd El Atty', email: 'driver2@ifcg.com', role: 'truck_driver' },
    { pin: '3333', name: 'Mahmoud Trtsha', email: 'driver3@ifcg.com', role: 'truck_driver' },
    { pin: '500', name: 'Osama', email: 'driver.demo@ifcg.com', role: 'truck_driver' },

    // --- DEMO/TEST GENERIC ACCOUNTS ---
    { pin: '100', name: 'Demo Sales', email: 'sales.demo@ifcg.com', role: 'sales' },
    { pin: '200', name: 'Demo Assistant', email: 'asst.demo@ifcg.com', role: 'assistant' },
    { pin: '300', name: 'Demo Finance', email: 'finance.demo@ifcg.com', role: 'finance' },
    { pin: '400', name: 'Demo Warehouse', email: 'wh.demo@ifcg.com', role: 'warehouse' },
];

export const getUserByPin = (pin: string): UserProfile | undefined => {
    return AUTHORIZED_USERS.find(user => user.pin === pin);
};