// Utility functions for onboarding and setup progress

export const checkOnboardingStatus = (userDetails, organization, teams, projects) => {
  if (!userDetails) return { shouldShowOnboarding: false, progress: 0 };

  const progress = {
    profileComplete: isProfileComplete(userDetails),
    organizationComplete: !!organization,
    teamCreated: teams && teams.length > 0,
    projectCreated: projects && projects.length > 0,
    onboardingComplete: false
  };

  const completedSteps = Object.values(progress).filter(Boolean).length;
  const totalSteps = Object.keys(progress).length;
  const progressPercentage = Math.round((completedSteps / totalSteps) * 100);

  return {
    shouldShowOnboarding: !userDetails.onboardingCompleted,
    progress: progressPercentage,
    progressDetails: progress
  };
};

export const isProfileComplete = (profile) => {
  if (!profile) return false;
  
  const requiredFields = [
    'firstName', 
    'lastName', 
    'email', 
    'phone', 
    'address', 
    'city', 
    'state', 
    'country'
  ];
  
  return requiredFields.every(field => 
    profile[field] && profile[field].toString().trim() !== ''
  );
};

export const getOnboardingStep = (userDetails, progressDetails) => {
  if (!userDetails) return 'welcome';

  if (!progressDetails.profileComplete) return 'profile';
  if (!progressDetails.organizationComplete) return 'organization';
  if (!progressDetails.teamCreated) return 'team';
  if (!progressDetails.projectCreated) return 'project';
  
  return 'complete';
};

export const calculateOnboardingProgress = (userDetails, organization, teams, projects) => {
  const { progressDetails } = checkOnboardingStatus(userDetails, organization, teams, projects);
  
  return {
    onboardingCompleted: userDetails?.onboardingCompleted || false,
    onboardingStep: getOnboardingStep(userDetails, progressDetails),
    onboardingProgress: progressDetails
  };
}; 