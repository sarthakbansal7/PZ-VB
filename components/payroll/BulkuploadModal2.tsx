"use client";

import React, { useState, DragEvent, ChangeEvent, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, FileSpreadsheet, AlertCircle, Check, XCircle, Loader, Download } from "lucide-react";
import { BackgroundBeams } from "@/components/ui/beams";

interface BulkUploadModal2Props {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: () => void;
  onEmployeesUploaded?: (employees: any[]) => void; // For payroll employees
}

const BulkUploadModal2: React.FC<BulkUploadModal2Props> = ({ isOpen, onClose, onUploadSuccess, onEmployeesUploaded }) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{
    success: boolean;
    message: string;
    details?: string[];
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file: File) => {
    // Reset previous upload status
    setUploadStatus(null);

    if (!file.name.toLowerCase().endsWith('.csv')) {
      setUploadStatus({
        success: false,
        message: "Invalid file type",
        details: ["Please upload a CSV file"]
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      setUploadStatus({
        success: false,
        message: "File too large",
        details: ["File size must be less than 5MB"]
      });
      return;
    }

    setSelectedFile(file);
  };

  const removeFile = () => {
    setSelectedFile(null);
    setUploadStatus(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const downloadTemplate = () => {
    const headers = ['Name', 'Designation', 'Email', 'Salary (USD)', 'Wallet Address'];
    const sampleData = [
      ['John Doe', 'Software Engineer', 'john@company.com', '5000', '0x1234567890123456789012345678901234567890'],
      ['Jane Smith', 'Product Manager', 'jane@company.com', '6000', '0x2345678901234567890123456789012345678901'],
      ['Bob Johnson', 'Designer', 'bob@company.com', '4500', '0x3456789012345678901234567890123456789012']
    ];
    
    const csvContent = [headers.join(','), ...sampleData.map(row => row.join(','))].join('\\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', 'employee_payroll_template.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadStatus({
        success: false,
        message: "No file selected",
        details: ["Please select a file to upload"]
      });
      return;
    }

    try {
      setIsUploading(true);
      setUploadStatus(null);

      // Read and parse the CSV file
      const text = await selectedFile.text();
      const lines = text.split('\\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        throw new Error("CSV file must contain at least a header and one data row");
      }

      // Parse header
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      // Validate expected headers for payroll
      const requiredHeaders = ['name', 'designation', 'email', 'salary', 'wallet'];
      const missingHeaders = requiredHeaders.filter(header => 
        !headers.some(h => h.includes(header))
      );
      
      if (missingHeaders.length > 0) {
        throw new Error(`Missing required columns: ${missingHeaders.join(', ')}`);
      }

      // Parse data rows
      const employees: any[] = [];
      const errors: string[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        
        if (values.length !== headers.length) {
          errors.push(`Row ${i + 1}: Column count mismatch`);
          continue;
        }

        const nameIndex = headers.findIndex(h => h.includes('name'));
        const designationIndex = headers.findIndex(h => h.includes('designation'));
        const emailIndex = headers.findIndex(h => h.includes('email'));
        const salaryIndex = headers.findIndex(h => h.includes('salary'));
        const walletIndex = headers.findIndex(h => h.includes('wallet'));

        const name = values[nameIndex]?.replace(/['"]/g, '');
        const designation = values[designationIndex]?.replace(/['"]/g, '');
        const email = values[emailIndex]?.replace(/['"]/g, '');
        const salary = values[salaryIndex]?.replace(/['"]/g, '');
        const wallet = values[walletIndex]?.replace(/['"]/g, '');

        if (!name || !designation || !email || !salary || !wallet) {
          errors.push(`Row ${i + 1}: Missing required data`);
          continue;
        }

        // Validate wallet address format
        if (!wallet.match(/^0x[a-fA-F0-9]{40}$/)) {
          errors.push(`Row ${i + 1}: Invalid wallet address format`);
          continue;
        }

        // Validate email format
        if (!email.match(/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/)) {
          errors.push(`Row ${i + 1}: Invalid email format`);
          continue;
        }

        // Validate salary is a number
        if (isNaN(parseFloat(salary))) {
          errors.push(`Row ${i + 1}: Invalid salary format`);
          continue;
        }

        employees.push({
          name,
          designation,
          email,
          salary,
          wallet,
          company: "Demo Company" // Default company
        });
      }

      if (employees.length === 0) {
        throw new Error("No valid employees found in CSV file");
      }

      // Show success message
      const successDetails = [
        `Successfully parsed ${employees.length} employee(s)`,
        ...(errors.length > 0 ? [`${errors.length} row(s) had errors and were skipped`] : [])
      ];

      setUploadStatus({
        success: true,
        message: "Upload successful",
        details: successDetails
      });

      // Add employees to the table if callback is provided
      if (onEmployeesUploaded) {
        onEmployeesUploaded(employees);
      }

      // Call the success callback after a delay for better UX
      setTimeout(() => {
        onUploadSuccess();
        setTimeout(() => onClose(), 1500);
      }, 1500);
    } catch (error: any) {
      console.error("Upload error:", error);

      setUploadStatus({
        success: false,
        message: "Upload failed",
        details: [error.message || "An unexpected error occurred"]
      });
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed top-0 left-0 w-screen h-screen bg-black/50 z-50"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", damping: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="flex relative w-full h-full items-center justify-center bg-white/90 dark:bg-black/90 md:p-4"
          >
            <BackgroundBeams />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", damping: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="shadow-input relative w-full md:max-w-4xl rounded-none bg-white md:rounded-xl p-4 md:p-8 dark:bg-black"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-200">
                  Bulk Upload Employees
                </h2>
                <button onClick={onClose} aria-label="Close">
                  <X className="text-neutral-500 hover:text-red-500" />
                </button>
              </div>

                {/* Upload Area */}
                <div className="mb-6">
                  <div
                    className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 cursor-pointer ${
                      dragActive
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : selectedFile
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv"
                      onChange={handleChange}
                      className="hidden"
                      title="Upload employee data file"
                    />
                  
                  {selectedFile ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-center">
                        <FileSpreadsheet className="h-12 w-12 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="text-lg font-medium text-gray-900 dark:text-white">
                          {selectedFile.name}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {(selectedFile.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      <button
                        onClick={removeFile}
                        className="inline-flex items-center px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-md hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-center">
                        <Upload className="h-12 w-12 text-gray-400" />
                      </div>
                      <div>
                        <p className="text-lg font-medium text-gray-900 dark:text-white">
                          Drop your CSV file here
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          or click to browse files
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Instructions */}
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-2">
                    CSV Format Requirements:
                  </h4>
                  <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
                    <li>• Required columns: Name, Designation, Email, Salary (USD), Wallet Address</li>
                    <li>• First row must contain column headers</li>
                    <li>• Wallet addresses must be valid Ethereum addresses</li>
                    <li>• Email addresses must be valid format</li>
                    <li>• Salary must be numeric values</li>
                    <li>• Maximum 100 employees per upload</li>
                    <li>• File size limit: 5MB</li>
                  </ul>
                  <button
                    onClick={downloadTemplate}
                    className="mt-3 inline-flex items-center px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-md hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors text-sm"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download Template
                  </button>
                </div>

                {/* Upload Status */}
                {uploadStatus && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`rounded-lg p-4 ${
                      uploadStatus.success
                        ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                        : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      {uploadStatus.success ? (
                        <Check className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <p className={`font-medium ${
                          uploadStatus.success
                            ? 'text-green-800 dark:text-green-300'
                            : 'text-red-800 dark:text-red-300'
                        }`}>
                          {uploadStatus.message}
                        </p>
                        {uploadStatus.details && uploadStatus.details.length > 0 && (
                          <ul className={`mt-1 text-sm ${
                            uploadStatus.success
                              ? 'text-green-700 dark:text-green-400'
                              : 'text-red-700 dark:text-red-400'
                          }`}>
                            {uploadStatus.details.map((detail, index) => (
                              <li key={index}>• {detail}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpload}
                    disabled={!selectedFile || isUploading}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center space-x-2"
                  >
                    {isUploading && <Loader className="h-4 w-4 animate-spin" />}
                    <span>{isUploading ? 'Uploading...' : 'Upload'}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BulkUploadModal2;