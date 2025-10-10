"use client";

import React, { useState, useEffect } from "react";
import PaymentsHeader from "@/components/payroll/PaymentHeader";
import ConfigurePayModal from "@/components/payroll/ConfigurePayModal";
import PaymentDashboard from "@/components/payroll/PaymentDashboard";
import EmployeeTable2 from "@/components/payroll/EmployeeTable2";
import AddEmployeeModal2 from "@/components/payroll/AddEmployeeModal2";
import BulkuploadModal2 from "@/components/payroll/BulkuploadModal2";
import { CsvDownloadModal } from "@/components/payroll/CsvDownloadModal";
import { Employee, PayrollData } from "@/lib/interfaces";
import { generatePaymentCsv } from "@/lib/csv-utils";
import { toast } from "react-hot-toast";
import { parseUnits } from 'ethers';
import { getPayrollAddress, NATIVE_TOKEN_ADDRESS } from '@/lib/contract-addresses';

import { allMainnetChains as chains, NATIVE_ADDRESS } from '@/lib/evm-chains-mainnet';
import { tokensPerMainnetChain as tokens } from '@/lib/evm-tokens-mainnet';
import payrollAbi from '@/lib/PayrollAbi.json';
import { erc20Abi } from 'viem';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useConfig, useChainId } from 'wagmi';
import { waitForTransactionReceipt } from "@wagmi/core";
import { useReadContract } from "wagmi";
import useFullPageLoader from "@/hooks/usePageLoader";
import Loader from "@/components/ui/loader";
import { Home } from "lucide-react";
import Link from "next/link";
import { ethers } from 'ethers';
import { set } from "react-hook-form";

const PaymentsPage: React.FC = () => {
  // Original state
  const [showConfigurePayModal, setShowConfigurePayModal] = useState(true);
  const [exchangeRate, setExchangeRate] = useState(1);
  const [selectedTokenSymbol, setSelectedTokenSymbol] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [walletToDelete, setWalletToDelete] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string>('');

  // Lifted state from PaymentDashboard
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [txError, setTxError] = useState('');
  const [needsApproval, setNeedsApproval] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [approvalTxHash, setApprovalTxHash] = useState<`0x${string}` | undefined>(undefined);
  const [showPaymentStatus, setShowPaymentStatus] = useState(false);
  const [selectedChain, setSelectedChain] = useState(chains[0]);
  const [selectedToken, setSelectedToken] = useState(tokens[chains[0].id][0]);
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>(undefined);
  const [showCsvDownloadModal, setShowCsvDownloadModal] = useState(false);

  // Wallet and transaction hooks
  const { address, isConnected, chainId } = useAccount();
  const currentChainId = useChainId();
  const config = useConfig();
  
  // Get payroll contract address for current network
  const getTransferContract = () => {
    return getPayrollAddress(currentChainId);
  };
  
  // Debug network information
  useEffect(() => {
    console.log('=== PAYROLL NETWORK DEBUG ===');
    console.log('Chain ID:', currentChainId);
    console.log('Payroll Contract Address:', getTransferContract());
    console.log('Is Mainnet (39):', currentChainId === 39);
    console.log('Is Testnet (2484):', currentChainId === 2484);
  }, [currentChainId]);
  
  // Check if contract is available on current network
  const isContractAvailable = !!getTransferContract();
  const networkName = currentChainId === 39 ? 'U2U Mainnet' : currentChainId === 2484 ? 'U2U Testnet' : 'Unknown Network';
  const { writeContractAsync, isPending: isWritePending, data: wagmiTxHash } = useWriteContract();
  const { isLoading: isTxLoading, isSuccess: isTxSuccess, isError: isTxError } =
    useWaitForTransactionReceipt({ hash: wagmiTxHash });

  // State for transaction hash
  const [customTxHash, setCustomTxHash] = useState<`0x${string}` | undefined>(undefined);


  useEffect(() => {
    if (wagmiTxHash) {
      setTxHash(wagmiTxHash as `0x${string}`);
    } else if (customTxHash) {
      setTxHash(customTxHash);
    }
  }, [wagmiTxHash, customTxHash]);

  // Derived loading state
  const isLoadingDerived = isApproving || isSending || isWritePending || isTxLoading;

  // Wagmi allowance hook
  const { data: wagmiAllowance, refetch: refetchWagmiAllowance } = useReadContract({
    address: selectedToken?.address !== NATIVE_ADDRESS
      ? (selectedToken?.address as `0x${string}`)
      : undefined,
    abi: erc20Abi,
    functionName: 'allowance',
    args: [
      address as `0x${string}`,
      getTransferContract() as `0x${string}`
    ],
    chainId: currentChainId,
    query: {
      enabled: isConnected &&
        !!selectedToken &&
        !!address &&
        selectedToken?.address !== NATIVE_ADDRESS &&
        !!getTransferContract()
    }
  });

  // Use wagmi allowance
  const allowance = wagmiAllowance;

  // Refetch allowance
  const refetchAllowance = async () => {
    refetchWagmiAllowance();
  };

  useEffect(() => {
    // Initialize with empty data - no demo employees
    setEmployees([]);
    setIsLoading(false);

    // Set company name
    setCompanyName("Demo Company");
  }, []);

  // Effect to update chain based on connected wallet
  useEffect(() => {
    if (chainId) {
      const chain = chains.find(c => c.id === chainId);
      if (chain) {
        setSelectedChain(chain);

        if (tokens[chain.id]?.length > 0) {
          const matchedToken = selectedTokenSymbol
            ? tokens[chain.id].find(token => token.symbol === selectedTokenSymbol)
            : undefined;
          setSelectedToken(matchedToken || tokens[chain.id][0]);
        }
      }
    }
  }, [chainId, selectedTokenSymbol]);

  // Handle token symbol changes
  useEffect(() => {
    if (selectedTokenSymbol && selectedChain) {
      const chainTokens = tokens[currentChainId] || [];
      const matchedToken = chainTokens.find(token => token.symbol === selectedTokenSymbol);

      if (matchedToken) {
        setSelectedToken(matchedToken);
      }
    }
  }, [selectedTokenSymbol, selectedChain]);




  // Effect to clear txError after 6 seconds
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (txError) {
      timer = setTimeout(() => {
        setTxError(''); // Clear the error
      }, 6000); // 6 seconds
    }
    // Cleanup function to clear the timeout if the component unmounts
    // or if txError changes before the timeout finishes
    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [txError]); // Re-run this effect whenever txError changes




  // Convert USD salary to token amount
  const usdToToken = (usdAmount: string) => {
    return (parseFloat(usdAmount) * exchangeRate).toFixed(6);
  };

  // Calculate total amount needed for selected employees
  const calculateTotalAmount = () => {
    const totalUsd = employees
      .filter(emp => selectedEmployees.includes(emp.wallet))
      .reduce((sum, emp) => sum + parseFloat(emp.salary), 0);
    
    const totalTokenAmount = usdToToken(totalUsd.toString());
    // For U2U chain (id 39) and native token, ensure we use 18 decimals
    const decimals = currentChainId === 39 && selectedToken.address === NATIVE_ADDRESS 
      ? 18 
      : selectedToken.decimals;
    return parseUnits(totalTokenAmount, decimals);
  };

  // Get recipients and amounts for selected employees
  const getRecipientsAndAmounts = () => {
    const selectedEmployeeData = employees.filter(emp => selectedEmployees.includes(emp.wallet));

    return {
      recipients: selectedEmployeeData.map(emp => emp.wallet as `0x${string}`),
      amounts: selectedEmployeeData.map(emp => {
        const tokenAmount = usdToToken(emp.salary);
        // For U2U chain (id 39) and native token, ensure we use 18 decimals
        const decimals = currentChainId === 39 && selectedToken.address === NATIVE_ADDRESS 
          ? 18 
          : selectedToken.decimals;
        return parseUnits(tokenAmount, decimals);
      })
    };
  };

  // CSV download handlers
  const handleCsvDownload = (): void => {
    const selectedEmployeeData = employees.filter(emp => selectedEmployees.includes(emp.wallet));
    const { amounts } = getRecipientsAndAmounts();
    const amountsStr = amounts.map(amount => amount.toString());
    
    generatePaymentCsv(
      selectedEmployeeData,
      {
        symbol: selectedToken.symbol,
        address: selectedToken.address,
        decimals: selectedToken.decimals
      },
      amountsStr
    );
    
    toast.success('CSV file downloaded successfully');
    setShowCsvDownloadModal(false);
    processPayment(); // Continue with payment after download
  };

  const handleContinueWithoutCsv = (): void => {
    setShowCsvDownloadModal(false);
    processPayment(); // Continue with payment without download
  };

  const handleCloseCsvModal = (): void => {
    setShowCsvDownloadModal(false);
    // Don't process payment if user closes modal
  };

  // Get block explorer URL based on chain
  const getExplorerUrl = (txHash: `0x${string}` | undefined): string => {
    const explorer = selectedChain.blockExplorers?.default?.url;
    if (!explorer) return '#';
    return `${explorer}/tx/${txHash}`;
  };

  // Handle employee selection
  const toggleEmployeeSelection = (employeeId: string) => {
    setSelectedEmployees(prev =>
      prev.includes(employeeId)
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    );
  };



  useEffect(() => {
    if (
      selectedToken?.address !== NATIVE_ADDRESS &&
      allowance !== undefined &&
      selectedEmployees.length > 0
    ) {
      try {
        const totalAmount = calculateTotalAmount();
        setNeedsApproval(allowance < totalAmount);
      } catch (e) {
        // Invalid amount format, ignore
      }
    } else {
      setNeedsApproval(false);
    }
  }, [allowance, selectedEmployees, selectedToken]);

  // Force refetch allowance when token changes
  useEffect(() => {
    if (isConnected && selectedToken && address && selectedToken?.address !== NATIVE_ADDRESS) {
      refetchAllowance();
    }
  }, [selectedToken?.address, currentChainId, refetchAllowance, isConnected, address, selectedToken]);

  // Check if all employees are selected
  const allEmployeesSelected = selectedEmployees.length === employees.length;

  // Toggle all employees selection
  const toggleAllEmployees = () => {
    if (allEmployeesSelected) {
      setSelectedEmployees([]);
    } else {
      setSelectedEmployees(employees.map(emp => emp.wallet));
    }
  };

  // Helper function to send transaction after approval
  const sendTransactionAfterApproval = async (
    transferContractAddress: string,
    recipients: `0x${string}`[],
    amounts: bigint[],
    totalAmount: bigint
  ) => {
    setIsSending(true);
    console.log('Sending payroll transaction with native U2U token...');

    try {
      // Always use native token transfer (address(0))
      console.log('Sending native U2U token transfer via payroll contract');
      const finalTxHash = await writeContractAsync({
        address: transferContractAddress as `0x${string}`,
        abi: payrollAbi.abi,
        functionName: 'bulkTransfer',
        args: [
          NATIVE_TOKEN_ADDRESS, // Use address(0) for native token
          recipients,
          amounts
        ],
        value: totalAmount,
        gas: BigInt(400000),
        chainId: currentChainId
      });

      // Set the state and log immediately with the correct hash
      setTxHash(finalTxHash);
      await logPayrollTransaction(finalTxHash);
      
      console.log('Transaction sent successfully');
    } catch (error) {
      console.error('Error in sendTransactionAfterApproval:', error);
      throw error;
    } finally {
      setIsSending(false);
    }
  };

  // Log payroll transaction (simplified)
  const logPayrollTransaction = async (transactionHash: `0x${string}`) => {
    console.log('Transaction completed with hash:', transactionHash);
    
    if (!transactionHash) {
      console.error("Missing transaction hash");
      return;
    }

    // Show success toast instead of backend logging
    toast.success("Payment transaction completed successfully");
    setTxHash(undefined);
    setCustomTxHash(undefined);
    setApprovalTxHash(undefined);
  };

  // Main transaction handling function
  const handleTransaction = async () => {
    setTxError(''); // Clear previous errors immediately on new attempt

    if (selectedEmployees.length === 0) {
      setTxError('Please select at least one employee to pay');
      return;
    }

    // Show CSV download modal before processing payment
    setShowCsvDownloadModal(true);
  };

  // Process payment after CSV modal interaction
  const processPayment = async () => {
    setShowPaymentStatus(true);

    try {
      const transferContractAddress = getTransferContract();

      if (!transferContractAddress) {
        setTxError('No transfer contract available for this network');
        return;
      }

      const { recipients, amounts } = getRecipientsAndAmounts();
      const totalAmount = amounts.reduce((sum, amount) => sum + amount, BigInt(0));

      // Force native token usage - skip approval and directly send transaction
      await sendTransactionAfterApproval(transferContractAddress, recipients, amounts, totalAmount);
    } catch (error: any) {
      setIsSending(false);
      setTxError(error.message || 'Transaction failed');
    }
  };

  // Handler functions
  const handleAddEmployeeClick = () => {
    setSelectedEmployee(null);
    setShowAddModal(true);
  };

  const handleBulkUploadClick = () => {
    setShowBulkUploadModal(true);
  };

  const confirmDeleteEmployee = async () => {
    if (!walletToDelete) return;

    try {
      setEmployees((prevEmployees) => prevEmployees.filter((employee) => employee.wallet !== walletToDelete));
      toast.success("Employee deleted successfully");
    } catch (error: any) {
      console.error("Failed to delete employee:", error);
      toast.error("Failed to delete employee");
    } finally {
      setIsDeleteDialogOpen(false);
      setWalletToDelete(null);
    }
  };

  const handleEditEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setShowAddModal(true);
  };

  const handleAddEmployee = async (employee: Employee) => {
    try {
      const newEmployee = { ...employee, wallet: employee.wallet };
      setEmployees((prevEmployees) => [...prevEmployees, newEmployee]);
      setShowAddModal(false);
      toast.success("Employee added successfully");
    } catch (error: any) {
      console.error("Failed to add employee:", error);
      toast.error("Failed to add employee");
    }
  };

  const handleUpdateEmployee = async (wallet: string, updatedData: Partial<Employee>) => {
    try {
      setEmployees((prevEmployees) =>
        prevEmployees.map((emp) =>
          emp.wallet === wallet ? { ...emp, ...updatedData } : emp
        )
      );
      setShowAddModal(false);
      setSelectedEmployee(null);
      toast.success("Employee updated successfully");
    } catch (error: any) {
      console.error("Failed to update employee:", error);
      toast.error("Failed to update employee");
    }
  };

  // Handle exchange rate updates from the modal
  const handleExchangeRateUpdate = (rate: number, tokenSymbol: string) => {
    setExchangeRate(rate);
    setSelectedTokenSymbol(tokenSymbol);
  };

  const hasTransactionActivity = isLoadingDerived || isTxSuccess || isTxError || !!txError || !!approvalTxHash || !!txHash;

  return (
    <div className="relative h-screen w-screen dark:text-white text-black p-6 z-10">
      <div className="absolute top-4 left-4">
        <Link href="/">
          <Home className="text-black dark:hover:text-gray-200 hover:text-gray-800 dark:text-white" size={30} />
        </Link>
      </div>
      <div className="flex flex-col max-w-screen max-h-screen items-center m-10">
        <PaymentsHeader
          onConfigurePayments={() => setShowConfigurePayModal(true)}
          onAddEmployee={handleAddEmployeeClick}
          onBulkUpload={handleBulkUploadClick} />

        

        {/* Contract Availability Warning */}
        {!isContractAvailable && (
          <div className="w-full max-w-6xl mb-6">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex items-center">
                <div className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-3">⚠️</div>
                <div>
                  <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                    Payroll Contract Not Available
                  </h3>
                  <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                    The payroll contract is not deployed on {networkName}. Please switch to U2U Mainnet or U2U Testnet to use this feature.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <EmployeeTable2
          employees={employees}
          selectedEmployees={selectedEmployees}
          toggleEmployeeSelection={toggleEmployeeSelection}
          usdToToken={usdToToken}
          selectedTokenSymbol={selectedTokenSymbol}
          isLoading={isLoading}
          deleteEmployeeById={(wallet: string) => {
            setWalletToDelete(wallet);
            setIsDeleteDialogOpen(true);
          }}
          onEditEmployee={handleEditEmployee}
          exchangeRate={exchangeRate}
          handleTransaction={handleTransaction}
          isLoadingDerived={isLoadingDerived}
          needsApproval={needsApproval}
          isApproving={isApproving}
          isSending={isSending}
          isWritePending={isWritePending}
          isTxLoading={isTxLoading}
          selectedToken={selectedToken}
        />

        <ConfigurePayModal
          isOpen={showConfigurePayModal}
          onClose={() => setShowConfigurePayModal(false)}
          onExchangeRateUpdate={handleExchangeRateUpdate}
        />

        <AddEmployeeModal2
          isOpen={showAddModal}
          onClose={() => {
            setShowAddModal(false);
            setSelectedEmployee(null);
          }}
          onAddEmployee={handleAddEmployee}
          onUpdateEmployee={handleUpdateEmployee}
          editEmployee={selectedEmployee}
          onUploadSuccess={() => {
            setShowBulkUploadModal(true);
          }}
        />

        <BulkuploadModal2
          isOpen={showBulkUploadModal}
          onClose={() => setShowBulkUploadModal(false)}
          onUploadSuccess={() => {
            setShowBulkUploadModal(false);
          }}
          onEmployeesUploaded={(newEmployees: any[]) => {
            setEmployees(prev => [...prev, ...newEmployees]);
          }}
        />

        {/* Delete Confirmation Dialog */}
        {isDeleteDialogOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto dark:bg-black dark:text-white text-black backdrop-blur-sm flex items-center justify-center">
            <div className="dark:bg-[#1A1F2E] rounded-lg p-6 w-full max-w-md mx-4 shadow-xl border border-gray-700 animate-fade-in">
              <h3 className="text-xl font-medium dark:text-white mb-4">Confirm Deletion</h3>
              <p className="dark:text-gray-300 mb-6">
                Are you sure you want to delete this employee? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setIsDeleteDialogOpen(false);
                    setWalletToDelete(null);
                  }}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md text-white transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteEmployee}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-md text-white transition-colors duration-200"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CSV Download Modal */}
        <CsvDownloadModal
          isOpen={showCsvDownloadModal}
          onClose={handleCloseCsvModal}
          onDownload={handleCsvDownload}
          onContinue={handleContinueWithoutCsv}
          selectedEmployees={employees.filter(emp => selectedEmployees.includes(emp.wallet))}
          selectedToken={selectedToken}
          totalAmount={selectedEmployees.length > 0 ? calculateTotalAmount().toString() : '0'}
        />
      </div>
    </div>
  );
};

const PaymentPage = useFullPageLoader(
  PaymentsPage, <Loader />
);

export default PaymentPage;