"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, User, Briefcase, Mail, DollarSign, Wallet, Upload } from "lucide-react";
import { Employee } from "@/lib/interfaces";
import { BackgroundBeams } from "@/components/ui/beams";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/authContext";

const LabelInputContainer = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className={cn("flex flex-col space-y-2 w-full", className)}>
      {children}
    </div>
  );
};

interface AddEmployeeModal2Props {
  isOpen: boolean;
  onClose: () => void;
  onAddEmployee: (employee: Employee) => void;
  onUpdateEmployee?: (wallet: string, updatedData: Partial<Employee>) => void;
  editEmployee?: Employee | null;
  onUploadSuccess?: () => void;
}

const AddEmployeeModal2: React.FC<AddEmployeeModal2Props> = ({
  isOpen,
  onClose,
  onAddEmployee,
  onUpdateEmployee,
  editEmployee,
  onUploadSuccess
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    designation: "",
    email: "",
    salary: "",
    wallet: "",
    company: user?.company || "Demo Company"
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Populate form when editing
  useEffect(() => {
    if (editEmployee) {
      setFormData({
        name: editEmployee.name || "",
        designation: editEmployee.designation || "",
        email: editEmployee.email || "",
        salary: editEmployee.salary || "",
        wallet: editEmployee.wallet || "",
        company: editEmployee.company || user?.company || "Demo Company"
      });
    } else {
      // Reset form for new employee
      setFormData({
        name: "",
        designation: "",
        email: "",
        salary: "",
        wallet: "",
        company: user?.company || "Demo Company"
      });
    }
    setErrors({});
  }, [editEmployee, user?.company, isOpen]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.designation.trim()) {
      newErrors.designation = "Designation is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.salary.trim()) {
      newErrors.salary = "Salary is required";
    } else if (isNaN(parseFloat(formData.salary)) || parseFloat(formData.salary) <= 0) {
      newErrors.salary = "Please enter a valid salary amount";
    }

    if (!formData.wallet.trim()) {
      newErrors.wallet = "Wallet address is required";
    } else if (!/^0x[a-fA-F0-9]{40}$/.test(formData.wallet)) {
      newErrors.wallet = "Please enter a valid Ethereum wallet address";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const employeeData: Employee = {
        name: formData.name.trim(),
        designation: formData.designation.trim(),
        email: formData.email.trim(),
        salary: formData.salary.trim(),
        wallet: formData.wallet.trim(),
        company: formData.company.trim()
      };

      if (editEmployee && onUpdateEmployee) {
        onUpdateEmployee(editEmployee.wallet, employeeData);
      } else {
        onAddEmployee(employeeData);
      }

      // Reset form and close modal
      setFormData({
        name: "",
        designation: "",
        email: "",
        salary: "",
        wallet: "",
        company: user?.company || "Demo Company"
      });
      setErrors({});
      onClose();
    } catch (error) {
      console.error("Error submitting employee:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const triggerBulkUpload = () => {
    onUploadSuccess?.();
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
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-200">
                  {editEmployee ? "Edit Employee" : "Add New Employee"}
                </h2>
                <button onClick={onClose} aria-label="Close">
                  <X className="text-neutral-500 hover:text-red-500" />
                </button>
              </div>

              <form className="my-8" onSubmit={handleSubmit}>
                {/* Name Field */}
                <div className="mb-4">
                  <LabelInputContainer>
                    <Label htmlFor="name">Employee Name</Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={handleInputChange}
                      className={cn(errors.name && "border-red-500 focus:ring-red-500")}
                    />
                    {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
                  </LabelInputContainer>
                </div>

                {/* Designation Field */}
                <div className="mb-4">
                  <LabelInputContainer>
                    <Label htmlFor="designation">Designation</Label>
                    <Input
                      id="designation"
                      name="designation"
                      placeholder="Software Engineer"
                      value={formData.designation}
                      onChange={handleInputChange}
                      className={cn(errors.designation && "border-red-500 focus:ring-red-500")}
                    />
                    {errors.designation && <p className="text-sm text-red-600 mt-1">{errors.designation}</p>}
                  </LabelInputContainer>
                </div>

                {/* Email Field */}
                <div className="mb-4">
                  <LabelInputContainer>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="employee@company.com"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={cn(errors.email && "border-red-500 focus:ring-red-500")}
                    />
                    {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email}</p>}
                  </LabelInputContainer>
                </div>

                {/* Salary Field */}
                <div className="mb-4">
                  <LabelInputContainer>
                    <Label htmlFor="salary">Monthly Salary (USD)</Label>
                    <Input
                      id="salary"
                      name="salary"
                      placeholder="5000.00"
                      value={formData.salary}
                      onChange={handleInputChange}
                      className={cn(errors.salary && "border-red-500 focus:ring-red-500")}
                    />
                    {errors.salary && <p className="text-sm text-red-600 mt-1">{errors.salary}</p>}
                  </LabelInputContainer>
                </div>

                {/* Wallet Address Field */}
                <div className="mb-4">
                  <LabelInputContainer>
                    <Label htmlFor="wallet">Wallet Address</Label>
                    <Input
                      id="wallet"
                      name="wallet"
                      placeholder="0x..."
                      value={formData.wallet}
                      onChange={handleInputChange}
                      className={cn(errors.wallet && "border-red-500 focus:ring-red-500")}
                    />
                    {errors.wallet && <p className="text-sm text-red-600 mt-1">{errors.wallet}</p>}
                  </LabelInputContainer>
                </div>

                <div className="flex flex-col space-y-4">
                  <div className="flex md:flex-row flex-col md:space-x-4 space-y-3">
                    <button
                      type="button"
                      onClick={triggerBulkUpload}
                      className="group/btn relative block h-10 w-full rounded-md bg-gradient-to-br from-neutral-900 dark:from-zinc-900 dark:to-zinc-900 to-neutral-600 font-medium text-white shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] dark:shadow-[0px_1px_0px_0px_#27272a_inset,0px_-1px_0px_0px_#27272a_inset]"
                    >
                      <span className="relative flex items-center justify-center gap-2">
                        <Upload className="h-4 w-4" />
                        Bulk Upload
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      className="group/btn relative block h-10 w-full rounded-md bg-gradient-to-br from-black to-neutral-600 font-medium text-white shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] dark:bg-zinc-800 dark:from-zinc-900 dark:to-zinc-900 dark:shadow-[0px_1px_0px_0px_#27272a_inset,0px_-1px_0px_0px_#27272a_inset]"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="group/btn relative block h-10 w-full rounded-md bg-gradient-to-br from-black dark:from-zinc-900 dark:to-zinc-900 to-neutral-600 font-medium text-white shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] dark:shadow-[0px_1px_0px_0px_#27272a_inset,0px_-1px_0px_0px_#27272a_inset]"
                    >
                      {isSubmitting ? "Saving..." : editEmployee ? "Update Employee" : "Add Employee"}
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AddEmployeeModal2;
