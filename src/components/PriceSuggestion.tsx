import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Lightbulb,
  DollarSign,
  BarChart3
} from 'lucide-react';
import {
  fetchSimilarListings,
  calculatePriceStats,
  getAIPriceSuggestion,
  type PriceStats,
  type SimilarListing
} from '@/lib/priceAnalysis';

interface PriceSuggestionProps {
  title: string;
  description: string;
  category: string;
  condition: string;
  currentPrice?: number;
  onPriceSelect?: (price: number) => void;
}

export const PriceSuggestion: React.FC<PriceSuggestionProps> = ({
  title,
  description,
  category,
  condition,
  currentPrice,
  onPriceSelect
}) => {
  const [loading, setLoading] = useState(false);
  const [priceStats, setPriceStats] = useState<PriceStats | null>(null);
  const [aiSuggestion, setAiSuggestion] = useState<string>('');
  const [similarListings, setSimilarListings] = useState<SimilarListing[]>([]);
  const [error, setError] = useState<string>('');

  const analyzePricing = async () => {
    if (!category) {
      setError('Please select a category first');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      // Fetch similar listings with smart matching
      const similar = await fetchSimilarListings(
        category, 
        condition, 
        20, 
        title // Pass title for smart matching
      );
      setSimilarListings(similar);

      // Calculate statistics
      const prices = similar.map(l => l.price);
      const stats = calculatePriceStats(prices);
      setPriceStats(stats);

      // Get AI suggestion
      const suggestion = await getAIPriceSuggestion(
        title || 'Item',
        description || 'No description',
        category,
        condition,
        stats,
        similar // Pass similar listings for context
      );
      setAiSuggestion(suggestion);
    } catch (err) {
      console.error('Price analysis error:', err);
      setError('Failed to analyze pricing. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceBadge = (confidence: string) => {
    const colors = {
      high: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      low: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
    };
    return (
      <Badge className={colors[confidence as keyof typeof colors] || colors.low}>
        {confidence.toUpperCase()} Confidence
      </Badge>
    );
  };

  const getPriceComparison = () => {
    if (!currentPrice || !priceStats) return null;

    const { median, suggestedMin, suggestedMax } = priceStats;
    const diff = currentPrice - median;
    const percentDiff = ((diff / median) * 100).toFixed(1);

    if (currentPrice < suggestedMin) {
      return (
        <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-950">
          <TrendingDown className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800 dark:text-orange-200">
            Your price is <strong>{Math.abs(Number(percentDiff))}% below</strong> the market median. 
            You might be undervaluing your item!
          </AlertDescription>
        </Alert>
      );
    } else if (currentPrice > suggestedMax) {
      return (
        <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950">
          <TrendingUp className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800 dark:text-blue-200">
            Your price is <strong>{percentDiff}% above</strong> the market median. 
            Consider lowering for faster sales.
          </AlertDescription>
        </Alert>
      );
    } else {
      return (
        <Alert className="border-green-200 bg-green-50 dark:bg-green-950">
          <Lightbulb className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            Great price! You're within the optimal range for this category.
          </AlertDescription>
        </Alert>
      );
    }
  };

  if (!loading && !priceStats && !aiSuggestion) {
    return (
      <Card className="border-2 border-dashed border-gray-300 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            AI Price Suggestion
          </CardTitle>
          <CardDescription>
            Get smart pricing recommendations based on market data and AI analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={analyzePricing}
            disabled={!category}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Analyze Price with AI
          </Button>
          {!category && (
            <p className="mt-2 text-sm text-gray-500 text-center">
              Select a category first to get pricing suggestions
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-purple-200 dark:border-purple-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            Price Analysis
          </CardTitle>
          <Button
            onClick={analyzePricing}
            variant="outline"
            size="sm"
            disabled={loading || !category}
          >
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : (
          <>
            {/* AI Suggestion */}
            {aiSuggestion && (
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                <div className="flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                      AI Recommendation
                    </h4>
                    <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">
                      {aiSuggestion}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Market Statistics */}
            {priceStats && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Market Data
                  </h4>
                  {getConfidenceBadge(priceStats.confidence)}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Average Price</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      ₹{priceStats.average.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Median Price</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      ₹{priceStats.median.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Price Range</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      ₹{priceStats.min.toLocaleString('en-IN')} - ₹{priceStats.max.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Sample Size</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {priceStats.count} listings
                    </p>
                  </div>
                </div>

                {/* Suggested Price Range */}
                <div className="bg-green-50 dark:bg-green-950 rounded-lg p-4 border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <h5 className="font-semibold text-green-900 dark:text-green-100">
                      Optimal Price Range
                    </h5>
                  </div>
                  <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                    ₹{priceStats.suggestedMin.toLocaleString('en-IN')} - ₹{priceStats.suggestedMax.toLocaleString('en-IN')}
                  </p>
                  {onPriceSelect && (
                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onPriceSelect(priceStats.suggestedMin)}
                        className="flex-1"
                      >
                        Use Min (₹{priceStats.suggestedMin})
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onPriceSelect(priceStats.median)}
                        className="flex-1"
                      >
                        Use Median (₹{priceStats.median})
                      </Button>
                    </div>
                  )}
                </div>

                {/* Price Comparison */}
                {getPriceComparison()}
              </div>
            )}

            {/* Similar Listings Count */}
            {similarListings.length > 0 && (
              <p className="text-xs text-gray-500 text-center">
                Analysis based on {similarListings.length} similar {category} listings
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

