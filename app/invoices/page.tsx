"use client";

import React, { useState } from "react";
import { 
  Plus, 
  Link2, 
  Copy, 
  Eye,
  Edit,
  Trash2,
  DollarSign,
  Calendar,
  User,
  Mail,
  CreditCard,
  CheckCircle,
  Clock,
  X,
  QrCode,
  Share2,
  Home
} from "lucide-react";
import Link from "next/link";

interface Invoice {
  id: string;
  title: string;
  description: string;
  amount: string;
  currency: string;
  recipient: string;
  walletAddress: string;
  dueDate: string;
  status: 'pending' | 'paid' | 'expired';
  createdAt: string;
  paymentLink: string;
}

const InvoicesPage: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [notification, setNotification] = useState<{type: 'success' | 'error' | 'info'; message: string} | null>(null);
  
  const [newInvoice, setNewInvoice] = useState({
    title: "",
    description: "",
    amount: "",
    currency: "ETH",
    recipient: "",
    walletAddress: "",
    dueDate: ""
  });

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const generateInvoiceId = () => {
    return 'inv_' + Math.random().toString(36).substr(2, 9);
  };

  const generatePaymentLink = (invoice: any) => {
    const data = {
      t: invoice.title,
      d: invoice.description,
      a: invoice.amount,
      c: invoice.currency,
      r: invoice.recipient,
      w: invoice.walletAddress,
      due: invoice.dueDate
    };
    const encoded = btoa(JSON.stringify(data)).replace(/[+/=]/g, (m) => ({'+': '-', '/': '_', '=': ''}[m] || ''));
    const baseUrl = window.location.origin;
    return `${baseUrl}/pay/${encoded}`;
  };

  const handleCreateInvoice = () => {
    if (!newInvoice.title || !newInvoice.amount || !newInvoice.recipient || !newInvoice.walletAddress) {
      showNotification('error', 'Please fill in all required fields');
      return;
    }

    const invoiceId = generateInvoiceId();
    const tempInvoice = {
      ...newInvoice,
      id: invoiceId
    };
    const paymentLink = generatePaymentLink(tempInvoice);
    
    const invoice: Invoice = {
      id: invoiceId,
      title: newInvoice.title,
      description: newInvoice.description,
      amount: newInvoice.amount,
      currency: newInvoice.currency,
      recipient: newInvoice.recipient,
      walletAddress: newInvoice.walletAddress,
      dueDate: newInvoice.dueDate,
      status: 'pending',
      createdAt: new Date().toISOString(),
      paymentLink
    };

    setInvoices([invoice, ...invoices]);
    setNewInvoice({
      title: "",
      description: "",
      amount: "",
      currency: "ETH",
      recipient: "",
      walletAddress: "",
      dueDate: ""
    });
    setShowCreateModal(false);
    showNotification('success', 'Payment link created successfully!');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showNotification('success', 'Payment link copied to clipboard!');
  };

  const deleteInvoice = (id: string) => {
    setInvoices(invoices.filter(invoice => invoice.id !== id));
    showNotification('info', 'Invoice deleted');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'expired': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle size={16} />;
      case 'expired': return <X size={16} />;
      default: return <Clock size={16} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Link 
                href="/"
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <Home size={20} className="mr-2" />
                Home
              </Link>
              <div className="text-gray-300">|</div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <CreditCard className="mr-3 text-indigo-600" size={28} />
                Payment Links & Invoices
              </h1>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-colors font-medium"
            >
              <Plus size={20} className="mr-2" />
              Create Payment Link
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Invoices</p>
                <p className="text-2xl font-bold text-gray-900">{invoices.length}</p>
              </div>
              <div className="p-3 bg-indigo-100 rounded-lg">
                <CreditCard className="text-indigo-600" size={24} />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {invoices.filter(inv => inv.status === 'pending').length}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Clock className="text-yellow-600" size={24} />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Paid</p>
                <p className="text-2xl font-bold text-green-600">
                  {invoices.filter(inv => inv.status === 'paid').length}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="text-green-600" size={24} />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Amount</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${invoices.reduce((sum, inv) => sum + parseFloat(inv.amount || '0'), 0).toFixed(2)}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <DollarSign className="text-purple-600" size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Invoices List */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Payment Links</h2>
          </div>
          
          {invoices.length === 0 ? (
            <div className="p-12 text-center">
              <CreditCard className="mx-auto text-gray-400 mb-4" size={48} />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No payment links yet</h3>
              <p className="text-gray-600 mb-6">Create your first payment link to get started</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-colors font-medium"
              >
                Create Payment Link
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recipient</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{invoice.title}</div>
                          <div className="text-sm text-gray-500">{invoice.description}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{invoice.recipient}</div>
                          <div className="text-sm text-gray-500 font-mono">{invoice.walletAddress}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {invoice.currency} {invoice.amount}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                          {getStatusIcon(invoice.status)}
                          <span className="ml-1 capitalize">{invoice.status}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'No due date'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => copyToClipboard(invoice.paymentLink)}
                            className="text-indigo-600 hover:text-indigo-900 p-1 rounded"
                            title="Copy payment link"
                          >
                            <Copy size={16} />
                          </button>
                          <Link
                            href={`/pay/${invoice.id}`}
                            className="text-green-600 hover:text-green-900 p-1 rounded"
                            title="Preview payment page"
                          >
                            <Eye size={16} />
                          </Link>
                          <button
                            onClick={() => deleteInvoice(invoice.id)}
                            className="text-red-600 hover:text-red-900 p-1 rounded"
                            title="Delete invoice"
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
          )}
        </div>
      </div>

      {/* Create Invoice Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Create Payment Link</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Invoice Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Invoice Title *
                  </label>
                  <input
                    type="text"
                    value={newInvoice.title}
                    onChange={(e) => setNewInvoice({...newInvoice, title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Web Development Services"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount *
                  </label>
                  <div className="flex">
                    <select
                      value={newInvoice.currency}
                      onChange={(e) => setNewInvoice({...newInvoice, currency: e.target.value})}
                      className="px-3 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50"
                    >
                      <option value="ETH">ETH</option>
                      <option value="USDC">USDC</option>
                      <option value="USDT">USDT</option>
                      <option value="BTC">BTC</option>
                    </select>
                    <input
                      type="number"
                      value={newInvoice.amount}
                      onChange={(e) => setNewInvoice({...newInvoice, amount: e.target.value})}
                      className="flex-1 px-3 py-2 border border-l-0 border-gray-300 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="100.00"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={newInvoice.description}
                  onChange={(e) => setNewInvoice({...newInvoice, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  rows={3}
                  placeholder="Payment for web development services including design and implementation..."
                />
              </div>

              {/* Recipient Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Recipient Name *
                  </label>
                  <input
                    type="text"
                    value={newInvoice.recipient}
                    onChange={(e) => setNewInvoice({...newInvoice, recipient: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Wallet Address *
                  </label>
                  <input
                    type="text"
                    value={newInvoice.walletAddress}
                    onChange={(e) => setNewInvoice({...newInvoice, walletAddress: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                    placeholder="0x742F35Cc6C4D0f2f8A78a0D8B2A7D3E4F5A6B7C8"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Due Date
                </label>
                <input
                  type="date"
                  value={newInvoice.dueDate}
                  onChange={(e) => setNewInvoice({...newInvoice, dueDate: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateInvoice}
                className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-colors"
              >
                Create Payment Link
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
          'bg-blue-500 text-white'
        }`}>
          <span>{notification.message}</span>
        </div>
      )}
    </div>
  );
};

export default InvoicesPage;
