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
  Edit,
  Shield,
  Vote,
  TrendingUp,
  UserCheck,
  Settings,
  Info
} from "lucide-react";
import Link from "next/link";

// DAO Contributor interface
interface DAOContributor {
  id: string;
  name: string;
  role: string;
  wallet: string;
  compensationType: 'fixed' | 'bounty' | 'revenue-share';
  amount: string;
  governanceId?: string;
  proposalId?: string;
}

const DAOPage: React.FC = () => {
  const [contributors, setContributors] = useState<DAOContributor[]>([]);
  const [selectedContributors, setSelectedContributors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddContributorModal, setShowAddContributorModal] = useState(false);
  const [editingContributor, setEditingContributor] = useState<DAOContributor | null>(null);
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [showGovernanceModal, setShowGovernanceModal] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [executionMode, setExecutionMode] = useState<'multisig' | 'governance'>('multisig');
  const [notification, setNotification] = useState<{type: 'success' | 'error' | 'info'; message: string} | null>(null);
  const [governanceData, setGovernanceData] = useState({
    proposalId: '',
    description: '',
    multisigAddress: ''
  });
  const [newContributor, setNewContributor] = useState({
    name: "",
    role: "",
    wallet: "",
    compensationType: 'fixed' as 'fixed' | 'bounty' | 'revenue-share',
    amount: "",
    governanceId: "",
    proposalId: ""
  });

  // Initialize with empty contributors array and check first visit
  useEffect(() => {
    setContributors([]);
    
    // Check if this is the first visit
    const hasVisitedDAO = localStorage.getItem('dao-visited');
    if (!hasVisitedDAO) {
      setShowTutorial(true);
      localStorage.setItem('dao-visited', 'true');
    }
  }, []);

  // Show notification
  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Check for duplicate contributors
  const isDuplicate = (newCont: Omit<DAOContributor, 'id'>, existingContributors: DAOContributor[]): boolean => {
    return existingContributors.some(cont => 
      cont.wallet.toLowerCase() === newCont.wallet.toLowerCase()
    );
  };

  // Save contributors as CSV
  const saveContributorsAsCSV = () => {
    if (contributors.length === 0) {
      showNotification('info', 'No contributors to save');
      return;
    }

    const csvContent = `Name,Role,Wallet,Compensation Type,Amount,Governance ID,Proposal ID\\n${contributors.map(cont => 
      `${cont.name},${cont.role},${cont.wallet},${cont.compensationType},${cont.amount},${cont.governanceId || ''},${cont.proposalId || ''}`
    ).join('\\n')}`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dao_contributors_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    showNotification('success', 'DAO contributor list saved as CSV');
  };

  // Download CSV template
  const downloadCSVTemplate = () => {
    const csvContent = `Name,Role,Wallet,Compensation Type,Amount,Governance ID,Proposal ID
Alice Johnson,Core Developer,0x742F35Cc6C4D0f2f8A78a0D8B2A7D3E4F5A6B7C8,fixed,8000,GOV-001,PROP-123
Bob Smith,Community Manager,0x123F35Cc6C4D0f2f8A78a0D8B2A7D3E4F5A6B7C9,bounty,2500,GOV-002,PROP-124
Carol Davis,Designer,0x456F35Cc6C4D0f2f8A78a0D8B2A7D3E4F5A6B7D0,revenue-share,5.5,GOV-003,PROP-125`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dao_contributors_template.csv';
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
      const csvContributors: DAOContributor[] = [];
      const duplicates: string[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const [name, role, wallet, compensationType, amount, governanceId, proposalId] = line.split(',');
        if (name && role && wallet && compensationType && amount) {
          const newCont = {
            name: name.trim(),
            role: role.trim(),
            wallet: wallet.trim(),
            compensationType: compensationType.trim() as 'fixed' | 'bounty' | 'revenue-share',
            amount: amount.trim(),
            governanceId: governanceId?.trim() || '',
            proposalId: proposalId?.trim() || ''
          };
          
          if (!isDuplicate(newCont, contributors) && !isDuplicate(newCont, csvContributors)) {
            csvContributors.push({
              id: Date.now().toString() + i,
              ...newCont
            });
          } else {
            duplicates.push(newCont.name);
          }
        }
      }
      
      // Add new contributors to existing list
      setContributors(prev => [...prev, ...csvContributors]);
      
      if (csvContributors.length > 0) {
        showNotification('success', `Added ${csvContributors.length} contributors from CSV`);
      }
      if (duplicates.length > 0) {
        showNotification('info', `Skipped ${duplicates.length} duplicate entries`);
      }
    };
    
    reader.readAsText(file);
    // Reset file input
    event.target.value = '';
  };

  // Add or update contributor
  const handleAddContributor = () => {
    if (!newContributor.name || !newContributor.role || !newContributor.wallet || !newContributor.amount) {
      showNotification('error', 'Please fill in all required fields');
      return;
    }

    // Validate wallet address format
    if (!newContributor.wallet.startsWith('0x') || newContributor.wallet.length !== 42) {
      showNotification('error', 'Please enter a valid wallet address');
      return;
    }

    // Validate amount is a number
    if (isNaN(parseFloat(newContributor.amount)) || parseFloat(newContributor.amount) <= 0) {
      showNotification('error', 'Please enter a valid amount');
      return;
    }

    // Check for duplicates (exclude current contributor when editing)
    const otherContributors = editingContributor 
      ? contributors.filter(cont => cont.id !== editingContributor.id)
      : contributors;
    
    if (isDuplicate(newContributor, otherContributors)) {
      showNotification('error', 'Contributor with this wallet already exists');
      return;
    }

    if (editingContributor) {
      // Update existing contributor
      setContributors(prev => prev.map(cont => 
        cont.id === editingContributor.id 
          ? { ...cont, ...newContributor }
          : cont
      ));
      showNotification('success', 'Contributor updated successfully!');
    } else {
      // Add new contributor
      const contributor: DAOContributor = {
        id: Date.now().toString(),
        name: newContributor.name,
        role: newContributor.role,
        wallet: newContributor.wallet,
        compensationType: newContributor.compensationType,
        amount: newContributor.amount,
        governanceId: newContributor.governanceId,
        proposalId: newContributor.proposalId
      };
      setContributors(prev => [...prev, contributor]);
      showNotification('success', 'Contributor added successfully!');
    }

    setNewContributor({ 
      name: "", 
      role: "", 
      wallet: "", 
      compensationType: 'fixed', 
      amount: "", 
      governanceId: "", 
      proposalId: "" 
    });
    setEditingContributor(null);
    setShowAddContributorModal(false);
  };

  // Toggle contributor selection
  const toggleContributorSelection = (contributorId: string) => {
    setSelectedContributors(prev =>
      prev.includes(contributorId)
        ? prev.filter(id => id !== contributorId)
        : [...prev, contributorId]
    );
  };

  // Toggle all contributors
  const toggleAllContributors = () => {
    if (selectedContributors.length === contributors.length) {
      setSelectedContributors([]);
    } else {
      setSelectedContributors(contributors.map(cont => cont.id));
    }
  };

  // Calculate total amount for selected contributors
  const calculateTotalAmount = () => {
    return contributors
      .filter(cont => selectedContributors.includes(cont.id))
      .reduce((sum, cont) => sum + parseFloat(cont.amount), 0);
  };

  // Delete contributor
  const handleDeleteContributor = (contributorId: string) => {
    const contributor = contributors.find(cont => cont.id === contributorId);
    setContributors(prev => prev.filter(cont => cont.id !== contributorId));
    setSelectedContributors(prev => prev.filter(id => id !== contributorId));
    showNotification('success', `Removed ${contributor?.name || 'contributor'}`);
  };

  // Edit contributor
  const handleEditContributor = (contributor: DAOContributor) => {
    setEditingContributor(contributor);
    setNewContributor({
      name: contributor.name,
      role: contributor.role,
      wallet: contributor.wallet,
      compensationType: contributor.compensationType,
      amount: contributor.amount,
      governanceId: contributor.governanceId || '',
      proposalId: contributor.proposalId || ''
    });
    setShowAddContributorModal(true);
  };

  // Handle pay selected contributors
  const handlePaySelectedContributors = () => {
    if (selectedContributors.length === 0) {
      showNotification('error', 'Please select at least one contributor');
      return;
    }
    
    // Show governance modal first
    setShowGovernanceModal(true);
  };

  // Proceed with payment after governance setup
  const proceedWithDAOPayment = () => {
    setShowGovernanceModal(false);
    setShowSavePrompt(true);
  };

  // Execute DAO payment
  const executeDAOPayment = () => {
    setShowSavePrompt(false);
    setIsLoading(true);
    
    // Simulate DAO payment process
    setTimeout(() => {
      const executionMethod = executionMode === 'multisig' ? 'Multi-sig' : 'Governance Contract';
      showNotification('success', 
        `DAO payment initiated via ${executionMethod} for ${selectedContributors.length} contributors. Total: $${calculateTotalAmount().toLocaleString()}`
      );
      setSelectedContributors([]);
      setIsLoading(false);
    }, 2000);
  };

  // Save CSV and proceed with payment
  const saveAndProceedWithPayment = () => {
    saveContributorsAsCSV();
    executeDAOPayment();
  };

  const allSelected = selectedContributors.length === contributors.length;

  // Get compensation type badge color
  const getCompensationBadgeColor = (type: string) => {
    switch (type) {
      case 'fixed': return 'bg-blue-100 text-blue-800';
      case 'bounty': return 'bg-green-100 text-green-800';
      case 'revenue-share': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500/10 to-amber-500/10 backdrop-blur-sm border-b border-orange-200 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-orange-600 hover:text-orange-800 transition-all duration-300">
                <Home size={24} />
              </Link>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-600 bg-clip-text text-transparent">
                 DAO Governance Payroll
              </h1>
            </div>
            
            <div className="flex items-center space-x-6">
              {/* Action buttons */}
              <div className="flex items-center space-x-3">
                <button
                  onClick={downloadCSVTemplate}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-md hover:from-orange-600 hover:to-amber-600 transition-colors text-sm"
                >
                  <Download size={14} />
                  <span>Template</span>
                </button>
                
                <label className="flex items-center space-x-1 px-3 py-1.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-md hover:from-orange-600 hover:to-amber-600 transition-colors cursor-pointer text-sm">
                  <Upload size={14} />
                  <span>Upload CSV</span>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleCSVUpload}
                    className="hidden"
                  />
                </label>

                <button
                  onClick={() => setShowAddContributorModal(true)}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-md hover:from-orange-600 hover:to-amber-600 transition-colors text-sm"
                >
                  <Plus size={14} />
                  <span>Add Contributor</span>
                </button>
                
                <button
                  onClick={() => setShowTutorial(true)}
                  className="w-8 h-8 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-full flex items-center justify-center text-xs font-bold transition-colors"
                  title="Show Tutorial"
                >
                  i
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Contributors Table */}
        <div className="bg-transparent backdrop-blur-sm rounded-lg border border-orange-200/50 shadow-sm">
          <div className="px-6 py-4 border-b border-orange-100/50 bg-orange-50/30">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-6">
                <h2 className="text-lg font-medium text-gray-900">Contributors List</h2>
                {/* Contributors stats */}
                <div className="flex items-center space-x-4 text-sm text-orange-700 font-medium">
                  <div className="flex items-center space-x-1 px-2 py-1 bg-orange-100 rounded-full">
                    <Users size={14} />
                    <span>{contributors.length} Contributors</span>
                  </div>
                  <div className="flex items-center space-x-1 px-2 py-1 bg-amber-100 rounded-full">
                    <CheckCircle size={14} />
                    <span>{selectedContributors.length} Selected</span>
                  </div>
                  <div className="flex items-center space-x-1 px-2 py-1 bg-yellow-100 rounded-full">
                    <DollarSign size={14} />
                    <span>${calculateTotalAmount().toLocaleString()}</span>
                  </div>
                </div>
              </div>
              <h2 className="text-lg font-medium text-gray-900">DAO Contributors</h2>
              {selectedContributors.length > 0 && (
                <button
                  onClick={handlePaySelectedContributors}
                  disabled={isLoading}
                  className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg hover:from-orange-600 hover:to-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Shield size={18} />
                  <span>
                    {isLoading ? 'Processing...' : `Pay Selected (${selectedContributors.length})`}
                  </span>
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-orange-50/30 backdrop-blur-sm">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={toggleAllContributors}
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
                    Contributor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Compensation
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Governance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Wallet
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-transparent divide-y divide-orange-100/50">
                {contributors.map((contributor) => (
                  <tr 
                    key={contributor.id}
                    className={`hover:bg-gray-50 ${
                      selectedContributors.includes(contributor.id) ? 'bg-orange-50' : ''
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => toggleContributorSelection(contributor.id)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        {selectedContributors.includes(contributor.id) ? (
                          <CheckCircle size={20} className="text-blue-600" />
                        ) : (
                          <Circle size={20} />
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{contributor.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{contributor.role}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCompensationBadgeColor(contributor.compensationType)}`}>
                          {contributor.compensationType === 'revenue-share' ? `${contributor.amount}%` : `$${parseFloat(contributor.amount).toLocaleString()}`}
                        </span>
                        <span className="text-xs text-gray-400 capitalize">{contributor.compensationType.replace('-', ' ')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-xs space-y-1">
                        {contributor.proposalId && (
                          <div className="flex items-center space-x-1">
                            <Vote size={12} className="text-blue-400" />
                            <span className="text-blue-600">{contributor.proposalId}</span>
                          </div>
                        )}
                        {contributor.governanceId && (
                          <div className="flex items-center space-x-1">
                            <UserCheck size={12} className="text-green-400" />
                            <span className="text-green-600">{contributor.governanceId}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <Wallet size={16} className="text-gray-400" />
                        <span className="text-sm text-gray-500 font-mono">
                          {contributor.wallet.slice(0, 6)}...{contributor.wallet.slice(-4)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEditContributor(contributor)}
                          className="text-blue-400 hover:text-blue-600 transition-colors"
                          title="Edit contributor"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteContributor(contributor.id)}
                          className="text-red-400 hover:text-red-600 transition-colors"
                          title="Delete contributor"
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

          {contributors.length === 0 && (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No contributors</h3>
              <p className="mt-1 text-sm text-gray-500">
                Add DAO contributors manually or upload a CSV file to get started.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Add Contributor Modal */}
      {showAddContributorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {editingContributor ? 'Edit Contributor' : 'Add DAO Contributor'}
              </h3>
              <button
                onClick={() => {
                  setShowAddContributorModal(false);
                  setEditingContributor(null);
                  setNewContributor({ 
                    name: "", 
                    role: "", 
                    wallet: "", 
                    compensationType: 'fixed', 
                    amount: "", 
                    governanceId: "", 
                    proposalId: "" 
                  });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contributor Name
                  </label>
                  <input
                    type="text"
                    value={newContributor.name}
                    onChange={(e) => setNewContributor({...newContributor, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Alice Johnson"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <input
                    type="text"
                    value={newContributor.role}
                    onChange={(e) => setNewContributor({...newContributor, role: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Core Developer"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Wallet Address
                </label>
                <input
                  type="text"
                  value={newContributor.wallet}
                  onChange={(e) => setNewContributor({...newContributor, wallet: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  placeholder="0x742F35Cc6C4D0f2f8A78a0D8B2A7D3E4F5A6B7C8"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Compensation Type
                  </label>
                  <select
                    value={newContributor.compensationType}
                    onChange={(e) => setNewContributor({...newContributor, compensationType: e.target.value as 'fixed' | 'bounty' | 'revenue-share'})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="fixed">Fixed Salary</option>
                    <option value="bounty">Bounty</option>
                    <option value="revenue-share">Revenue Share</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {newContributor.compensationType === 'revenue-share' ? 'Percentage (%)' : 'Amount ($)'}
                  </label>
                  <input
                    type="number"
                    value={newContributor.amount}
                    onChange={(e) => setNewContributor({...newContributor, amount: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={newContributor.compensationType === 'revenue-share' ? '5.5' : '8000'}
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Governance ID <span className="text-gray-400">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={newContributor.governanceId}
                    onChange={(e) => setNewContributor({...newContributor, governanceId: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="GOV-001"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Proposal ID <span className="text-gray-400">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={newContributor.proposalId}
                    onChange={(e) => setNewContributor({...newContributor, proposalId: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="PROP-123"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowAddContributorModal(false);
                  setEditingContributor(null);
                  setNewContributor({ 
                    name: "", 
                    role: "", 
                    wallet: "", 
                    compensationType: 'fixed', 
                    amount: "", 
                    governanceId: "", 
                    proposalId: "" 
                  });
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddContributor}
                className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-md hover:from-orange-600 hover:to-amber-600 transition-colors"
              >
                {editingContributor ? 'Update Contributor' : 'Add Contributor'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Governance Modal */}
      {showGovernanceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center mb-4">
              <Shield className="h-6 w-6 text-blue-600 mr-3" />
              <h3 className="text-lg font-medium text-gray-900">DAO Payment Execution</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Execution Method
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="executionMode"
                      value="multisig"
                      checked={executionMode === 'multisig'}
                      onChange={(e) => setExecutionMode(e.target.value as 'multisig' | 'governance')}
                      className="mr-2"
                    />
                    <span className="text-sm">Multi-sig Wallet</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="executionMode"
                      value="governance"
                      checked={executionMode === 'governance'}
                      onChange={(e) => setExecutionMode(e.target.value as 'multisig' | 'governance')}
                      className="mr-2"
                    />
                    <span className="text-sm">Governance Contract</span>
                  </label>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Proposal ID (Optional)
                </label>
                <input
                  type="text"
                  value={governanceData.proposalId}
                  onChange={(e) => setGovernanceData({...governanceData, proposalId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="PROP-456"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Description
                </label>
                <textarea
                  value={governanceData.description}
                  onChange={(e) => setGovernanceData({...governanceData, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Monthly contributor compensation for Q4 2025"
                  rows={3}
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowGovernanceModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={proceedWithDAOPayment}
                className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-md hover:from-orange-600 hover:to-amber-600 transition-colors"
              >
                Continue to Payment
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
              <h3 className="text-lg font-medium text-gray-900">Save DAO Data</h3>
            </div>
            
            <p className="text-gray-600 mb-6">
              Would you like to save your current DAO contributor list as a CSV file before executing the payment? 
              This provides transparency and backup for governance records.
            </p>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={executeDAOPayment}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                No (Execute Payment)
              </button>
              <button
                onClick={saveAndProceedWithPayment}
                className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-md hover:from-orange-600 hover:to-amber-600 transition-colors"
              >
                Yes (Save & Execute)
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
          'bg-orange-500 text-white'
        }`}>
          {notification.type === 'success' && <CheckCircle2 size={20} />}
          {notification.type === 'error' && <AlertCircle size={20} />}
          {notification.type === 'info' && <AlertCircle size={20} />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Tutorial Modal */}
      {showTutorial && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-orange-600 to-amber-600 text-white p-6 rounded-t-xl">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold">🏠 Welcome to DAO Governance Payroll!</h2>
                  <p className="text-orange-100 mt-1">Transparent compensation management with governance integration</p>
                </div>
                <button
                  onClick={() => setShowTutorial(false)}
                  className="text-white hover:text-orange-200 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Step 1 */}
                <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg p-6 border border-orange-200">
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 bg-orange-600 text-white rounded-full flex items-center justify-center font-bold mr-3">1</div>
                    <h3 className="font-bold text-orange-800 text-lg">Governance Setup</h3>
                  </div>
                  <div className="space-y-3 text-sm text-orange-700">
                    <p>• Link payments to governance proposals</p>
                    <p>• Set proposal IDs for transparency</p>
                    <p>• Configure multi-sig or governance execution</p>
                    <p>• Ensure DAO approval before payments</p>
                    <div className="bg-orange-100 p-3 rounded-lg mt-3">
                      <p className="font-medium text-orange-800">Governance Types:</p>
                      <code className="text-xs text-orange-700">Multi-sig, Snapshot, On-chain</code>
                    </div>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg p-6 border border-orange-200">
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 bg-orange-600 text-white rounded-full flex items-center justify-center font-bold mr-3">2</div>
                    <h3 className="font-bold text-orange-800 text-lg">Add Contributors</h3>
                  </div>
                  <div className="space-y-3 text-sm text-orange-700">
                    <div>
                      <p className="font-medium">Compensation Types:</p>
                      <p>• <span className="bg-blue-100 px-2 py-1 rounded text-xs">Fixed</span> - Regular salaries</p>
                      <p>• <span className="bg-green-100 px-2 py-1 rounded text-xs">Bounty</span> - Task-based payments</p>
                      <p>• <span className="bg-purple-100 px-2 py-1 rounded text-xs">Revenue Share</span> - Percentage-based</p>
                    </div>
                    <div className="bg-orange-100 p-3 rounded-lg mt-3">
                      <p className="font-medium text-orange-800">Pro Tip:</p>
                      <p className="text-xs text-orange-700">Upload CSV with governance IDs for bulk processing!</p>
                    </div>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg p-6 border border-orange-200">
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 bg-orange-600 text-white rounded-full flex items-center justify-center font-bold mr-3">3</div>
                    <h3 className="font-bold text-orange-800 text-lg">Execute Payments</h3>
                  </div>
                  <div className="space-y-3 text-sm text-orange-700">
                    <p>• Select contributors for payment</p>
                    <p>• Review governance compliance</p>
                    <p>• Choose execution method (multi-sig/governance)</p>
                    <p>• Execute transparent batch payments</p>
                    <div className="bg-orange-100 p-3 rounded-lg mt-3">
                      <p className="font-medium text-orange-800">Transparency:</p>
                      <p className="text-xs text-orange-700">All payments linked to governance proposals!</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* DAO-specific Features */}
              <div className="mt-8 p-6 bg-gradient-to-r from-orange-100 to-amber-100 rounded-lg border border-orange-300">
                <div className="flex items-start space-x-3">
                  <Shield className="text-orange-600 mt-1" size={20} />
                  <div>
                    <h4 className="font-bold text-orange-800 mb-2">🏛️ DAO-Native Features:</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-orange-700">
                      <li><strong>Governance Integration:</strong> Link every payment to proposals</li>
                      <li><strong>Multi-sig Support:</strong> Execute through DAO treasury wallets</li>
                      <li><strong>Compensation Types:</strong> Fixed, bounty, and revenue sharing</li>
                      <li><strong>Transparency:</strong> All payments publicly verifiable</li>
                      <li><strong>Batch Processing:</strong> Efficient bulk payment execution</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-center space-x-4 mt-8">
                <button
                  onClick={() => setShowTutorial(false)}
                  className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
                >
                  Start Managing DAO Payroll 🏛️
                </button>
                <button
                  onClick={() => {
                    setShowTutorial(false);
                    downloadCSVTemplate();
                  }}
                  className="px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium"
                >
                  Download DAO Template 📄
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DAOPage;
