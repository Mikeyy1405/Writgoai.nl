
/**
 * Auto Plan Checker - Client-side utility
 * Checks if content plan needs regeneration on portal load
 */

export interface PlanCheckResult {
  needsRegeneration: boolean;
  daysRemaining: number;
  message: string;
}

/**
 * Check if content plan needs regeneration
 */
export function checkContentPlanStatus(contentPlan: any, lastPlanGenerated: Date | null): PlanCheckResult {
  // No plan exists
  if (!contentPlan || !Array.isArray(contentPlan) || contentPlan.length === 0) {
    return {
      needsRegeneration: true,
      daysRemaining: 0,
      message: 'Geen contentplan beschikbaar. Scan je website om te beginnen.'
    };
  }

  // Check how many days are still in the future
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const futureDays = contentPlan.filter(day => {
    if (!day.date) return false;
    const dayDate = new Date(day.date);
    dayDate.setHours(0, 0, 0, 0);
    return dayDate >= today;
  });

  const daysRemaining = futureDays.length;

  // Less than 3 days remaining - needs regeneration urgently
  if (daysRemaining < 3) {
    return {
      needsRegeneration: true,
      daysRemaining,
      message: daysRemaining === 0 
        ? '⚠️ Je contentplan is verlopen! Scan opnieuw om een nieuw 7-daags plan te maken.'
        : `⚠️ Nog maar ${daysRemaining} ${daysRemaining === 1 ? 'dag' : 'dagen'} in je plan. Scan opnieuw voor een vers 7-daags plan.`
    };
  }

  // 3-5 days remaining - suggest regeneration
  if (daysRemaining < 5) {
    return {
      needsRegeneration: false,
      daysRemaining,
      message: `📅 Je hebt nog ${daysRemaining} dagen content gepland. Overwegje binnenkort een nieuwe scan voor een fris 7-daags plan.`
    };
  }

  // All good - 5+ days remaining
  return {
    needsRegeneration: false,
    daysRemaining,
    message: `✅ Je contentplan is up-to-date met ${daysRemaining} dagen content!`
  };
}

/**
 * Get next 7 days of content from plan
 */
export function getNext7Days(contentPlan: any[]): any[] {
  if (!Array.isArray(contentPlan) || contentPlan.length === 0) {
    return [];
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Filter to only future days and sort by date
  const futureDays = contentPlan
    .filter(day => {
      if (!day.date) return false;
      const dayDate = new Date(day.date);
      dayDate.setHours(0, 0, 0, 0);
      return dayDate >= today;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Return next 7 days
  return futureDays.slice(0, 7);
}
