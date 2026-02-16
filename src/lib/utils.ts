export function formatCurrency(amount: number, currency: string = 'KES'): string {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-KE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffInDays === 0) return 'Today';
  if (diffInDays === 1) return 'Yesterday';
  if (diffInDays < 7) return `${diffInDays} days ago`;
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
  return `${Math.floor(diffInDays / 30)} months ago`;
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
}

export function calculateHustleScore(profile: {
  id_verified: boolean;
  skill_tested: boolean;
  jobs_completed: number;
  disputes_count?: number;
  profile_complete: boolean;
}): number {
  let score = 10;
  
  if (profile.id_verified) score += 10;
  if (profile.profile_complete) score += 5;
  if (profile.skill_tested) score += 15;
  score += Math.min(profile.jobs_completed * 20, 40);
  score -= (profile.disputes_count || 0) * 50;
  
  return Math.max(0, Math.min(100, score));
}

export function getVerificationBadgeColor(status: string): string {
  switch (status) {
    case 'Skill-Tested':
      return 'bg-green-100 text-green-800';
    case 'ID-Verified':
      return 'bg-blue-100 text-blue-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export function getHustleScoreColor(score: number): string {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-blue-600';
  if (score >= 40) return 'text-yellow-600';
  return 'text-red-600';
}

export function getJobStatusColor(status: string): string {
  switch (status) {
    case 'Open':
      return 'bg-green-100 text-green-800';
    case 'In-Progress':
      return 'bg-blue-100 text-blue-800';
    case 'Completed':
      return 'bg-gray-100 text-gray-800';
    case 'Disputed':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}
