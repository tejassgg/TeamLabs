import { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useGlobal } from '../../context/GlobalContext';
import { useToast } from '../../context/ToastContext';
import { userService, commonTypeService } from '../../services/api';
import { FaUserPlus, FaTimes, FaRegCopy, FaCheck } from 'react-icons/fa';
import CustomDropdown from './CustomDropdown';

const DEFAULT_DB_ROLES = [
  'Admin',
  'User',
  'Developer',
  'Tester',
  'Support Engineer',
  'Deployment Engineer',
  'Project Manager',
  'Client'
];

const InviteModal = ({
  isOpen,
  onClose,
  organizationName,
  members: initialMembers,
  onInviteSent
}) => {
  const { theme } = useTheme();
  const { userDetails, organization } = useGlobal();
  const { showToast } = useToast();

  const [emailInput, setEmailInput] = useState('');
  const [emailChips, setEmailChips] = useState([]);
  const [inviteRole, setInviteRole] = useState('User');
  const [linkAccess, setLinkAccess] = useState('anyone'); // 'anyone' | 'invited'
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [isStatusError, setIsStatusError] = useState(false);
  const [preGeneratedToken, setPreGeneratedToken] = useState('');
  const [isGeneratingToken, setIsGeneratingToken] = useState(false);
  const [rolesList, setRolesList] = useState(DEFAULT_DB_ROLES);

  // Member state
  const [membersList, setMembersList] = useState([]);

  // Fetch DB roles & pre-generate auth token on modal open / role / access change
  useEffect(() => {
    if (isOpen) {
      // Pre-generate token with selected role and access level
      const fetchToken = async () => {
        setIsGeneratingToken(true);
        try {
          const res = await userService.generateInviteToken(inviteRole, linkAccess);
          if (res?.token) {
            setPreGeneratedToken(res.token);
          }
        } catch (err) {
          console.error('Failed to pre-generate invite token:', err);
        } finally {
          setIsGeneratingToken(false);
        }
      };
      fetchToken();
    }
  }, [isOpen, inviteRole, linkAccess]);

  useEffect(() => {
    if (isOpen) {
      // Fetch user roles stored in DB
      const fetchRoles = async () => {
        try {
          const fetchedRoles = await commonTypeService.getUserRoles();
          if (Array.isArray(fetchedRoles) && fetchedRoles.length > 0) {
            const parsedRoles = fetchedRoles
              .map(r => typeof r === 'string' ? r : (r.Value || r.name))
              .filter(Boolean);

            if (parsedRoles.length > 0) {
              setRolesList(parsedRoles);
            }
          }
        } catch (err) {
          console.error('Failed to fetch user roles from DB:', err);
        }
      };
      fetchRoles();
    }
  }, [isOpen]);

  useEffect(() => {
    setStatusMessage('');
    setIsStatusError(false);
  }, [isOpen]);

  // Dynamic share link using pre-generated token
  const orgNameDisplay = organizationName || organization?.Name || 'Workspace';
  const tokenForLink = preGeneratedToken || (userDetails?.organizationID ? `org_${userDetails.organizationID}` : 'teamlabs');
  const shareableLink = typeof window !== 'undefined'
    ? `${window.location.origin}/auth?inviteToken=${tokenForLink}`
    : `https://www.teamlabs.app/auth?inviteToken=${tokenForLink}`;

  // Populate organization members
  useEffect(() => {
    if (initialMembers && initialMembers.length > 0) {
      setMembersList(initialMembers);
    } else {
      // Current user as fallback
      const defaultMembers = [
        {
          id: userDetails?._id || '1',
          name: userDetails?.firstName ? `${userDetails.firstName} ${userDetails.lastName || ''}`.trim() : 'Current User',
          email: userDetails?.email || 'user@example.com',
          role: 'Admin',
          avatar: userDetails?.profileImage || null
        }
      ];
      setMembersList(defaultMembers);
    }
  }, [initialMembers, userDetails]);

  if (!isOpen) return null;

  // Handle adding email chips
  const handleKeyDown = (e) => {
    if (['Enter', ',', ' '].includes(e.key)) {
      e.preventDefault();
      addChip();
    }
  };

  const addChip = () => {
    const trimmed = emailInput.trim();
    if (trimmed && trimmed.includes('@')) {
      if (!emailChips.includes(trimmed)) {
        setEmailChips([...emailChips, trimmed]);
      }
      setEmailInput('');
    }
  };

  const removeChip = (indexToRemove) => {
    setEmailChips(emailChips.filter((_, i) => i !== indexToRemove));
  };

  // Handle copy share link
  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareableLink);
    setCopied(true);
    showToast('Invite link copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2500);
  };

  // Send invitation with pre-generated token & selected role
  const handleSendInvite = async () => {
    let emailsToSend = [...emailChips];
    if (emailInput.trim() && emailInput.trim().includes('@')) {
      emailsToSend.push(emailInput.trim());
      setEmailInput('');
    }

    if (emailsToSend.length === 0) {
      showToast('Please enter at least one valid email address', 'warning');
      return;
    }

    setIsSubmitting(true);
    setStatusMessage('');
    setIsStatusError(false);

    try {
      // Send invite for each email passing verified preGeneratedToken, selected role, and linkAccess
      for (const email of emailsToSend) {
        await userService.inviteUser(email, preGeneratedToken, inviteRole, 'invited');
      }

      showToast(`Invitation sent to ${emailsToSend.length} recipient${emailsToSend.length > 1 ? 's' : ''}!`, 'success');
      setStatusMessage('Invite sent successfully!');
      setIsStatusError(false);
      setEmailChips([]);

      if (onInviteSent) {
        onInviteSent(emailsToSend);
      }

      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      console.error('Failed to send invite:', err);
      showToast(err.message || 'Failed to send invite', 'error');
      setStatusMessage(err.message || 'Failed to send invite');
      setIsStatusError(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Role change handler for members
  const handleRoleChange = async (memberId, newRole) => {
    try {
      await userService.updateUserRole(memberId, newRole);
      setMembersList(prev => prev.map(m => m.id === memberId ? { ...m, role: newRole } : m));
      showToast(`Member role updated to ${newRole}`, 'success');
      if (onInviteSent) {
        onInviteSent();
      }
    } catch (err) {
      console.error('Failed to update member role:', err);
      showToast(err.message || 'Failed to update member role', 'error');
    }
  };

  const linkAccessOptions = [
    { value: 'anyone', label: 'Anyone with link' },
    { value: 'invited', label: 'Only invited members' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className={`w-full max-w-2xl min-h-[580px] max-h-[90vh] flex flex-col justify-between rounded-3xl p-6 sm:p-8 shadow-2xl transition-all relative transform animate-in zoom-in-95 duration-200 overflow-y-auto ${theme === 'dark'
          ? 'bg-dark-bg border border-[#27272a] text-[#F3F6FA]'
          : 'bg-white border border-gray-100 text-gray-900'
          }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3.5">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center relative flex-shrink-0 ${theme === 'dark'
              ? 'bg-blue-900/40 text-blue-400 border border-blue-800/50'
              : 'bg-blue-50 text-blue-600 border border-blue-100'
              }`}>
              <FaUserPlus className="text-xl" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">
                Invite to {orgNameDisplay}
              </h2>
              <p className={`text-xs sm:text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                Collaborate with members
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-2 rounded-full transition-colors ${theme === 'dark'
              ? 'text-gray-400 hover:text-white hover:bg-gray-800'
              : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
              }`}
            aria-label="Close modal"
          >
            <FaTimes className="text-lg" />
          </button>
        </div>

        {/* Dashed Separator */}
        <div className={`my-5 border-b border-dashed ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'
          }`} />

        {/* Link to Share Section */}
        <div className={`p-4 sm:p-4.5 rounded-2xl mb-5 border ${theme === 'dark'
          ? 'bg-dark-card border-[#2e2e2e]'
          : 'bg-gray-50/90 border-gray-100'
          }`}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold">Link to Share</h3>
              <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                {linkAccess === 'anyone' ? 'Anyone with the link can access' : 'Only invited members can access'}
              </p>
            </div>

            {/* Link access CustomDropdown */}
            <div className="w-44">
              <CustomDropdown
                value={linkAccess}
                onChange={setLinkAccess}
                options={linkAccessOptions}
                size="sm"
                variant="outlined"
              />
            </div>
          </div>

          {/* Link display & copy button */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={isGeneratingToken ? 'Generating token...' : shareableLink}
              className={`flex-1 px-3.5 py-2 rounded-xl text-xs sm:text-sm border truncate outline-none select-all ${theme === 'dark'
                ? 'bg-dark-bg border-[#3f3f46] text-gray-300'
                : 'bg-white border-gray-200 text-gray-600'
                }`}
            />
            <button
              onClick={handleCopyLink}
              disabled={isGeneratingToken}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold border flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer ${copied
                ? 'bg-emerald-600 text-white border-emerald-600'
                : theme === 'dark'
                  ? 'bg-dark-bg hover:bg-[#27272a] border-[#3f3f46] text-gray-200'
                  : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-800'
                }`}
            >
              {copied ? <FaCheck className="text-xs" /> : <FaRegCopy className="text-xs" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Email Invitation Section */}
        <div className="mb-6">
          <label className="block text-xs sm:text-sm font-semibold mb-2">
            Email
          </label>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            {/* Input field with email pills */}
            <div className={`flex-1 min-w-0 flex flex-wrap items-center gap-1.5 px-3 py-1.5 rounded-xl border shadow-xs transition-all ${theme === 'dark'
              ? 'bg-dark-bg border-[#3f3f46] focus-within:border-blue-500'
              : 'bg-white border-gray-200 focus-within:border-blue-500'
              }`}>
              {emailChips.map((email, idx) => (
                <span
                  key={idx}
                  className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg ${theme === 'dark'
                    ? 'bg-gray-800 text-gray-200 border border-gray-700'
                    : 'bg-gray-100 text-gray-800 border border-gray-200'
                    }`}
                >
                  {email}
                  <button
                    type="button"
                    onClick={() => removeChip(idx)}
                    className="hover:text-red-500 transition-colors"
                  >
                    <FaTimes className="text-xs" />
                  </button>
                </span>
              ))}
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={addChip}
                placeholder={emailChips.length === 0 ? "Enter email address..." : "Add another..."}
                className="flex-1 min-w-[130px] bg-transparent text-xs sm:text-sm outline-none py-1 text-gray-900 dark:text-gray-100 placeholder-gray-400"
              />

              {/* Role selector CustomDropdown inline */}
              <div className="w-36">
                <CustomDropdown
                  value={inviteRole}
                  onChange={setInviteRole}
                  options={rolesList.map(r => ({ value: r, label: r }))}
                  size="sm"
                  variant="outlined"
                />
              </div>
            </div>

            {/* Send Invite button */}
            <button
              onClick={handleSendInvite}
              disabled={isSubmitting || (emailChips.length === 0 && !emailInput.trim())}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 flex-shrink-0 cursor-pointer ${theme === 'dark'
                ? 'bg-white hover:bg-gray-100 text-gray-900'
                : 'bg-dark-bg hover:bg-black text-white'
                }`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Sending...
                </>
              ) : (
                'Send Invite'
              )}
            </button>
          </div>
          {statusMessage && (
            <p className={`text-xs mt-1.5 font-medium ${isStatusError ? 'text-red-500' : 'text-emerald-500'}`}>
              {statusMessage}
            </p>
          )}
        </div>

        {/* Organization Members Section */}
        <div>
          <h3 className="text-xs sm:text-sm font-semibold mb-3">
            Members
          </h3>

          <div className="space-y-3 max-h-72 overflow-y-auto pr-1 custom-scrollbar">
            {membersList.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between py-1 gap-3"
              >
                {/* Member Avatar & Details */}
                <div className="flex items-center gap-3 min-w-0">
                  {member.avatar ? (
                    <img
                      src={member.avatar}
                      alt={member.name}
                      className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover flex-shrink-0 border border-gray-200 dark:border-gray-700"
                    />
                  ) : (
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 text-white font-semibold flex items-center justify-center text-xs sm:text-sm flex-shrink-0 shadow-xs">
                      {member.name ? member.name.charAt(0).toUpperCase() : 'M'}
                    </div>
                  )}

                  <div className="min-w-0">
                    <h4 className="text-xs sm:text-sm font-semibold truncate leading-tight">
                      {member.name}
                    </h4>
                    <p className={`text-xs truncate ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      {member.email}
                    </p>
                  </div>
                </div>

                {/* Role CustomDropdown for each member */}
                <div className="w-48 flex-shrink-0">
                  <CustomDropdown
                    value={member.role || rolesList[0]}
                    onChange={(newRole) => handleRoleChange(member.id, newRole)}
                    options={rolesList.map(r => ({ value: r, label: r }))}
                    size="sm"
                    variant="outlined"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InviteModal;
