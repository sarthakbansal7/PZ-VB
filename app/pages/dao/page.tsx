"use client";

import React, { useState, useEffect } from "react";
import PaymentsHeader from "@/components/payroll/PaymentHeader";
import ConfigurePayModal from "@/components/payroll/ConfigurePayModal";
import PaymentDashboard from "@/components/payroll/PaymentDashboard";
import EmployeeTable2 from "@/components/payroll/EmployeeTable2";
import AddEmployeeModal2 from "@/components/payroll/AddEmployeeModal2";
import BulkuploadModal2 from "@/components/payroll/BulkuploadModal2";
import { Employee, PayrollData } from "@/lib/interfaces";
import { toast } from "react-hot-toast";
import { parseUnits } from 'ethers';
import { getBulkTransferAddress, NATIVE_TOKEN_ADDRESS } from '@/lib/contract-addresses';
import { contractMainnetAddresses as transferContract } from '@/lib/evm-tokens-mainnet';
import { allMainnetChains as chains, NATIVE_ADDRESS } from '@/lib/evm-chains-mainnet';
import { tokensPerMainnetChain as tokens } from '@/lib/evm-tokens-mainnet';
import transferAbi from '@/lib/Transfer.json';
import { erc20Abi } from 'viem';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useConfig } from 'wagmi';
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

  // Get transfer contract address for current chain
  const getTransferContract = () => {
    // First try to get from the new contract addresses configuration
    const contractAddress = getBulkTransferAddress(selectedChain.id);
    if (contractAddress) {
      return contractAddress;
    }
    // Fallback to the old configuration
    return transferContract[selectedChain.id];
  };
  // Wallet and transaction hooks
  const { address, isConnected, chainId } = useAccount();
  const config = useConfig();
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
    chainId: selectedChain?.id,
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
      const chainTokens = tokens[selectedChain.id] || [];
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
    const decimals = selectedChain.id === 39 && selectedToken.address === NATIVE_ADDRESS 
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
        const decimals = selectedChain.id === 39 && selectedToken.address === NATIVE_ADDRESS 
          ? 18 
          : selectedToken.decimals;
        return parseUnits(tokenAmount, decimals);
      })
    };
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
  }, [selectedToken?.address, selectedChain?.id, refetchAllowance, isConnected, address, selectedToken]);

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
    console.log('Sending final transaction...');

    try {
      // For native token transfers
      if (selectedToken.address === NATIVE_ADDRESS) {
        console.log('Sending native token transfer');
        const finalTxHash = await writeContractAsync({
          address: transferContractAddress as `0x${string}`,
          abi: transferAbi.abi,
          functionName: 'bulkTransfer',
          args: [
            NATIVE_TOKEN_ADDRESS, // Use 0x00 address for native token
            recipients,
            amounts
          ],
          value: totalAmount,
          gas: BigInt(400000),
          chainId: selectedChain.id
        });

        // Set the state and log immediately with the correct hash
        setTxHash(finalTxHash);
        await logPayrollTransaction(finalTxHash);
      } else {
        // For ERC20 token transfers
        console.log('Sending ERC20 token transfer');
        const finalTxHash = await writeContractAsync({
          address: transferContractAddress as `0x${string}`,
          abi: transferAbi.abi,
          functionName: 'bulkTransfer',
          args: [
            selectedToken.address as `0x${string}`,
            recipients,
            amounts
          ],
          gas: BigInt(400000),
          chainId: selectedChain.id
        });

        // Set the state and log immediately with the correct hash
        setTxHash(finalTxHash);
        await logPayrollTransaction(finalTxHash);
      }
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
    setShowPaymentStatus(true);

    if (selectedEmployees.length === 0) {
      setTxError('Please select at least one employee to pay');
      return;
    }

    try {
      const transferContractAddress = getTransferContract();

      if (!transferContractAddress) {
        setTxError('No transfer contract available for this network');
        return;
      }

      const { recipients, amounts } = getRecipientsAndAmounts();
      const totalAmount = amounts.reduce((sum, amount) => sum + amount, BigInt(0));

      // For ERC20 tokens that need approval
      if (selectedToken.address !== NATIVE_ADDRESS && needsApproval) {
        setIsApproving(true);

        try {
          const approvalHash = await writeContractAsync({
            address: selectedToken.address as `0x${string}`,
            abi: erc20Abi,
            functionName: 'approve',
            args: [transferContractAddress as `0x${string}`, totalAmount],
            chainId: selectedChain.id,
            gas: BigInt(400000)
          });

          setApprovalTxHash(approvalHash);

          const approvalReceipt = await waitForTransactionReceipt(config, {
            chainId: selectedChain.id,
            hash: approvalHash
          });

          if (approvalReceipt.status !== 'success') {
            throw new Error('Approval transaction failed');
          }

          setIsApproving(false);
          await sendTransactionAfterApproval(transferContractAddress, recipients, amounts, totalAmount);
        } catch (error: any) {
          setIsApproving(false);
          setTxError(error.message || 'Approval failed');
          return;
        }
      } else {
        await sendTransactionAfterApproval(transferContractAddress, recipients, amounts, totalAmount);
      }
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
      </div>
    </div>
  );
};

const PaymentPage = useFullPageLoader(
  PaymentsPage, <Loader />
);

export default PaymentPage;