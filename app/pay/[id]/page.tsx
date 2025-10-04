"use client";

import React, { useState, useEffect } from "react";
import { 
  CreditCard, 
  Wallet, 
  CheckCircle, 
  Clock, 
  ArrowLeft,
  Shield,
  Copy,
  QrCode,
  User,
  Mail,
  Calendar,
  DollarSign,
  AlertCircle,
  Loader
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

interface InvoiceData {
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
}

const PaymentPage: React.FC = () => {
  const params = useParams();
  const encodedData = params.id as string;
  
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [senderAddress, setSenderAddress] = useState('');

  // Decode invoice data from URL
  useEffect(() => {
    try {
      // Decode the URL-safe base64
      const base64 = encodedData.replace(/[-_]/g, (m) => ({'-': '+', '_': '/'}[m] || ''));
      const paddedBase64 = base64 + '='.repeat((4 - base64.length % 4) % 4);
      const decoded = JSON.parse(atob(paddedBase64));
      
      const invoiceData: InvoiceData = {
        id: encodedData,
        title: decoded.t || 'Payment Request',
        description: decoded.d || '',
        amount: decoded.a || '0',
        currency: decoded.c || 'ETH',
        recipient: decoded.r || 'Unknown',
        walletAddress: decoded.w || '',
        dueDate: decoded.due || '',
        status: 'pending',
        createdAt: new Date().toISOString()
      };
      
      setInvoice(invoiceData);
      setLoading(false);
    } catch (error) {
      console.error('Failed to decode payment link:', error);
      setLoading(false);
    }
  }, [encodedData]);

  const handlePayment = async () => {
    setPaymentStatus('processing');
    
    // Simulate payment processing
    setTimeout(() => {
      setPaymentStatus('success');
      if (invoice) {
        setInvoice({ ...invoice, status: 'paid' });
      }
    }, 3000);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const isDueSoon = (dueDate: string) => {
    const due = new Date(dueDate);
    const now = new Date();
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7 && diffDays > 0;
  };

  const isOverdue = (dueDate: string) => {
    const due = new Date(dueDate);
    const now = new Date();
    return due < now;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader className="animate-spin mx-auto mb-4 text-blue-600" size={48} />
          <p className="text-gray-600">Loading payment details...</p>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto mb-4 text-red-600" size={48} />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invoice Not Found</h1>
          <p className="text-gray-600 mb-6">The payment link you're looking for doesn't exist or has expired.</p>
          <Link href="/" className="text-blue-600 hover:text-blue-800">
            Return to Homepage
          </Link>
        </div>
      </div>
    );
  }

  if (paymentStatus === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4 text-center">
          <CheckCircle className="mx-auto mb-6 text-green-600" size={64} />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Payment Successful!</h1>
          <p className="text-gray-600 mb-6">
            Your payment of {invoice.currency} {invoice.amount} has been processed successfully.
          </p>
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <div className="text-sm text-gray-600">Transaction ID</div>
            <div className="font-mono text-sm text-gray-900">tx_payment_{invoice.id}</div>
          </div>
          <Link
            href="/"
            className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors inline-block"
          >
            Return to Homepage
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link href="/" className="flex items-center text-gray-600 hover:text-gray-900 transition-colors">
            <ArrowLeft size={20} className="mr-2" />
            Back to VietBuild-Pay
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Invoice Details */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Invoice Details</h1>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                invoice.status === 'expired' ? 'bg-red-100 text-red-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {invoice.status === 'paid' && <CheckCircle size={16} className="inline mr-1" />}
                {invoice.status === 'pending' && <Clock size={16} className="inline mr-1" />}
                {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{invoice.title}</h3>
                <p className="text-gray-600 mt-1">{invoice.description}</p>
              </div>

              <div className="border-t pt-4 space-y-3">
                <div className="flex items-center text-gray-600">
                  <User size={18} className="mr-3" />
                  <span>Bill to: {invoice.recipient}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Wallet size={18} className="mr-3" />
                  <span className="font-mono text-sm">{invoice.walletAddress}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Calendar size={18} className="mr-3" />
                  <span>
                    Due: {formatDate(invoice.dueDate)}
                    {isDueSoon(invoice.dueDate) && (
                      <span className="ml-2 text-yellow-600 font-medium">(Due Soon)</span>
                    )}
                    {isOverdue(invoice.dueDate) && (
                      <span className="ml-2 text-red-600 font-medium">(Overdue)</span>
                    )}
                  </span>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center text-2xl font-bold">
                  <span>Total Amount:</span>
                  <span className="text-blue-600">{invoice.currency} {invoice.amount}</span>
                </div>
              </div>

              {/* Security Notice */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                <div className="flex items-start">
                  <Shield className="text-blue-600 mt-0.5 mr-3 flex-shrink-0" size={18} />
                  <div className="text-sm">
                    <div className="font-medium text-blue-900">Secure Payment</div>
                    <div className="text-blue-700">Your payment is protected by enterprise-grade encryption and security measures.</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Form */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Complete Crypto Payment</h2>

            {/* Crypto Payment Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Wallet Address
                </label>
                <input
                  type="text"
                  value={senderAddress}
                  onChange={(e) => setSenderAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  placeholder="0x742F35Cc6C4D0f2f8A78a0D8B2A7D3E4F5A6B7C8"
                />
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Recipient Wallet</span>
                  <button 
                    onClick={() => copyToClipboard(invoice.walletAddress)}
                    className="text-blue-600 hover:text-blue-800 flex items-center"
                  >
                    <Copy size={16} className="mr-1" />
                    Copy
                  </button>
                </div>
                <div className="font-mono text-sm text-gray-900 break-all bg-white p-2 rounded border">
                  {invoice.walletAddress}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-800">Amount to Send</span>
                  <button 
                    onClick={() => copyToClipboard(invoice.amount)}
                    className="text-blue-600 hover:text-blue-800 flex items-center"
                  >
                    <Copy size={16} className="mr-1" />
                    Copy
                  </button>
                </div>
                <div className="text-2xl font-bold text-blue-900">
                  {invoice.amount} {invoice.currency}
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-800 mb-2">Payment Instructions:</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm text-yellow-700">
                  <li>Copy the recipient wallet address above</li>
                  <li>Send exactly {invoice.amount} {invoice.currency} to that address</li>
                  <li>Enter your wallet address in the form</li>
                  <li>Click "Confirm Payment" to complete</li>
                </ol>
              </div>
            </div>

            {/* Payment Button */}
            <button
              onClick={handlePayment}
              disabled={paymentStatus === 'processing' || invoice.status === 'paid' || !senderAddress}
              className={`w-full mt-6 py-4 px-6 rounded-lg font-medium transition-colors ${
                paymentStatus === 'processing' 
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : invoice.status === 'paid'
                  ? 'bg-green-100 text-green-800 cursor-not-allowed'
                  : !senderAddress
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700'
              }`}
            >
              {paymentStatus === 'processing' ? (
                <div className="flex items-center justify-center">
                  <Loader className="animate-spin mr-2" size={20} />
                  Confirming Payment...
                </div>
              ) : invoice.status === 'paid' ? (
                <div className="flex items-center justify-center">
                  <CheckCircle className="mr-2" size={20} />
                  Payment Confirmed
                </div>
              ) : !senderAddress ? (
                <>Enter Your Wallet Address</>
              ) : (
                <>Confirm Payment of {invoice.amount} {invoice.currency}</>
              )}
            </button>

            {/* Supported Cryptocurrencies */}
            <div className="mt-6 text-center text-sm text-gray-500">
              <div>We support ETH, USDC, USDT, BTC and other major cryptocurrencies</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;

