'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

export interface Employee {
    id: string;
    name: string;
    wallet: string;
    salary: number;
    screeningScore: number;
    lastScreened: number;
    isActive: boolean;
}

interface EmployeeContextType {
    employees: Employee[];
    addEmployee: (employee: Employee) => void;
    updateEmployee: (id: string, updates: Partial<Employee>) => void;
    removeEmployee: (id: string) => void;
    getEmployee: (id: string) => Employee | undefined;
}

const EmployeeContext = createContext<EmployeeContextType | undefined>(undefined);

const STORAGE_KEY = 'zkpayroll_employees';

export function EmployeeProvider({ children }: { children: ReactNode }) {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load from localStorage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                setEmployees(JSON.parse(stored));
            }
        } catch (error) {
            console.error('Error loading employees from localStorage:', error);
        }
        setIsLoaded(true);
    }, []);

    // Save to localStorage when employees change
    useEffect(() => {
        if (isLoaded) {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(employees));
            } catch (error) {
                console.error('Error saving employees to localStorage:', error);
            }
        }
    }, [employees, isLoaded]);

    // Add employee
    const addEmployee = useCallback((employee: Employee) => {
        setEmployees(prev => [...prev, employee]);
    }, []);

    // Update employee
    const updateEmployee = useCallback((id: string, updates: Partial<Employee>) => {
        setEmployees(prev =>
            prev.map(emp => emp.id === id ? { ...emp, ...updates } : emp)
        );
    }, []);

    // Remove employee
    const removeEmployee = useCallback((id: string) => {
        setEmployees(prev => prev.filter(emp => emp.id !== id));
    }, []);

    // Get single employee
    const getEmployee = useCallback((id: string): Employee | undefined => {
        return employees.find(emp => emp.id === id);
    }, [employees]);

    // Don't render children until we've loaded from localStorage
    if (!isLoaded) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    return (
        <EmployeeContext.Provider value={{
            employees,
            addEmployee,
            updateEmployee,
            removeEmployee,
            getEmployee,
        }}>
            {children}
        </EmployeeContext.Provider>
    );
}

export function useEmployees() {
    const context = useContext(EmployeeContext);
    if (!context) {
        throw new Error('useEmployees must be used within an EmployeeProvider');
    }
    return context;
}
