/**
 * Navigation history utilities using sessionStorage
 * Tracks the previous route for better back navigation
 */

const NAV_HISTORY_KEY = 'dough-bake-nav-history';
const MAX_HISTORY_LENGTH = 10;

/**
 * Store the current pathname in navigation history
 * Should be called whenever the route changes
 */
export function storeNavigationHistory(pathname: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    const history = getNavigationHistory();
    
    // Don't store if it's the same as the last entry
    if (history.length > 0 && history[history.length - 1] === pathname) {
      return;
    }
    
    // Add current pathname
    history.push(pathname);
    
    // Keep only the last MAX_HISTORY_LENGTH entries
    if (history.length > MAX_HISTORY_LENGTH) {
      history.shift();
    }
    
    sessionStorage.setItem(NAV_HISTORY_KEY, JSON.stringify(history));
  } catch (e) {
    // Ignore errors (e.g., if sessionStorage is disabled)
    console.warn('Failed to store navigation history:', e);
  }
}

/**
 * Get the navigation history array
 */
function getNavigationHistory(): string[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = sessionStorage.getItem(NAV_HISTORY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    return [];
  }
}

/**
 * Get the previous pathname (excluding product pages)
 * Returns null if no valid previous route is found
 */
export function getPreviousRoute(currentPathname: string): string | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const history = getNavigationHistory();
    
    // Look backwards through history to find a non-product page
    for (let i = history.length - 1; i >= 0; i--) {
      const pathname = history[i];
      
      // Skip the current pathname
      if (pathname === currentPathname) continue;
      
      // Skip product pages
      if (pathname.startsWith('/product/')) continue;
      
      // Return the first valid previous route
      return pathname;
    }
    
    return null;
  } catch (e) {
    return null;
  }
}

/**
 * Clear navigation history
 */
export function clearNavigationHistory(): void {
  if (typeof window === 'undefined') return;
  
  try {
    sessionStorage.removeItem(NAV_HISTORY_KEY);
  } catch (e) {
    // Ignore errors
  }
}

