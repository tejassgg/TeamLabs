/**
 * Policy Acceptance Storage Utility
 * Manages localStorage for tracking user acceptance of Privacy Policy, Terms of Service, and Cookie Policy
 */

const POLICY_KEYS = {
  PRIVACY_POLICY: 'teamlabs_privacy_policy_accepted',
  TERMS_OF_SERVICE: 'teamlabs_terms_of_service_accepted',
  COOKIE_POLICY: 'teamlabs_cookie_policy_accepted'
};

const POLICY_VERSIONS = {
  PRIVACY_POLICY: '1.0',
  TERMS_OF_SERVICE: '1.0',
  COOKIE_POLICY: '1.0'
};

/**
 * Check if a policy has been accepted
 * @param {string} policyType - The type of policy (privacy, terms, cookie)
 * @returns {boolean} - Whether the policy has been accepted
 */
export const isPolicyAccepted = (policyType) => {
  if (typeof window === 'undefined') return false; // SSR safety
  
  try {
    const key = POLICY_KEYS[policyType.toUpperCase()];
    if (!key) return false;
    
    const stored = localStorage.getItem(key);
    if (!stored) return false;
    
    const data = JSON.parse(stored);
    const currentVersion = POLICY_VERSIONS[policyType.toUpperCase()];
    
    // Check if the stored version matches current version
    return data.version === currentVersion && data.accepted === true;
  } catch (error) {
    console.error('Error checking policy acceptance:', error);
    return false;
  }
};

/**
 * Mark a policy as accepted
 * @param {string} policyType - The type of policy (privacy, terms, cookie)
 * @returns {boolean} - Whether the acceptance was successfully stored
 */
export const acceptPolicy = (policyType) => {
  if (typeof window === 'undefined') return false; // SSR safety
  
  try {
    const key = POLICY_KEYS[policyType];
    if (!key) return false;
    
    const currentVersion = POLICY_VERSIONS[policyType];
    const acceptanceData = {
      accepted: true,
      version: currentVersion,
      acceptedAt: new Date().toISOString(),
      userAgent: navigator.userAgent
    };
    
    localStorage.setItem(key, JSON.stringify(acceptanceData));
    return true;
  } catch (error) {
    console.error('Error storing policy acceptance:', error);
    return false;
  }
};

/**
 * Get detailed acceptance information for a policy
 * @param {string} policyType - The type of policy (privacy, terms, cookie)
 * @returns {object|null} - Acceptance data or null if not accepted
 */
export const getPolicyAcceptanceData = (policyType) => {
  if (typeof window === 'undefined') return null; // SSR safety
  
  try {
    const key = POLICY_KEYS[policyType];
    if (!key) return null;
    
    const stored = localStorage.getItem(key);
    if (!stored) return null;
    
    return JSON.parse(stored);
  } catch (error) {
    console.error('Error retrieving policy acceptance data:', error);
    return null;
  }
};

/**
 * Check if all required policies have been accepted
 * @returns {object} - Object with acceptance status for each policy
 */
export const getAllPolicyStatus = () => {
  return {
    privacyPolicy: isPolicyAccepted('privacy'),
    termsOfService: isPolicyAccepted('terms'),
    cookiePolicy: isPolicyAccepted('cookie'),
    allAccepted: isPolicyAccepted('privacy') && isPolicyAccepted('terms') && isPolicyAccepted('cookie')
  };
};

/**
 * Clear all policy acceptance data (useful for testing or user logout)
 */
export const clearAllPolicyAcceptance = () => {
  if (typeof window === 'undefined') return; // SSR safety
  
  try {
    Object.values(POLICY_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  } catch (error) {
    console.error('Error clearing policy acceptance data:', error);
  }
};

/**
 * Get acceptance statistics (for admin/debugging purposes)
 * @returns {object} - Statistics about policy acceptance
 */
export const getAcceptanceStats = () => {
  if (typeof window === 'undefined') return null; // SSR safety
  
  try {
    const stats = {
      totalPolicies: Object.keys(POLICY_KEYS).length,
      acceptedPolicies: 0,
      acceptanceDetails: {}
    };
    
    Object.entries(POLICY_KEYS).forEach(([policyType, key]) => {
      const data = getPolicyAcceptanceData(policyType.toLowerCase().replace('_', ''));
      stats.acceptanceDetails[policyType] = data;
      if (data && data.accepted) {
        stats.acceptedPolicies++;
      }
    });
    
    return stats;
  } catch (error) {
    console.error('Error getting acceptance stats:', error);
    return null;
  }
};
