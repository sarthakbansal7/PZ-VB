"use client";

import React, { useState, useEffect } from "react";
import { 
  Download, 
  Upload, 
  Users, 
  DollarSign, 
  CheckCircle, 
  Circle,
  Play,
  Home,
  Wallet,
  Plus,
  X,
  FileText,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Edit
} from "lucide-react";
import Link from "next/link";

// Employee interface
interface Employee {
  id: string;
  wallet: string;
  name: string;
  email: string;
  salary: string;
}

const PayrollPage: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [notification, setNotification] = useState<{type: 'success' | 'error' | 'info'; message: string} | null>(null);
  const [newEmployee, setNewEmployee] = useState({
    wallet: "",
    name: "",
    email: "",
    salary: ""
  });

  // Initialize with empty employees array
  useEffect(() => {
    setEmployees([]);
  }, []);

  // Show notification
  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Check for duplicate employees
  const isDuplicate = (newEmp: Omit<Employee, 'id'>, existingEmployees: Employee[]): boolean => {
    return existingEmployees.some(emp => 
      emp.wallet.toLowerCase() === newEmp.wallet.toLowerCase() || 
      emp.email.toLowerCase() === newEmp.email.toLowerCase()
    );
  };

  // Save employees as CSV
  const saveEmployeesAsCSV = () => {
    if (employees.length === 0) {
      showNotification('info', 'No employees to save');
      return;
    }

    const csvContent = `Wallet Address,Name,Email,Salary\n${employees.map(emp => 
      `${emp.wallet},${emp.name},${emp.email},${emp.salary}`
    ).join('\n')}`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `employees_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    showNotification('success', 'Employee list saved as CSV');
  };

  // Download Excel template
  const downloadExcelTemplate = () => {
    const csvContent = `Wallet Address,Name,Email,Salary
0x742F35Cc6C4D0f2f8A78a0D8B2A7D3E4F5A6B7C8,John Doe,john.doe@company.com,5000
0x123F35Cc6C4D0f2f8A78a0D8B2A7D3E4F5A6B7C9,Jane Smith,jane.smith@company.com,4500
0x456F35Cc6C4D0f2f8A78a0D8B2A7D3E4F5A6B7D0,Mike Johnson,mike.johnson@company.com,6000`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'payroll_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Handle CSV file upload
  const handleCSVUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n');
      
      // Skip header row and process data
      const csvEmployees: Employee[] = [];
      const duplicates: string[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const [wallet, name, email, salary] = line.split(',');
        if (wallet && name && email && salary) {
          const newEmp = {
            wallet: wallet.trim(),
            name: name.trim(),
            email: email.trim(),
            salary: salary.trim()
          };
          
          if (!isDuplicate(newEmp, employees) && !isDuplicate(newEmp, csvEmployees)) {
            csvEmployees.push({
              id: Date.now().toString() + i,
              ...newEmp
            });
          } else {
            duplicates.push(newEmp.name);
          }
        }
      }
      
      // Add new employees to existing list
      setEmployees(prev => [...prev, ...csvEmployees]);
      
      if (csvEmployees.length > 0) {
        showNotification('success', `Added ${csvEmployees.length} employees from CSV`);
      }
      if (duplicates.length > 0) {
        showNotification('info', `Skipped ${duplicates.length} duplicate entries`);
      }
    };
    
    reader.readAsText(file);
    // Reset file input
    event.target.value = '';
  };

  // Add or update employee
  const handleAddEmployee = () => {
    if (!newEmployee.wallet || !newEmployee.name || !newEmployee.email || !newEmployee.salary) {
      showNotification('error', 'Please fill in all fields');
      return;
    }

    // Validate wallet address format
    if (!newEmployee.wallet.startsWith('0x') || newEmployee.wallet.length !== 42) {
      showNotification('error', 'Please enter a valid wallet address');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmployee.email)) {
      showNotification('error', 'Please enter a valid email address');
      return;
    }

    // Validate salary is a number
    if (isNaN(parseFloat(newEmployee.salary)) || parseFloat(newEmployee.salary) <= 0) {
      showNotification('error', 'Please enter a valid salary amount');
      return;
    }

    // Check for duplicates (exclude current employee when editing)
    const otherEmployees = editingEmployee 
      ? employees.filter(emp => emp.id !== editingEmployee.id)
      : employees;
    
    if (isDuplicate(newEmployee, otherEmployees)) {
      showNotification('error', 'Employee with this wallet or email already exists');
      return;
    }

    if (editingEmployee) {
      // Update existing employee
      setEmployees(prev => prev.map(emp => 
        emp.id === editingEmployee.id 
          ? { ...emp, ...newEmployee }
          : emp
      ));
      showNotification('success', 'Employee updated successfully!');
    } else {
      // Add new employee
      const employee: Employee = {
        id: Date.now().toString(),
        wallet: newEmployee.wallet,
        name: newEmployee.name,
        email: newEmployee.email,
        salary: newEmployee.salary
      };
      setEmployees(prev => [...prev, employee]);
      showNotification('success', 'Employee added successfully!');
    }

    setNewEmployee({ wallet: "", name: "", email: "", salary: "" });
    setEditingEmployee(null);
    setShowAddEmployeeModal(false);
  };

  // Toggle employee selection
  const toggleEmployeeSelection = (employeeId: string) => {
    setSelectedEmployees(prev =>
      prev.includes(employeeId)
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  // Toggle all employees
  const toggleAllEmployees = () => {
    if (selectedEmployees.length === employees.length) {
      setSelectedEmployees([]);
    } else {
      setSelectedEmployees(employees.map(emp => emp.id));
    }
  };

  // Calculate total amount for selected employees
  const calculateTotalAmount = () => {
    return employees
      .filter(emp => selectedEmployees.includes(emp.id))
      .reduce((sum, emp) => sum + parseFloat(emp.salary), 0);
  };

  // Delete employee
  const handleDeleteEmployee = (employeeId: string) => {
    const employee = employees.find(emp => emp.id === employeeId);
    setEmployees(prev => prev.filter(emp => emp.id !== employeeId));
    setSelectedEmployees(prev => prev.filter(id => id !== employeeId));
    showNotification('success', `Removed ${employee?.name || 'employee'}`);
  };

  // Edit employee
  const handleEditEmployee = (employee: Employee) => {
    setEditingEmployee(employee);
    setNewEmployee({
      wallet: employee.wallet,
      name: employee.name,
      email: employee.email,
      salary: employee.salary
    });
    setShowAddEmployeeModal(true);
  };

  // Handle pay selected employees
  const handlePaySelectedEmployees = () => {
    if (selectedEmployees.length === 0) {
      showNotification('error', 'Please select at least one employee to pay');
      return;
    }
    
    // Show save prompt if there are employees
    if (employees.length > 0) {
      setShowSavePrompt(true);
    } else {
      proceedWithPayment();
    }
  };

  // Proceed with payment after save prompt
  const proceedWithPayment = () => {
    setShowSavePrompt(false);
    setIsLoading(true);
    // Simulate payment process
    setTimeout(() => {
      showNotification('success', `Payment initiated for ${selectedEmployees.length} employees. Total: $${calculateTotalAmount()}`);
      setSelectedEmployees([]);
      setIsLoading(false);
    }, 2000);
  };

  // Save CSV and proceed with payment
  const saveAndProceedWithPayment = () => {
    saveEmployeesAsCSV();
    proceedWithPayment();
  };

  const allSelected = selectedEmployees.length === employees.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-sm border-b border-green-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-green-600 hover:text-green-800 transition-colors">
                <Home size={24} />
              </Link>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-green-700 to-emerald-600 bg-clip-text text-transparent">💼 Corporate Payroll</h1>
            </div>
            
            <div className="flex items-center space-x-6">
              {/* Small stats */}
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <Users size={16} />
                  <span>{employees.length}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <CheckCircle size={16} />
                  <span>{selectedEmployees.length}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <DollarSign size={16} />
                  <span>${calculateTotalAmount().toLocaleString()}</span>
                </div>
              </div>
              
              {/* Action buttons */}
              <div className="flex items-center space-x-3">
                <button
                  onClick={downloadExcelTemplate}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Download size={18} />
                  <span>Download Template</span>
                </button>
                
                <label className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors cursor-pointer">
                  <Upload size={18} />
                  <span>Upload CSV</span>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleCSVUpload}
                    className="hidden"
                  />
                </label>

                <button
                  onClick={() => setShowAddEmployeeModal(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Plus size={18} />
                  <span>Add Employee</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Employee Table */}
        <div className="bg-white rounded-lg border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-100">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">Employee List</h2>
              {selectedEmployees.length > 0 && (
                <button
                  onClick={handlePaySelectedEmployees}
                  disabled={isLoading}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Play size={18} />
                  <span>
                    {isLoading ? 'Processing...' : `Pay Selected (${selectedEmployees.length})`}
                  </span>
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={toggleAllEmployees}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        {allSelected ? (
                          <CheckCircle size={20} className="text-blue-600" />
                        ) : (
                          <Circle size={20} />
                        )}
                      </button>
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Select All
                      </span>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Wallet Address
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Salary
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {employees.map((employee) => (
                  <tr 
                    key={employee.id}
                    className={`hover:bg-gray-50 ${
                      selectedEmployees.includes(employee.id) ? 'bg-green-50' : ''
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => toggleEmployeeSelection(employee.id)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        {selectedEmployees.includes(employee.id) ? (
                          <CheckCircle size={20} className="text-blue-600" />
                        ) : (
                          <Circle size={20} />
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{employee.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <Wallet size={16} className="text-gray-400" />
                        <span className="text-sm text-gray-500 font-mono">
                          {employee.wallet.slice(0, 6)}...{employee.wallet.slice(-4)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        ${parseFloat(employee.salary).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEditEmployee(employee)}
                          className="text-blue-400 hover:text-blue-600 transition-colors"
                          title="Edit employee"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteEmployee(employee.id)}
                          className="text-red-400 hover:text-red-600 transition-colors"
                          title="Delete employee"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {employees.length === 0 && (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No employees</h3>
              <p className="mt-1 text-sm text-gray-500">
                Add employees manually or upload a CSV file to get started.
              </p>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-3">How to Add Employees</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-blue-800 mb-2">Manual Entry</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
                <li>Click "Add Employee" button</li>
                <li>Fill in all required details</li>
                <li>Click "Save" to add employee</li>
              </ol>
            </div>
            <div>
              <h4 className="font-medium text-blue-800 mb-2">Bulk Upload</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
                <li>Download the CSV template</li>
                <li>Fill in employee details</li>
                <li>Click "Upload CSV" to add all employees</li>
              </ol>
            </div>
          </div>
        </div>
      </div>

      {/* Add Employee Modal */}
      {showAddEmployeeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {editingEmployee ? 'Edit Employee' : 'Add New Employee'}
              </h3>
              <button
                onClick={() => {
                  setShowAddEmployeeModal(false);
                  setEditingEmployee(null);
                  setNewEmployee({ wallet: "", name: "", email: "", salary: "" });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={newEmployee.name}
                  onChange={(e) => setNewEmployee({...newEmployee, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="John Doe"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={newEmployee.email}
                  onChange={(e) => setNewEmployee({...newEmployee, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="john.doe@company.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Wallet Address
                </label>
                <input
                  type="text"
                  value={newEmployee.wallet}
                  onChange={(e) => setNewEmployee({...newEmployee, wallet: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  placeholder="0x742F35Cc6C4D0f2f8A78a0D8B2A7D3E4F5A6B7C8"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Monthly Salary ($)
                </label>
                <input
                  type="number"
                  value={newEmployee.salary}
                  onChange={(e) => setNewEmployee({...newEmployee, salary: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="5000"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowAddEmployeeModal(false);
                  setEditingEmployee(null);
                  setNewEmployee({ wallet: "", name: "", email: "", salary: "" });
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddEmployee}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                {editingEmployee ? 'Update Employee' : 'Add Employee'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save CSV Prompt Modal */}
      {showSavePrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center mb-4">
              <FileText className="h-6 w-6 text-blue-600 mr-3" />
              <h3 className="text-lg font-medium text-gray-900">Save Employee Data</h3>
            </div>
            
            <p className="text-gray-600 mb-6">
              Would you like to save your current employee list as a CSV file before processing the payment? 
              This will help you keep a backup for future use.
            </p>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={proceedWithPayment}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                No (Continue to Pay)
              </button>
              <button
                onClick={saveAndProceedWithPayment}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                Yes (Save & Pay)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification */}
      {notification && (
        <div className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg z-50 flex items-center space-x-2 ${
          notification.type === 'success' ? 'bg-green-500 text-white' :
          notification.type === 'error' ? 'bg-red-500 text-white' :
          'bg-green-500 text-white'
        }`}>
          {notification.type === 'success' && <CheckCircle2 size={20} />}
          {notification.type === 'error' && <AlertCircle size={20} />}
          {notification.type === 'info' && <AlertCircle size={20} />}
          <span>{notification.message}</span>
        </div>
      )}
    </div>
  );
};

export default PayrollPage;
