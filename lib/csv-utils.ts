import { Employee } from '@/lib/interfaces';

export interface PaymentRecord {
  employeeName: string;
  wallet: string;
  email: string;
  designation: string;
  company: string;
  amount: string;
  token: string;
  paymentDate: string;
  transactionHash?: string;
}

export const generateCsvContent = (
  employees: Employee[],
  token: { symbol: string; address?: string; decimals?: number },
  amounts: string[]
): string => {
  const headers = [
    'Employee Name',
    'Wallet Address',
    'Email',
    'Designation',
    'Company',
    'Salary (Monthly)',
    'Payment Amount',
    'Token',
    'Payment Date',
    'Transaction Hash'
  ];

  const rows = employees.map((employee, index) => {
    const amount = amounts[index] || '0';
    const formattedAmount = (parseFloat(amount) / Math.pow(10, token.decimals || 18)).toFixed(6);
    
    return [
      employee.name || 'N/A',
      employee.wallet,
      employee.email || 'N/A',
      employee.designation || 'N/A',
      employee.company || 'N/A',
      employee.salary || 'N/A',
      formattedAmount,
      token.symbol,
      new Date().toISOString().split('T')[0], // Current date in YYYY-MM-DD format
      '' // Transaction hash will be empty initially
    ];
  });

  const csvContent = [headers, ...rows]
    .map(row => row.map(field => `"${field}"`).join(','))
    .join('\n');

  return csvContent;
};

export const downloadCsv = (csvContent: string, filename?: string) => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename || `payroll-payment-${Date.now()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

export const generatePaymentCsv = (
  employees: Employee[],
  token: { symbol: string; address?: string; decimals?: number },
  amounts: string[],
  filename?: string
) => {
  const csvContent = generateCsvContent(employees, token, amounts);
  const defaultFilename = `payroll-${token.symbol}-${new Date().toISOString().split('T')[0]}.csv`;
  downloadCsv(csvContent, filename || defaultFilename);
};