import { createClient } from "@/lib/supabase/server";
import { cache } from "react";

// In-memory cache for content items
// This will be cleared on each server restart, but provides fast access during runtime
const contentCache = new Map<string, { value: string; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Default values as fallback
const DEFAULT_CONTENT: Record<string, string> = {
  hero_title: "Freshly home baked from the finest ingredients",
  hero_description: "Handcrafted daily with premium, locally-sourced ingredients. Recipes that meet modern care, delivering the warmth and authenticity of truly homemade baked goods fresh to your door.",
  featured_products_subtitle: "Our most popular items, loved by customers",
  logo_tagline: "Freshly home baked from the finest ingredients",
  service_fresh_ingredients_title: "Fresh Ingredients",
  service_fresh_ingredients_description: "We use only the finest organic ingredients sourced locally",
  service_expert_bakers_title: "Expert Bakers",
  service_expert_bakers_description: "Handcrafted by experienced artisan bakers with decades of skill",
  service_fast_delivery_title: "Fast Delivery",
  service_fast_delivery_description: "Same-day delivery available for orders placed before noon",
};

/**
 * Get a single content item by key with caching and fallback
 */
export const getContent = cache(async (key: string): Promise<string> => {
  // Check cache first
  const cached = contentCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.value;
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("content_items")
      .select("value")
      .eq("key", key)
      .single();

    if (error || !data) {
      // If DB call fails, try to use cache even if expired
      if (cached) {
        return cached.value;
      }
      // Fallback to default
      return DEFAULT_CONTENT[key] || "";
    }

    // Update cache
    contentCache.set(key, { value: data.value, timestamp: Date.now() });
    return data.value;
  } catch (error) {
    // On error, try cache first, then fallback
    if (cached) {
      return cached.value;
    }
    return DEFAULT_CONTENT[key] || "";
  }
});

/**
 * Get multiple content items at once with caching and fallback
 */
export const getContentBatch = cache(async (keys: string[]): Promise<Record<string, string>> => {
  const result: Record<string, string> = {};
  const keysToFetch: string[] = [];

  // Check cache for each key
  for (const key of keys) {
    const cached = contentCache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      result[key] = cached.value;
    } else {
      keysToFetch.push(key);
    }
  }

  // If all keys are cached, return immediately
  if (keysToFetch.length === 0) {
    return result;
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("content_items")
      .select("key, value")
      .in("key", keysToFetch);

    if (!error && data) {
      // Update cache and result
      for (const item of data) {
        contentCache.set(item.key, { value: item.value, timestamp: Date.now() });
        result[item.key] = item.value;
      }
    }

    // Fill in missing keys with cache (if expired) or defaults
    for (const key of keysToFetch) {
      if (!result[key]) {
        const cached = contentCache.get(key);
        if (cached) {
          result[key] = cached.value;
        } else {
          result[key] = DEFAULT_CONTENT[key] || "";
        }
      }
    }
  } catch (error) {
    // On error, fill with cache or defaults
    for (const key of keysToFetch) {
      if (!result[key]) {
        const cached = contentCache.get(key);
        result[key] = cached ? cached.value : (DEFAULT_CONTENT[key] || "");
      }
    }
  }

  return result;
});

/**
 * Clear the content cache (useful for admin updates)
 */
export function clearContentCache() {
  contentCache.clear();
}

