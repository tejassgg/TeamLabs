import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { FaCreditCard, FaUniversity, FaLock, FaCheck, FaTimes, FaEye, FaEyeSlash, FaSave, FaArrowLeft, FaChevronDown, FaInfinity, FaRocket, FaStar, FaUsers, FaCheckCircle } from 'react-icons/fa';
import api from '../services/api';

// US Banks data with logos
const US_BANKS = [
  {
    name: 'Chase Bank',
    logo: '🏦',
    code: 'chase',
    routingPrefix: '021'
  },
  {
    name: 'Bank of America',
    logo: '🏛️',
    code: 'boa',
    routingPrefix: '026'
  },
  {
    name: 'Wells Fargo',
    logo: '🏢',
    code: 'wells',
    routingPrefix: '121'
  },
  {
    name: 'Citibank',
    logo: '🏦',
    code: 'citi',
    routingPrefix: '021'
  },
  {
    name: 'US Bank',
    logo: '🏛️',
    code: 'usbank',
    routingPrefix: '123'
  },
  {
    name: 'PNC Bank',
    logo: '🏦',
    code: 'pnc',
    routingPrefix: '043'
  },
  {
    name: 'Capital One',
    logo: '🏛️',
    code: 'capitalone',
    routingPrefix: '065'
  },
  {
    name: 'TD Bank',
    logo: '🏦',
    code: 'tdbank',
    routingPrefix: '031'
  },
  {
    name: 'BB&T Bank',
    logo: '🏛️',
    code: 'bbt',
    routingPrefix: '053'
  },
  {
    name: 'SunTrust Bank',
    logo: '🏦',
    code: 'suntrust',
    routingPrefix: '061'
  },
  {
    name: 'Regions Bank',
    logo: '🏛️',
    code: 'regions',
    routingPrefix: '062'
  },
  {
    name: 'Fifth Third Bank',
    logo: '🏦',
    code: 'fifththird',
    routingPrefix: '042'
  },
  {
    name: 'KeyBank',
    logo: '🏛️',
    code: 'keybank',
    routingPrefix: '041'
  },
  {
    name: 'HSBC Bank',
    logo: '🏦',
    code: 'hsbc',
    routingPrefix: '021'
  },
  {
    name: 'American Express Bank',
    logo: '🏛️',
    code: 'amex',
    routingPrefix: '021'
  },
  {
    name: 'Goldman Sachs Bank',
    logo: '🏦',
    code: 'goldman',
    routingPrefix: '021'
  },
  {
    name: 'Morgan Stanley Bank',
    logo: '🏛️',
    code: 'morganstanley',
    routingPrefix: '021'
  },
  {
    name: 'Charles Schwab Bank',
    logo: '🏦',
    code: 'schwab',
    routingPrefix: '021'
  },
  {
    name: 'Ally Bank',
    logo: '🏛️',
    code: 'ally',
    routingPrefix: '021'
  },
  {
    name: 'Discover Bank',
    logo: '🏦',
    code: 'discover',
    routingPrefix: '021'
  },
  {
    name: 'Other Bank',
    logo: '🏦',
    code: 'other',
    routingPrefix: '000'
  }
];

const Payment = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { showToast } = useToast();
  const router = useRouter();
  const { plan, amount } = router.query;

  const [paymentMethod, setPaymentMethod] = useState('card');
  const [loading, setLoading] = useState(false);
  const [showCardDetails, setShowCardDetails] = useState(false);
  const [saveCard, setSaveCard] = useState(false);
  const [showBankDropdown, setShowBankDropdown] = useState(false);
  const [selectedBank, setSelectedBank] = useState(null);
  const [subscriptionFeatures, setSubscriptionFeatures] = useState([]);

  // Card payment form
  const [cardForm, setCardForm] = useState({
    cardNumber: '',
    cardHolderName: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    billingAddress: '',
    city: '',
    state: '',
    zipCode: '',
    country: ''
  });

  // Online banking form
  const [bankForm, setBankForm] = useState({
    bankName: '',
    accountNumber: '',
    routingNumber: '',
    accountHolderName: ''
  });

  const [errors, setErrors] = useState({});

  // Get plan details
  const getPlanDetails = () => {
    switch (plan) {
      case 'monthly':
        return {
          name: 'Premium Monthly',
          price: 99,
          period: 'month',
          description: 'Unlimited projects, tasks, and premium features'
        };
      case 'annual':
        return {
          name: 'Premium Annual',
          price: 708,
          period: 'year',
          description: 'Unlimited projects, tasks, and premium features with 40% discount'
        };
      default:
        return {
          name: 'Premium Monthly',
          price: 99,
          period: 'month',
          description: 'Unlimited projects, tasks, and premium features'
        };
    }
  };

  const planDetails = getPlanDetails();

  // Fetch subscription features
  const fetchSubscriptionFeatures = async () => {
    try {
      const planType = plan === 'annual' ? 'annual' : 'monthly';
      const response = await api.get(`/common-types/subscription-features/${planType}`);
      setSubscriptionFeatures(response.data || []);
    } catch (error) {
      console.error('Error fetching subscription features:', error);
    }
  };

  // Helper function to get icon for feature
  const getFeatureIcon = (feature) => {
    const featureText = feature.Value.toLowerCase();
    if (featureText.includes('unlimited')) {
      return <FaInfinity className="text-white text-xs" />;
    } else if (featureText.includes('analytics')) {
      return <FaRocket className="text-white text-xs" />;
    } else if (featureText.includes('support')) {
      return <FaStar className="text-white text-xs" />;
    } else if (featureText.includes('members')) {
      return <FaUsers className="text-white text-xs" />;
    } else if (featureText.includes('discount')) {
      return <FaCheckCircle className="text-white text-xs" />;
    } else {
      return <FaCheck className="text-white text-xs" />;
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (paymentMethod === 'card') {
      if (!cardForm.cardNumber) newErrors.cardNumber = 'Card number is required';
      if (!cardForm.cardHolderName) newErrors.cardHolderName = 'Card holder name is required';
      if (!cardForm.expiryMonth) newErrors.expiryMonth = 'Expiry month is required';
      if (!cardForm.expiryYear) newErrors.expiryYear = 'Expiry year is required';
      if (!cardForm.cvv) newErrors.cvv = 'CVV is required';
      if (!cardForm.billingAddress) newErrors.billingAddress = 'Billing address is required';
      if (!cardForm.city) newErrors.city = 'City is required';
      if (!cardForm.state) newErrors.state = 'State is required';
      if (!cardForm.zipCode) newErrors.zipCode = 'ZIP code is required';
      if (!cardForm.country) newErrors.country = 'Country is required';
    } else {
      if (!selectedBank) newErrors.bankName = 'Please select a bank';
      if (!bankForm.accountNumber) newErrors.accountNumber = 'Account number is required';
      if (!bankForm.routingNumber) newErrors.routingNumber = 'Routing number is required';
      if (!bankForm.accountHolderName) newErrors.accountHolderName = 'Account holder name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    setLoading(true);

    try {
      const paymentData = {
        plan: plan,
        amount: planDetails.price,
        paymentMethod: paymentMethod,
        organizationID: user.organizationID,
        userId: user._id,
        saveCard: saveCard,
        ...(paymentMethod === 'card' ? cardForm : bankForm)
      };

      const response = await api.post('/payment/process', paymentData);
      
      if (response.data.success) {
        showToast('Payment successful! Your subscription has been activated.', 'success');
        router.push('/settings?tab=subscription');
      } else {
        showToast(response.data.message || 'Payment failed. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Payment error:', error);
      showToast(error.response?.data?.message || 'Payment failed. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Format card number
  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const handleCardNumberChange = (e) => {
    const formatted = formatCardNumber(e.target.value);
    setCardForm(prev => ({ ...prev, cardNumber: formatted }));
  };

  // Generate year options
  const currentYear = new Date().getFullYear();
  const yearOptions = [];
  for (let i = 0; i < 10; i++) {
    yearOptions.push(currentYear + i);
  }

  // Fetch subscription features on component mount and plan change
  useEffect(() => {
    if (plan) {
      fetchSubscriptionFeatures();
    }
  }, [plan]);

  // Handle bank selection
  const handleBankSelect = (bank) => {
    setSelectedBank(bank);
    setBankForm(prev => ({ ...prev, bankName: bank.name }));
    setShowBankDropdown(false);
  };

  // Filter banks based on search
  const filteredBanks = US_BANKS.filter(bank => 
    bank.name.toLowerCase().includes(bankForm.bankName.toLowerCase())
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showBankDropdown && !event.target.closest('.bank-dropdown')) {
        setShowBankDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showBankDropdown]);

  return (
    <>
      <Head>
        <title>Payment | TeamLabs</title>
      </Head>
      
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className={`flex items-center gap-2 mb-4 text-sm transition-colors duration-200 ${theme === 'dark' ? 'text-gray-400 hover:text-blue-400' : 'text-gray-600 hover:text-blue-600'}`}
          >
            <FaArrowLeft />
            Back to Subscription
          </button>
          
          <div className="text-center">
            <p className={`text-lg ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Secure payment for <span className="font-semibold text-blue-600">{planDetails.name}</span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Payment Form */}
          <div className="lg:col-span-2">
            <div className={`rounded-2xl shadow-xl border-2 transition-all duration-300 hover:shadow-2xl ${
              theme === 'dark' 
                ? 'bg-gradient-to-br from-gray-800/50 via-gray-900/50 to-gray-800/50 border-gray-600 hover:border-blue-500/50' 
                : 'bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 border-blue-200 hover:border-blue-300'
            }`}>
              <div className={`p-6 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-blue-100'}`}>
                <h2 className={`text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-3`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-r from-blue-600 to-purple-600`}>
                    <FaCreditCard className="text-white text-lg" />
                  </div>
                  Payment Method
                </h2>
              </div>

              <div className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Payment Method Selection */}
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('card')}
                      className={`p-4 rounded-xl border-2 transition-all duration-300 flex items-center gap-3 ${
                        paymentMethod === 'card'
                          ? theme === 'dark'
                            ? 'border-blue-500 bg-gradient-to-r from-blue-600/20 to-purple-600/20 shadow-lg shadow-blue-500/25'
                            : 'border-blue-500 bg-gradient-to-r from-blue-50 to-purple-50 shadow-lg shadow-blue-500/25'
                          : theme === 'dark'
                            ? 'border-gray-600 bg-gray-800/50 hover:border-gray-500 hover:bg-gray-700/50'
                            : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        paymentMethod === 'card'
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600'
                          : theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
                      }`}>
                        <FaCreditCard className={`text-lg ${paymentMethod === 'card' ? 'text-white' : theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`} />
                      </div>
                      <div className="text-left">
                        <div className={`font-semibold ${paymentMethod === 'card' ? 'text-blue-600' : theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          Credit Card
                        </div>
                        <div className={`text-sm ${paymentMethod === 'card' ? 'text-blue-500' : theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                          Visa, Mastercard, Amex
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('bank')}
                      className={`p-4 rounded-xl border-2 transition-all duration-300 flex items-center gap-3 ${
                        paymentMethod === 'bank'
                          ? theme === 'dark'
                            ? 'border-green-500 bg-gradient-to-r from-green-600/20 to-emerald-600/20 shadow-lg shadow-green-500/25'
                            : 'border-green-500 bg-gradient-to-r from-green-50 to-emerald-50 shadow-lg shadow-green-500/25'
                          : theme === 'dark'
                            ? 'border-gray-600 bg-gray-800/50 hover:border-gray-500 hover:bg-gray-700/50'
                            : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        paymentMethod === 'bank'
                          ? 'bg-gradient-to-r from-green-600 to-emerald-600'
                          : theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
                      }`}>
                        <FaUniversity className={`text-lg ${paymentMethod === 'bank' ? 'text-white' : theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`} />
                      </div>
                      <div className="text-left">
                        <div className={`font-semibold ${paymentMethod === 'bank' ? 'text-green-600' : theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          Online Banking
                        </div>
                        <div className={`text-sm ${paymentMethod === 'bank' ? 'text-green-500' : theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                          Direct bank transfer
                        </div>
                      </div>
                    </button>
                  </div>

                  {/* Payment Form */}
                  {paymentMethod === 'card' ? (
                    <>
                      {/* Card Number */}
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-700'}`}>
                          Card Number
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={cardForm.cardNumber}
                            onChange={handleCardNumberChange}
                            maxLength="19"
                            className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 ${
                              errors.cardNumber
                                ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                                : theme === 'dark'
                                  ? 'border-gray-700 bg-[#1F1F1F] text-white focus:ring-blue-500 focus:border-blue-500'
                                  : 'border-gray-300 bg-white text-gray-900 focus:ring-blue-500 focus:border-blue-500'
                            }`}
                            placeholder="1234 5678 9012 3456"
                          />
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <FaLock className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                          </div>
                        </div>
                        {errors.cardNumber && (
                          <p className="mt-1 text-sm text-red-500">{errors.cardNumber}</p>
                        )}
                      </div>

                      {/* Card Holder Name */}
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-700'}`}>
                          Card Holder Name
                        </label>
                        <input
                          type="text"
                          value={cardForm.cardHolderName}
                          onChange={(e) => setCardForm(prev => ({ ...prev, cardHolderName: e.target.value }))}
                          className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 ${
                            errors.cardHolderName
                              ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                              : theme === 'dark'
                                ? 'border-gray-700 bg-[#1F1F1F] text-white focus:ring-blue-500 focus:border-blue-500'
                                : 'border-gray-300 bg-white text-gray-900 focus:ring-blue-500 focus:border-blue-500'
                          }`}
                          placeholder="John Doe"
                        />
                        {errors.cardHolderName && (
                          <p className="mt-1 text-sm text-red-500">{errors.cardHolderName}</p>
                        )}
                      </div>

                      {/* Expiry and CVV */}
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-700'}`}>
                            Month
                          </label>
                          <select
                            value={cardForm.expiryMonth}
                            onChange={(e) => setCardForm(prev => ({ ...prev, expiryMonth: e.target.value }))}
                            className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 ${
                              errors.expiryMonth
                                ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                                : theme === 'dark'
                                  ? 'border-gray-700 bg-[#1F1F1F] text-white focus:ring-blue-500 focus:border-blue-500'
                                  : 'border-gray-300 bg-white text-gray-900 focus:ring-blue-500 focus:border-blue-500'
                            }`}
                          >
                            <option value="">MM</option>
                            {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                              <option key={month} value={month.toString().padStart(2, '0')}>
                                {month.toString().padStart(2, '0')}
                              </option>
                            ))}
                          </select>
                          {errors.expiryMonth && (
                            <p className="mt-1 text-sm text-red-500">{errors.expiryMonth}</p>
                          )}
                        </div>

                        <div>
                          <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-700'}`}>
                            Year
                          </label>
                          <select
                            value={cardForm.expiryYear}
                            onChange={(e) => setCardForm(prev => ({ ...prev, expiryYear: e.target.value }))}
                            className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 ${
                              errors.expiryYear
                                ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                                : theme === 'dark'
                                  ? 'border-gray-700 bg-[#1F1F1F] text-white focus:ring-blue-500 focus:border-blue-500'
                                  : 'border-gray-300 bg-white text-gray-900 focus:ring-blue-500 focus:border-blue-500'
                            }`}
                          >
                            <option value="">YYYY</option>
                            {yearOptions.map(year => (
                              <option key={year} value={year}>{year}</option>
                            ))}
                          </select>
                          {errors.expiryYear && (
                            <p className="mt-1 text-sm text-red-500">{errors.expiryYear}</p>
                          )}
                        </div>

                        <div>
                          <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-700'}`}>
                            CVV
                          </label>
                          <div className="relative">
                            <input
                              type={showCardDetails ? 'text' : 'password'}
                              value={cardForm.cvv}
                              onChange={(e) => setCardForm(prev => ({ ...prev, cvv: e.target.value }))}
                              maxLength="4"
                              className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 ${
                                errors.cvv
                                  ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                                  : theme === 'dark'
                                    ? 'border-gray-700 bg-[#1F1F1F] text-white focus:ring-blue-500 focus:border-blue-500'
                                    : 'border-gray-300 bg-white text-gray-900 focus:ring-blue-500 focus:border-blue-500'
                              }`}
                              placeholder="123"
                            />
                            <button
                              type="button"
                              onClick={() => setShowCardDetails(!showCardDetails)}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2"
                            >
                              {showCardDetails ? (
                                <FaEyeSlash className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                              ) : (
                                <FaEye className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                              )}
                            </button>
                          </div>
                          {errors.cvv && (
                            <p className="mt-1 text-sm text-red-500">{errors.cvv}</p>
                          )}
                        </div>
                      </div>

                      {/* Billing Address */}
                      <div className="space-y-4">
                        <h3 className={`text-lg font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          Billing Address
                        </h3>
                        
                        <div>
                          <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-700'}`}>
                            Address
                          </label>
                          <input
                            type="text"
                            value={cardForm.billingAddress}
                            onChange={(e) => setCardForm(prev => ({ ...prev, billingAddress: e.target.value }))}
                            className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 ${
                              errors.billingAddress
                                ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                                : theme === 'dark'
                                  ? 'border-gray-700 bg-[#1F1F1F] text-white focus:ring-blue-500 focus:border-blue-500'
                                  : 'border-gray-300 bg-white text-gray-900 focus:ring-blue-500 focus:border-blue-500'
                            }`}
                            placeholder="123 Main St"
                          />
                          {errors.billingAddress && (
                            <p className="mt-1 text-sm text-red-500">{errors.billingAddress}</p>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-700'}`}>
                              City
                            </label>
                            <input
                              type="text"
                              value={cardForm.city}
                              onChange={(e) => setCardForm(prev => ({ ...prev, city: e.target.value }))}
                              className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 ${
                                errors.city
                                  ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                                  : theme === 'dark'
                                    ? 'border-gray-700 bg-[#1F1F1F] text-white focus:ring-blue-500 focus:border-blue-500'
                                    : 'border-gray-300 bg-white text-gray-900 focus:ring-blue-500 focus:border-blue-500'
                              }`}
                              placeholder="New York"
                            />
                            {errors.city && (
                              <p className="mt-1 text-sm text-red-500">{errors.city}</p>
                            )}
                          </div>

                          <div>
                            <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-700'}`}>
                              State
                            </label>
                            <input
                              type="text"
                              value={cardForm.state}
                              onChange={(e) => setCardForm(prev => ({ ...prev, state: e.target.value }))}
                              className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 ${
                                errors.state
                                  ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                                  : theme === 'dark'
                                    ? 'border-gray-700 bg-[#1F1F1F] text-white focus:ring-blue-500 focus:border-blue-500'
                                    : 'border-gray-300 bg-white text-gray-900 focus:ring-blue-500 focus:border-blue-500'
                              }`}
                              placeholder="NY"
                            />
                            {errors.state && (
                              <p className="mt-1 text-sm text-red-500">{errors.state}</p>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-700'}`}>
                              ZIP Code
                            </label>
                            <input
                              type="text"
                              value={cardForm.zipCode}
                              onChange={(e) => setCardForm(prev => ({ ...prev, zipCode: e.target.value }))}
                              className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 ${
                                errors.zipCode
                                  ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                                  : theme === 'dark'
                                    ? 'border-gray-700 bg-[#1F1F1F] text-white focus:ring-blue-500 focus:border-blue-500'
                                    : 'border-gray-300 bg-white text-gray-900 focus:ring-blue-500 focus:border-blue-500'
                              }`}
                              placeholder="10001"
                            />
                            {errors.zipCode && (
                              <p className="mt-1 text-sm text-red-500">{errors.zipCode}</p>
                            )}
                          </div>

                          <div>
                            <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-700'}`}>
                              Country
                            </label>
                            <input
                              type="text"
                              value={cardForm.country}
                              onChange={(e) => setCardForm(prev => ({ ...prev, country: e.target.value }))}
                              className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 ${
                                errors.country
                                  ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                                  : theme === 'dark'
                                    ? 'border-gray-700 bg-[#1F1F1F] text-white focus:ring-blue-500 focus:border-blue-500'
                                    : 'border-gray-300 bg-white text-gray-900 focus:ring-blue-500 focus:border-blue-500'
                              }`}
                              placeholder="United States"
                            />
                            {errors.country && (
                              <p className="mt-1 text-sm text-red-500">{errors.country}</p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Save Card Option */}
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id="saveCard"
                          checked={saveCard}
                          onChange={(e) => setSaveCard(e.target.checked)}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="saveCard" className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                          Save card details for future payments
                        </label>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Bank Details */}
                      <div className="space-y-4">
                        <div>
                          <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-700'}`}>
                            Bank Name
                          </label>
                          <div className="relative">
                            <div
                              onClick={() => setShowBankDropdown(!showBankDropdown)}
                              className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 cursor-pointer flex items-center justify-between ${
                                errors.bankName
                                  ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                                  : theme === 'dark'
                                    ? 'border-gray-700 bg-gradient-to-r from-gray-800 to-gray-900 text-white focus:ring-blue-500 focus:border-blue-500 hover:border-blue-500/50'
                                    : 'border-gray-300 bg-gradient-to-r from-white to-gray-50 text-gray-900 focus:ring-blue-500 focus:border-blue-500 hover:border-blue-300'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                {selectedBank ? (
                                  <>
                                    <span className="text-xl">{selectedBank.logo}</span>
                                    <span className={selectedBank ? 'font-medium' : 'text-gray-500'}>
                                      {selectedBank.name}
                                    </span>
                                  </>
                                ) : (
                                  <span className="text-gray-500">Select a bank</span>
                                )}
                              </div>
                              <FaChevronDown className={`text-sm transition-transform duration-200 ${showBankDropdown ? 'rotate-180' : ''} ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                            </div>
                            
                            {/* Bank Dropdown */}
                            {showBankDropdown && (
                              <div className={`bank-dropdown absolute z-50 w-full mt-1 rounded-xl border-2 shadow-2xl max-h-60 overflow-y-auto ${
                                theme === 'dark' ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-600' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'
                              }`}>
                                {filteredBanks.map((bank) => (
                                  <div
                                    key={bank.code}
                                    onClick={() => handleBankSelect(bank)}
                                    className={`px-4 py-3 cursor-pointer transition-all duration-200 flex items-center gap-3 hover:bg-gradient-to-r ${
                                      theme === 'dark' ? 'hover:from-blue-900/30 hover:to-purple-900/30' : 'hover:from-blue-50 hover:to-purple-50'
                                    } ${selectedBank?.code === bank.code ? (theme === 'dark' ? 'bg-gradient-to-r from-blue-600/20 to-purple-600/20' : 'bg-gradient-to-r from-blue-100 to-purple-100') : ''}`}
                                  >
                                    <span className="text-xl">{bank.logo}</span>
                                    <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                      {bank.name}
                                    </span>
                                    {selectedBank?.code === bank.code && (
                                      <FaCheck className={`ml-auto text-sm ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
                                    )}
                                  </div>
                                ))}
                                {filteredBanks.length === 0 && (
                                  <div className={`px-4 py-3 text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                    No banks found
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          {errors.bankName && (
                            <p className="mt-1 text-sm text-red-500">{errors.bankName}</p>
                          )}
                        </div>

                        <div>
                          <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-700'}`}>
                            Account Holder Name
                          </label>
                          <input
                            type="text"
                            value={bankForm.accountHolderName}
                            onChange={(e) => setBankForm(prev => ({ ...prev, accountHolderName: e.target.value }))}
                            className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 ${
                              errors.accountHolderName
                                ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                                : theme === 'dark'
                                  ? 'border-gray-700 bg-[#1F1F1F] text-white focus:ring-blue-500 focus:border-blue-500'
                                  : 'border-gray-300 bg-white text-gray-900 focus:ring-blue-500 focus:border-blue-500'
                            }`}
                            placeholder="John Doe"
                          />
                          {errors.accountHolderName && (
                            <p className="mt-1 text-sm text-red-500">{errors.accountHolderName}</p>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-700'}`}>
                              Account Number
                            </label>
                            <input
                              type="password"
                              value={bankForm.accountNumber}
                              onChange={(e) => setBankForm(prev => ({ ...prev, accountNumber: e.target.value }))}
                              className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 ${
                                errors.accountNumber
                                  ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                                  : theme === 'dark'
                                    ? 'border-gray-700 bg-[#1F1F1F] text-white focus:ring-blue-500 focus:border-blue-500'
                                    : 'border-gray-300 bg-white text-gray-900 focus:ring-blue-500 focus:border-blue-500'
                              }`}
                              placeholder="1234567890"
                            />
                            {errors.accountNumber && (
                              <p className="mt-1 text-sm text-red-500">{errors.accountNumber}</p>
                            )}
                            <p className="mt-1 text-xs text-red-500">
                              • Must be 8-17 digits long<br/>
                              • No spaces or special characters<br/>
                              • Usually found on your checks or bank statement
                            </p>
                          </div>

                          <div>
                            <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-700'}`}>
                              Routing Number
                            </label>
                            <input
                              type="password"
                              value={bankForm.routingNumber}
                              onChange={(e) => setBankForm(prev => ({ ...prev, routingNumber: e.target.value }))}
                              className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 ${
                                errors.routingNumber
                                  ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                                  : theme === 'dark'
                                    ? 'border-gray-700 bg-[#1F1F1F] text-white focus:ring-blue-500 focus:border-blue-500'
                                    : 'border-gray-300 bg-white text-gray-900 focus:ring-blue-500 focus:border-blue-500'
                              }`}
                              placeholder="021000021"
                            />
                            {errors.routingNumber && (
                              <p className="mt-1 text-sm text-red-500">{errors.routingNumber}</p>
                            )}
                            <p className="mt-1 text-xs text-red-500">
                              • Must be exactly 9 digits<br/>
                              • No spaces or special characters<br/>
                              • Found on the bottom left of your checks
                            </p>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className={`w-full py-4 px-6 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transform hover:scale-105`}
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Processing Payment...
                      </>
                    ) : (
                      <>
                        <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center">
                          <FaLock className="text-white text-sm" />
                        </div>
                        Pay ${planDetails.price}
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className={`rounded-2xl shadow-xl border-2 transition-all duration-300 hover:shadow-2xl ${
              theme === 'dark' 
                ? 'bg-gradient-to-br from-gray-800/50 via-gray-900/50 to-gray-800/50 border-gray-600 hover:border-purple-500/50' 
                : 'bg-gradient-to-br from-white via-purple-50/30 to-pink-50/30 border-purple-200 hover:border-purple-300'
            }`}>
              <div className={`p-6 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-purple-100'}`}>
                <h2 className={`text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent flex items-center gap-3`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-r from-purple-600 to-pink-600`}>
                    <FaCheck className="text-white text-lg" />
                  </div>
                  Order Summary
                </h2>
              </div>

              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Plan</span>
                    <span className={`font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent`}>
                      {planDetails.name}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Billing Cycle</span>
                    <span className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {planDetails.period === 'month' ? 'Monthly' : 'Annual'}
                    </span>
                  </div>

                  {plan === 'annual' && (
                    <div className="flex justify-between items-center">
                      <span className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Discount</span>
                      <span className="font-bold text-green-500 bg-green-100 px-2 py-1 rounded-lg">-40%</span>
                    </div>
                  )}

                  <div className={`border-t pt-4 ${theme === 'dark' ? 'border-gray-700' : 'border-purple-200'}`}>
                    <div className="flex justify-between items-center">
                      <span className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        Total
                      </span>
                      <span className={`text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent`}>
                        ${planDetails.price}
                      </span>
                    </div>
                  </div>
                </div>

                <div className={`mt-6 p-4 rounded-xl ${theme === 'dark' ? 'bg-gradient-to-r from-gray-800/50 to-gray-700/50' : 'bg-gradient-to-r from-purple-50 to-pink-50'}`}>
                  <h3 className={`font-semibold mb-3 flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    <div className="w-5 h-5 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                      <FaCheck className="text-white text-xs" />
                    </div>
                    What's included:
                  </h3>
                  <ul className={`space-y-2 text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                    {subscriptionFeatures.map((feature) => (
                      <li key={feature._id} className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                          {getFeatureIcon(feature)}
                        </div>
                        <span>{feature.Value}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Payment; 