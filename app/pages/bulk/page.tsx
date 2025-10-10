"use client";

import React, { useState, useEffect } from "react";
import PaymentsHeader from "@/components/payroll/PaymentHeader";
import ConfigurePayModal from "@/components/payroll/ConfigurePayModal";
import PaymentDashboard from "@/components/payroll/PaymentDashboard";
import AddRecipientModal from "@/components/payroll/AddEmployeeModal";
import BulkUploadModal from "@/components/payroll/BulkuploadModal";
import { Employee as Recipient, BulkRecipient, PayrollData } from "@/lib/interfaces";
import { toast } from "react-hot-toast";
import { parseUnits } from 'ethers';

import { allMainnetChains as chains, NATIVE_ADDRESS } from '@/lib/evm-chains-mainnet';
import { tokensPerMainnetChain as tokens } from '@/lib/evm-tokens-mainnet';
import transferAbi from '@/lib/Transfer.json';
import { erc20Abi } from 'viem';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useConfig, useChainId } from 'wagmi';
import { getBulkTransferAddress } from '@/lib/contract-addresses';
import { waitForTransactionReceipt } from "@wagmi/core";
import { useReadContract } from "wagmi";
import useFullPageLoader from "@/hooks/usePageLoader";
import Loader from "@/components/ui/loader";
import { Home } from "lucide-react";
import Link from "next/link";
import { ethers } from 'ethers';
import { set } from "react-hook-form";

const BulkPayoutPage: React.FC = () => {
  // Original state
  const [showConfigurePayModal, setShowConfigurePayModal] = useState(true);
  const [exchangeRate, setExchangeRate] = useState(1);
  const [selectedTokenSymbol, setSelectedTokenSymbol] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [recipients, setRecipients] = useState<BulkRecipient[]>([]);
  const [selectedRecipient, setSelectedRecipient] = useState<Recipient | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [walletToDelete, setWalletToDelete] = useState<string | null>(null);
  const [projectName, setProjectName] = useState<string>('');

  // Lifted state from PaymentDashboard
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [txError, setTxError] = useState('');
  const [needsApproval, setNeedsApproval] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [approvalTxHash, setApprovalTxHash] = useState<`0x${string}` | undefined>(undefined);
  const [showPaymentStatus, setShowPaymentStatus] = useState(false);
  const [selectedChain, setSelectedChain] = useState(chains[0]);
  const [selectedToken, setSelectedToken] = useState(tokens[chains[0].id][0]);
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>(undefined);

  // Wallet and transaction hooks
  const { address, isConnected, chainId } = useAccount();
  const currentChainId = useChainId();
  const config = useConfig();
  
  // Get transfer contract address for current network
  const getTransferContract = () => {
    return getBulkTransferAddress(currentChainId);
  };
  
  // Debug network information
  useEffect(() => {
    console.log('=== BULK TRANSFER NETWORK DEBUG ===');
    console.log('Chain ID:', currentChainId);
    console.log('BulkTransfer Contract Address:', getTransferContract());
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
    // Initialize with empty recipients for bulk disbursement
    setRecipients([]);
    setIsLoading(false);

    // Set project name
    setProjectName("Bulk Disbursement");
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

  // Calculate total amount needed for selected recipients
  const calculateTotalAmount = () => {
    return recipients
      .filter(recipient => selectedRecipients.includes(recipient.wallet))
      .reduce((sum, recipient) => sum + parseFloat(recipient.amount), 0);
  };

  // Get recipients and amounts for selected recipients
  const getRecipientsAndAmounts = () => {
    const selectedRecipientData = recipients.filter(recipient => selectedRecipients.includes(recipient.wallet));

    return {
      recipients: selectedRecipientData.map(recipient => recipient.wallet as `0x${string}`),
      amounts: selectedRecipientData.map(recipient => {
        const tokenAmount = usdToToken(recipient.amount);
        return parseUnits(tokenAmount, selectedToken.decimals);
      })
    };
  };

  // Get block explorer URL based on chain
  const getExplorerUrl = (txHash: `0x${string}` | undefined): string => {
    const explorer = selectedChain.blockExplorers?.default?.url;
    if (!explorer) return '#';
    return `${explorer}/tx/${txHash}`;
  };

  // Handle recipient selection
  const toggleRecipientSelection = (recipientId: string) => {
    setSelectedRecipients(prev =>
      prev.includes(recipientId)
        ? prev.filter(id => id !== recipientId)
        : [...prev, recipientId]
    );
  };



  useEffect(() => {
    if (
      selectedToken?.address !== NATIVE_ADDRESS &&
      allowance !== undefined &&
      selectedRecipients.length > 0
    ) {
      try {
        const totalAmount = calculateTotalAmount();
        const parsedAmount = parseUnits(usdToToken(totalAmount.toString()), selectedToken.decimals);
        setNeedsApproval(allowance < parsedAmount);
      } catch (e) {
        // Invalid amount format, ignore
      }
    } else {
      setNeedsApproval(false);
    }
  }, [allowance, selectedRecipients, selectedToken]);

  // Force refetch allowance when token changes
  useEffect(() => {
    if (isConnected && selectedToken && address && selectedToken?.address !== NATIVE_ADDRESS) {
      refetchAllowance();
    }
  }, [selectedToken?.address, selectedChain?.id, refetchAllowance, isConnected, address, selectedToken]);

  // Check if all recipients are selected
  const allRecipientsSelected = selectedRecipients.length === recipients.length;

  // Toggle all recipients selection
  const toggleAllRecipients = () => {
    if (allRecipientsSelected) {
      setSelectedRecipients([]);
    } else {
      setSelectedRecipients(recipients.map(recipient => recipient.wallet));
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
            NATIVE_ADDRESS, // Native token
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
          chainId: currentChainId
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

    if (selectedRecipients.length === 0) {
      setTxError('Please select at least one recipient to pay');
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
            chainId: currentChainId,
            gas: BigInt(400000)
          });

          setApprovalTxHash(approvalHash);

          const approvalReceipt = await waitForTransactionReceipt(config, {
            chainId: currentChainId,
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
  const handleAddRecipientClick = () => {
    setSelectedRecipient(null);
    setShowAddModal(true);
  };

  const handleBulkUploadClick = () => {
    setShowBulkUploadModal(true);
  };

  const confirmDeleteRecipient = async () => {
    if (!walletToDelete) return;

    try {
      setRecipients((prevRecipients) => prevRecipients.filter((recipient) => recipient.wallet !== walletToDelete));
      toast.success("Recipient deleted successfully");
    } catch (error: any) {
      console.error("Failed to delete recipient:", error);
      toast.error("Failed to delete recipient");
    } finally {
      setIsDeleteDialogOpen(false);
      setWalletToDelete(null);
    }
  };

  // Adapter functions to convert between Employee and BulkRecipient interfaces
  const convertBulkRecipientToEmployee = (recipient: BulkRecipient): Recipient => {
    return {
      name: recipient.name,
      wallet: recipient.wallet,
      email: "", // Not used in bulk disbursement
      salary: recipient.amount,
      designation: recipient.description || "",
      company: "Bulk Disbursement"
    };
  };

  const convertEmployeeToBulkRecipient = (employee: Recipient): BulkRecipient => {
    return {
      name: employee.name,
      wallet: employee.wallet,
      amount: employee.salary,
      description: employee.designation
    };
  };

  const handleEditRecipient = (recipient: BulkRecipient) => {
    setSelectedRecipient(convertBulkRecipientToEmployee(recipient));
    setShowAddModal(true);
  };

  const handleAddRecipient = async (employee: Recipient) => {
    try {
      const newRecipient = convertEmployeeToBulkRecipient(employee);
      setRecipients((prevRecipients) => [...prevRecipients, newRecipient]);
      setShowAddModal(false);
      toast.success("Recipient added successfully");
    } catch (error: any) {
      console.error("Failed to add recipient:", error);
      toast.error("Failed to add recipient");
    }
  };

  const handleBulkRecipientsUpload = async (uploadedRecipients: any[]) => {
    try {
      const newRecipients = uploadedRecipients.map(recipient => convertEmployeeToBulkRecipient(recipient));
      setRecipients((prevRecipients) => [...prevRecipients, ...newRecipients]);
      toast.success(`Successfully added ${uploadedRecipients.length} recipient(s)`);
    } catch (error: any) {
      console.error("Failed to add bulk recipients:", error);
      toast.error("Failed to add bulk recipients");
    }
  };

  const handleUpdateRecipient = async (wallet: string, updatedData: Partial<Recipient>) => {
    try {
      const updatedBulkData = convertEmployeeToBulkRecipient(updatedData as Recipient);
      setRecipients((prevRecipients) =>
        prevRecipients.map((recipient) =>
          recipient.wallet === wallet ? { ...recipient, ...updatedBulkData } : recipient
        )
      );
      setShowAddModal(false);
      setSelectedRecipient(null);
      toast.success("Recipient updated successfully");
    } catch (error: any) {
      console.error("Failed to update recipient:", error);
      toast.error("Failed to update recipient");
    }
  };

  // Handle exchange rate updates from the modal
  const handleExchangeRateUpdate = (rate: number, tokenSymbol: string) => {
    setExchangeRate(rate);
    setSelectedTokenSymbol(tokenSymbol);
  };

  const hasTransactionActivity = isLoadingDerived || isTxSuccess || isTxError || !!txError || !!approvalTxHash || !!txHash;

  return (
    <div className="w-full dark:text-white text-black">
      <div className="flex flex-col items-center px-2 sm:px-4 py-4 min-h-full">
        <PaymentsHeader
          onConfigurePayments={() => setShowConfigurePayModal(true)}
          onAddEmployee={handleAddRecipientClick}
          onBulkUpload={handleBulkUploadClick} />

        

        {/* Contract Availability Warning */}
        {!isContractAvailable && (
          <div className="w-full max-w-6xl mb-6">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex items-center">
                <div className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-3">⚠️</div>
                <div>
                  <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                    Bulk Transfer Contract Not Available
                  </h3>
                  <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                    The bulk transfer contract is not deployed on {networkName}. Please switch to U2U Mainnet or U2U Testnet to use this feature.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <PaymentDashboard
          exchangeRate={exchangeRate}
          selectedTokenSymbol={selectedTokenSymbol}
          employees={recipients.map(convertBulkRecipientToEmployee)}
          isConnected={isConnected}
          selectedEmployees={selectedRecipients}
          toggleEmployeeSelection={toggleRecipientSelection}
          toggleAllEmployees={toggleAllRecipients}
          allEmployeesSelected={allRecipientsSelected}
          handleTransaction={handleTransaction}
          usdToToken={usdToToken}
          isLoadingDerived={isLoadingDerived}
          needsApproval={needsApproval}
          isApproving={isApproving}
          isSending={isSending}
          isWritePending={isWritePending}
          isTxLoading={isTxLoading}
          isTxSuccess={isTxSuccess}
          isTxError={isTxError}
          txHash={txHash}
          txError={txError}
          approvalTxHash={approvalTxHash}
          showPaymentStatus={showPaymentStatus}
          hasTransactionActivity={hasTransactionActivity}
          getExplorerUrl={getExplorerUrl}
          selectedToken={selectedToken}
          handleAddEmployeeClick={handleAddRecipientClick}
          handleEditEmployee={(employee) => handleEditRecipient(convertEmployeeToBulkRecipient(employee))}
          deleteEmployeeById={(wallet: string) => {
            setWalletToDelete(wallet);
            setIsDeleteDialogOpen(true);
          }}
          selectedChain={selectedChain}
          handleAutoClose={() => {
            setShowPaymentStatus(false);
            setApprovalTxHash(undefined);
            setTxError('');
            setCustomTxHash(undefined);
            setTxHash(undefined);
            setSelectedRecipients([]);
          }}
        />

        <ConfigurePayModal
          isOpen={showConfigurePayModal}
          onClose={() => setShowConfigurePayModal(false)}
          onExchangeRateUpdate={handleExchangeRateUpdate}
        />

        <AddRecipientModal
          isOpen={showAddModal}
          onClose={() => {
            setShowAddModal(false);
            setSelectedRecipient(null);
          }}
          onAddEmployee={handleAddRecipient}
          onUpdateEmployee={handleUpdateRecipient}
          editEmployee={selectedRecipient}
          onUploadSuccess={() => {
            setShowBulkUploadModal(false);
          }}
        />

        <BulkUploadModal
          isOpen={showBulkUploadModal}
          onClose={() => setShowBulkUploadModal(false)}
          onUploadSuccess={() => {
            setShowBulkUploadModal(false);
          }}
          onRecipientsUploaded={handleBulkRecipientsUpload}
        />

        {/* Delete Confirmation Dialog */}
        {isDeleteDialogOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto dark:bg-black dark:text-white text-black backdrop-blur-sm flex items-center justify-center">
            <div className="dark:bg-[#1A1F2E] rounded-lg p-6 w-full max-w-md mx-4 shadow-xl border border-gray-700 animate-fade-in">
              <h3 className="text-xl font-medium dark:text-white mb-4">Confirm Deletion</h3>
              <p className="dark:text-gray-300 mb-6">
                Are you sure you want to delete this recipient? This action cannot be undone.
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
                  onClick={confirmDeleteRecipient}
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

const BulkPayoutPageWithLoader = useFullPageLoader(
  BulkPayoutPage, <Loader />
);

export default BulkPayoutPageWithLoader;