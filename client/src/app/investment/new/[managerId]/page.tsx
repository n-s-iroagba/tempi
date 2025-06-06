'use client'
import { useParams } from "next/navigation";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useGetList, useGetSingle } from "@/hooks/useFetch";
import { Manager } from "@/types/manager";
import { apiRoutes } from "@/constants/apiRoutes";
import { AdminWallet } from "@/types/adminWallet";
import { post } from "@/utils/apiClient";
import InvestorOffCanvas from '@/components/InvestorOffCanvas'
import WAValidator from "multicoin-address-validator";
import { CurrencyDollarIcon, WalletIcon, BanknotesIcon, ArrowPathIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { useAuth } from "@/hooks/useAuth";
type InvestmentCreationDto = {
  amount: number;
  depositMeans: string;
  managerId: string | number;
  wallet: null | {
    adminWalletId: number;
    address: string;
    currency: string;
  };
};
const NewInvestmentForm: React.FC = () => {
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [walletVerified, setWalletVerified] = useState(true);
  const [amount, setAmount] = useState(0);
  const [depositMeans, setDepositMeans] = useState("");
  const [address, setAddress] = useState("");
  const [selectedWallet, setSelectedWallet] = useState<{
    id: number;
    currency: string;
  } | null>(null);

  const params = useParams();
console.log(params)
  const router = useRouter();
  const {roleId} = useAuth()
  const rawManagerId = params.managerId;


  const managerId = Array.isArray(rawManagerId)
    ? rawManagerId[0]
    : rawManagerId;

  const {
    data: manager,
    loading: managerLoading,
    error: managerError,
  } = useGetSingle<Manager>(apiRoutes.manager.get(managerId ?? 0));
  console.log(manager)
  const {
    data: wallets,
    loading: walletsLoading,
    error: walletsError,
  } = useGetList<AdminWallet>(apiRoutes.adminWallet.list());

  if (managerLoading || walletsLoading) 
      return (
        <InvestorOffCanvas>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading...</p>
            </div>
          </div>
        </InvestorOffCanvas>
      );
    
  if (managerError || walletsError)  return (
      
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <p className="text-red-600">Error loading new investment details</p>
        </div>
      </div>
    )
  if (!manager) return  
      
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <p className="text-red-600">Error loading chosen manager</p>
        </div>
      </div>
  

  if (!managerId) return <div>No managerId</div>;
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    setAmount(value);
    if (value < manager.minimumInvestmentAmount) {
      setMessage(
        `Minimum amount must be at least ${manager.minimumInvestmentAmount} USD`
      );
    } else {
      setMessage("");
    }
  };

  const verifyAddress = process.env.NODE_ENV=='production'? (addr: string) => WAValidator.validate(addr) :()=>true

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAddress(value);
    const valid = true
    verifyAddress(value);
    setWalletVerified(valid);
  };

  const submitInvestment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (depositMeans === "CRYPTO" && !walletVerified) {
      setMessage("Invalid wallet address");
      return;
    }
   

    const payload: InvestmentCreationDto = {
      amount,
      managerId,
      depositMeans,
      wallet: depositMeans === "CRYPTO" && selectedWallet ? {adminWalletId:selectedWallet.id, currency:selectedWallet.currency, address } : null,
    };

    setSubmitting(true);

    try {
       await post<
        InvestmentCreationDto,
        { investmentId: number | string }
      >(apiRoutes.investment.new(roleId), payload);
      router.push(`/investor/payments/${roleId}`);
    } catch (err) {
      console.error(err);
      setMessage("Failed to submit investment.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <InvestorOffCanvas>
    <div className="bg-white p-6 rounded-2xl shadow-sm border-2 border-blue-50 relative max-w-2xl mx-auto">
      {/* Decorative Corner Borders */}
      <div className="absolute top-2 right-2 w-8 h-8 border-t-2 border-r-2 border-blue-800 opacity-20" />
      <div className="absolute bottom-2 left-2 w-8 h-8 border-b-2 border-l-2 border-blue-800 opacity-20" />

      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-blue-900 flex items-center justify-center gap-2">
          <CurrencyDollarIcon className="w-8 h-8 text-blue-700" />
          Create Managed Portfolio
        </h2>
        <p className="text-blue-600 mt-2">Start your investment journey with {manager?.firstName}</p>
      </div>

      {message && (
        <div className="p-3 bg-red-50 text-red-700 rounded-xl border-2 border-red-100 mb-6">
          {message}
        </div>
      )}

      <form className="space-y-6" onSubmit={submitInvestment} noValidate>
        {/* Manager Input */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-blue-700 flex items-center gap-1">
            <UserCircleIcon className="w-4 h-4" />
            Investment Manager
          </label>
          <input
            value={`${manager?.firstName} ${manager?.lastName}`}
            readOnly
            className="w-full p-3 rounded-xl border-2 border-blue-100 bg-blue-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          />
        </div>

        {/* Amount Input */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-blue-700 flex items-center gap-1">
            <BanknotesIcon className="w-4 h-4" />
            Investment Amount (USD)
          </label>
          <input
            type="number"
            value={amount}
            onChange={handleAmountChange}
            className={`w-full p-3 rounded-xl border-2 ${
              message.includes('Minimum') ? 'border-red-300' : 'border-blue-100'
            } focus:border-blue-500 focus:ring-2 focus:ring-blue-200`}
          />
          <p className="text-sm text-blue-600 mt-1">
            Minimum: ${manager.minimumInvestmentAmount?manager.minimumInvestmentAmount:'Any Amount'}
          </p>
        </div>

        {/* Deposit Means */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-blue-700 flex items-center gap-1">
            <WalletIcon className="w-4 h-4" />
            Deposit Method
          </label>
          <select
            value={depositMeans}
            onChange={(e) => setDepositMeans(e.target.value)}
            className="w-full p-3 rounded-xl border-2 border-blue-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          >
            <option value="">Select deposit method</option>
            <option value="CRYPTO">Crypto Currency</option>
            <option value="FIAT">Bank Transfer</option>
          </select>
        </div>

 {/* Crypto Fields */}
{depositMeans === "CRYPTO" && (
  <div className="space-y-4">
    <div className="space-y-1">
      <label className="block text-sm font-medium text-blue-700">
        Select Currency
      </label>
      <select
        value={selectedWallet?.id || ""}
        onChange={(e) => {
          const wallet = wallets.find((w) => w.id === Number(e.target.value));
          if (wallet) {
            setSelectedWallet({ id: wallet.id, currency: wallet.currency });
          }
        }}
        className="w-full p-3 rounded-xl border-2 border-blue-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
      >
        <option value="">Select currency</option>
        {wallets.map((wallet) => (
          <option key={wallet.id} value={wallet.id}>
            {wallet.currency}
          </option>
        ))}
      </select>
    </div>

    <div className="space-y-1">
      <label className="block text-sm font-medium text-blue-700">
        Wallet Address
      </label>
      <input
        value={address}
        onChange={handleAddressChange}
        className={`w-full p-3 rounded-xl border-2 ${
          !walletVerified ? 'border-red-300' : 'border-blue-100'
        } focus:border-blue-500 focus:ring-2 focus:ring-blue-200`}
      />
      {!walletVerified && (
        <p className="text-red-600 text-sm mt-1">Invalid wallet address</p>
      )}
    </div>
  </div>
)}


        {/* Action Buttons */}
        <div className="flex gap-4 mt-8">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 py-3 bg-blue-700 text-white rounded-xl hover:bg-blue-800 disabled:bg-blue-400 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <ArrowPathIcon className="w-5 h-5 animate-spin" />
                Processing...
              </>
            ) : (
              'Create Portfolio'
            )}
          </button>
          <button
            type="button"
            onClick={() => router.push("/investor/dashboard")}
            className="flex-1 py-3 border-2 border-blue-200 text-blue-800 rounded-xl hover:bg-blue-50 transition-all"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
    </InvestorOffCanvas>
  );
};

export default NewInvestmentForm;
