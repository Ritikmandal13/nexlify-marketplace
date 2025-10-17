// Price Analysis & AI Suggestion Utilities
import { supabase } from './supabaseClient';

export interface PriceStats {
  average: number;
  median: number;
  min: number;
  max: number;
  count: number;
  suggestedMin: number;
  suggestedMax: number;
  confidence: 'high' | 'medium' | 'low';
}

export interface SimilarListing {
  id: string;
  title: string;
  price: number;
  condition: string;
  created_at: string;
}

/**
 * Extract key product type from title (smart matching)
 */
function extractProductKeywords(title: string): string[] {
  const normalized = title.toLowerCase();
  const keywords: string[] = [];
  
  // Electronics keywords
  const productTypes = [
    'phone', 'iphone', 'samsung', 'mobile',
    'laptop', 'macbook', 'dell', 'hp', 'lenovo',
    'headphone', 'earphone', 'airpod', 'earbud',
    'tablet', 'ipad',
    'watch', 'smartwatch',
    'camera', 'canon', 'nikon', 'sony',
    'speaker', 'bluetooth',
    'charger', 'cable',
  ];
  
  productTypes.forEach(type => {
    if (normalized.includes(type)) {
      keywords.push(type);
    }
  });
  
  return keywords;
}

/**
 * Calculate similarity score between two titles
 */
function calculateTitleSimilarity(title1: string, title2: string): number {
  const keywords1 = extractProductKeywords(title1);
  const keywords2 = extractProductKeywords(title2);
  
  if (keywords1.length === 0 || keywords2.length === 0) {
    return 0.5; // Medium similarity if no keywords found
  }
  
  const matches = keywords1.filter(k => keywords2.includes(k));
  
  // If both have no keywords, check for simple text similarity
  if (keywords1.length === 0 && keywords2.length === 0) {
    // Simple word overlap for items without specific keywords
    const words1 = title1.toLowerCase().split(/\s+/);
    const words2 = title2.toLowerCase().split(/\s+/);
    const commonWords = words1.filter(w => words2.includes(w) && w.length > 2);
    return commonWords.length > 0 ? 0.8 : 0.3;
  }
  
  return matches.length > 0 ? 1.0 : 0.3; // High similarity if match, low if different
}

/**
 * Fetch similar listings from database with smart matching
 */
export async function fetchSimilarListings(
  category: string,
  condition?: string,
  limit: number = 20,
  currentTitle?: string
): Promise<SimilarListing[]> {
  try {
    console.log('🔄 Fetching fresh data from database...', {
      category,
      condition,
      currentTitle,
      timestamp: new Date().toISOString()
    });

    // Fetch more listings for filtering
    let query = supabase
      .from('listings')
      .select('id, title, price, condition, created_at, status')
      .eq('category', category)
      .eq('status', 'active') // Re-enabled: only fetch active listings
      .order('created_at', { ascending: false })
      .limit(limit * 2); // Fetch more to filter intelligently

    if (condition) {
      query = query.eq('condition', condition);
    }

    const { data, error } = await query;

    if (error) throw error;
    if (!data || data.length === 0) return [];

    // If we have a current title, use smart matching
    if (currentTitle && currentTitle.trim()) {
      const scoredListings = data.map(listing => ({
        ...listing,
        similarity: calculateTitleSimilarity(currentTitle, listing.title)
      }));

      // Debug logging
      console.log('🔍 Smart Matching Debug:', {
        currentTitle,
        totalListings: data.length,
        scoredListings: scoredListings.map(l => ({
          title: l.title,
          price: l.price,
          status: l.status,
          similarity: l.similarity
        }))
      });

      // Sort by similarity (highest first) and filter out very different items
      const filtered = scoredListings
        .filter(l => l.similarity >= 0.5) // Only include similar items (0.5+ similarity)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit);

      console.log('✅ Filtered results:', filtered.length, 'listings');

      return filtered;
    }

    // Fallback to original behavior if no title
    return data.slice(0, limit);
  } catch (error) {
    console.error('Error fetching similar listings:', error);
    return [];
  }
}

/**
 * Calculate price statistics from similar listings
 */
export function calculatePriceStats(prices: number[]): PriceStats | null {
  if (prices.length === 0) return null;

  const validPrices = prices.filter(p => p > 0);
  if (validPrices.length === 0) return null;

  const sorted = [...validPrices].sort((a, b) => a - b);
  const sum = sorted.reduce((acc, price) => acc + price, 0);
  
  const average = sum / sorted.length;
  const median = sorted.length % 2 === 0
    ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
    : sorted[Math.floor(sorted.length / 2)];
  
  const min = sorted[0];
  const max = sorted[sorted.length - 1];

  // Calculate suggested price range (±15% of median)
  const suggestedMin = Math.round(median * 0.85);
  const suggestedMax = Math.round(median * 1.15);

  // Determine confidence based on sample size
  let confidence: 'high' | 'medium' | 'low';
  if (sorted.length >= 10) confidence = 'high';
  else if (sorted.length >= 5) confidence = 'medium';
  else confidence = 'low';

  return {
    average: Math.round(average),
    median: Math.round(median),
    min,
    max,
    count: sorted.length,
    suggestedMin,
    suggestedMax,
    confidence
  };
}

/**
 * Get AI-powered price suggestion using Gemini
 */
export async function getAIPriceSuggestion(
  title: string,
  description: string,
  category: string,
  condition: string,
  priceStats: PriceStats | null,
  similarListings?: SimilarListing[]
): Promise<string> {
  const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

  // Fallback if no API key
  if (!GEMINI_API_KEY || GEMINI_API_KEY === 'PASTE_YOUR_API_KEY_HERE') {
    return getStatisticalSuggestion(priceStats, category, condition);
  }

  try {
    const prompt = `You are a pricing expert for a local marketplace app called SmartThrift. Analyze this listing and suggest an optimal price.

Item Details:
- Title: ${title}
- Description: ${description}
- Category: ${category}
- Condition: ${condition}

Market Data from Similar Listings:
${priceStats ? `
- Average Price: ₹${priceStats.average}
- Median Price: ₹${priceStats.median}
- Price Range: ₹${priceStats.min} - ₹${priceStats.max}
- Sample Size: ${priceStats.count} similar items
- Confidence: ${priceStats.confidence}
${similarListings && similarListings.length > 0 ? `
- Similar items found: ${similarListings.map(l => l.title).slice(0, 3).join(', ')}
` : ''}
` : 'No similar listings found in this category.'}

Provide a concise price recommendation in 2-3 sentences. Include:
1. Specific suggested price or range
2. Brief reasoning
3. One pricing tip

Keep it friendly and helpful. Use ₹ for rupees.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 250,
            topP: 0.9,
            topK: 40
          }
        })
      }
    );

    if (!response.ok) {
      console.warn('Gemini API error:', response.status);
      return getStatisticalSuggestion(priceStats, category, condition);
    }

    const data = await response.json();
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (aiResponse) {
      return aiResponse.trim();
    }

    return getStatisticalSuggestion(priceStats, category, condition);
  } catch (error) {
    console.error('AI price suggestion error:', error);
    return getStatisticalSuggestion(priceStats, category, condition);
  }
}

/**
 * Fallback statistical suggestion when AI is unavailable
 */
function getStatisticalSuggestion(
  priceStats: PriceStats | null,
  category: string,
  condition: string
): string {
  if (!priceStats) {
    return `This is the first ${category} listing! Consider researching similar items online or pricing competitively to attract buyers. Start with a fair price you'd be willing to pay.`;
  }

  const { median, suggestedMin, suggestedMax, count, confidence } = priceStats;

  let confidenceText = '';
  if (confidence === 'high') {
    confidenceText = `Based on ${count} similar listings, pricing data is highly reliable.`;
  } else if (confidence === 'medium') {
    confidenceText = `Based on ${count} similar listings, this is a good estimate.`;
  } else {
    confidenceText = `Only ${count} similar listings found. Consider additional research.`;
  }

  const conditionText = condition.toLowerCase().includes('new') || condition.toLowerCase().includes('like new')
    ? 'Since your item is in excellent condition, you could price toward the higher end.'
    : 'Given the condition, pricing competitively will help sell faster.';

  return `💡 **Recommended Price: ₹${suggestedMin} - ₹${suggestedMax}**

The median price for similar ${category} items is ₹${median}. ${confidenceText} ${conditionText}

**Tip:** Price slightly below median (₹${Math.round(median * 0.95)}) for quick sales, or at median for optimal value!`;
}

