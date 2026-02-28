import axios from "axios";
import { Restaurant } from "@/types";

const FOURSQUARE_API_KEY = process.env.FOURSQUARE_API_KEY;
// New Foursquare Places API endpoint (v3 was deprecated in 2025)
const FOURSQUARE_BASE_URL = "https://places-api.foursquare.com";

interface FoursquarePlace {
  fsq_place_id: string;
  name: string;
  location: {
    address?: string;
    locality?: string;
    region?: string;
    formatted_address?: string;
  };
  categories: Array<{
    fsq_category_id: string;
    name: string;
    short_name?: string;
    icon: {
      prefix: string;
      suffix: string;
    };
  }>;
  distance?: number;
  rating?: number;
  price?: number;
  tel?: string;
  website?: string;
}

export async function searchRestaurants(
  lat: number,
  lng: number,
  limit: number = 15,
): Promise<Restaurant[]> {
  if (!FOURSQUARE_API_KEY) {
    console.warn("Foursquare API key not configured, using mock data");
    return getMockRestaurants();
  }

  try {
    // Hard timeout: never wait more than 4s for external API
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const response = await axios.get<{ results: FoursquarePlace[] }>(
      `${FOURSQUARE_BASE_URL}/places/search`,
      {
        headers: {
          Authorization: `Bearer ${FOURSQUARE_API_KEY}`,
          Accept: "application/json",
          "X-Places-Api-Version": "2025-06-17",
        },
        params: {
          ll: `${lat},${lng}`,
          query: "restaurant",
          limit,
          sort: "DISTANCE",
        },
        signal: controller.signal,
        timeout: 4000,
      },
    );

    clearTimeout(timeoutId);

    const places = response.data.results;

    // Transform to app's Restaurant format
    const restaurants = places.map((place) => transformPlace(place));

    console.log(`Foursquare returned ${restaurants.length} real restaurants`);
    return restaurants.length > 0 ? restaurants : getMockRestaurants();
  } catch (error) {
    console.error(
      "Foursquare API failed/timed out, using mock data:",
      error instanceof Error ? error.message : error,
    );
    return getMockRestaurants();
  }
}

// Build Foursquare category icon URL (free tier, included in search results)
// Format: {prefix}{size}{suffix} — e.g. https://ss3.4sqi.net/img/categories_v2/food/default_120.png
function getCategoryIconUrl(place: FoursquarePlace): string {
  const icon = place.categories?.[0]?.icon;
  if (icon?.prefix && icon?.suffix) {
    // Use bg_ prefix variants for larger background images (120px)
    return `${icon.prefix}bg_120${icon.suffix}`;
  }
  // Fallback: default Foursquare food icon
  return "https://ss3.4sqi.net/img/categories_v2/food/default_bg_120.png";
}

// Cuisine-themed gradient backgrounds (CSS gradients encoded as data URIs)
// These are used as card backgrounds with the Foursquare category icon overlaid
const CUISINE_GRADIENTS: Record<string, string> = {
  Indian: "linear-gradient(135deg, #ff6b35 0%, #d32f2f 50%, #c62828 100%)",
  Chinese: "linear-gradient(135deg, #e53935 0%, #c62828 50%, #b71c1c 100%)",
  Japanese: "linear-gradient(135deg, #ec407a 0%, #c2185b 50%, #880e4f 100%)",
  Italian: "linear-gradient(135deg, #43a047 0%, #2e7d32 50%, #1b5e20 100%)",
  Pizza: "linear-gradient(135deg, #ff8f00 0%, #f57f17 50%, #e65100 100%)",
  Mexican: "linear-gradient(135deg, #f4511e 0%, #d84315 50%, #bf360c 100%)",
  Thai: "linear-gradient(135deg, #7b1fa2 0%, #6a1b9a 50%, #4a148c 100%)",
  French: "linear-gradient(135deg, #1565c0 0%, #0d47a1 50%, #0d47a1 100%)",
  Mediterranean:
    "linear-gradient(135deg, #00897b 0%, #00695c 50%, #004d40 100%)",
  American: "linear-gradient(135deg, #5d4037 0%, #4e342e 50%, #3e2723 100%)",
  "Fast Food": "linear-gradient(135deg, #fdd835 0%, #f9a825 50%, #f57f17 100%)",
  Burger: "linear-gradient(135deg, #8d6e63 0%, #6d4c41 50%, #4e342e 100%)",
  Sandwich: "linear-gradient(135deg, #ffb300 0%, #ff8f00 50%, #e65100 100%)",
  Cafe: "linear-gradient(135deg, #795548 0%, #5d4037 50%, #3e2723 100%)",
  Coffee: "linear-gradient(135deg, #6d4c41 0%, #4e342e 50%, #3e2723 100%)",
  Seafood: "linear-gradient(135deg, #0277bd 0%, #01579b 50%, #004c8c 100%)",
  BBQ: "linear-gradient(135deg, #d84315 0%, #bf360c 50%, #8d2208 100%)",
  Korean: "linear-gradient(135deg, #c62828 0%, #b71c1c 50%, #880e4f 100%)",
  Vietnamese: "linear-gradient(135deg, #2e7d32 0%, #1b5e20 50%, #0d4f13 100%)",
  Greek: "linear-gradient(135deg, #1565c0 0%, #0d47a1 50%, #002171 100%)",
  Steakhouse: "linear-gradient(135deg, #4e342e 0%, #3e2723 50%, #1b0000 100%)",
  Brunch: "linear-gradient(135deg, #ff8a65 0%, #ff7043 50%, #f4511e 100%)",
  default: "linear-gradient(135deg, #37474f 0%, #263238 50%, #1a1a2e 100%)",
};

// Cuisine emoji for visual flair on gradient backgrounds
const CUISINE_EMOJIS: Record<string, string> = {
  Indian: "🍛",
  Chinese: "🥡",
  Japanese: "🍣",
  Italian: "🍝",
  Pizza: "🍕",
  Mexican: "🌮",
  Thai: "🍜",
  French: "🥐",
  Mediterranean: "🫒",
  American: "🍔",
  "Fast Food": "🍟",
  Burger: "🍔",
  Sandwich: "🥪",
  Cafe: "☕",
  Coffee: "☕",
  Seafood: "🦐",
  BBQ: "🥩",
  Korean: "🍲",
  Vietnamese: "🍜",
  Greek: "🥗",
  Steakhouse: "🥩",
  Brunch: "🥞",
  default: "🍽️",
};

function getCuisineGradient(cuisineName: string): string {
  if (CUISINE_GRADIENTS[cuisineName]) return CUISINE_GRADIENTS[cuisineName];
  const lower = cuisineName.toLowerCase();
  for (const [key, gradient] of Object.entries(CUISINE_GRADIENTS)) {
    if (
      lower.includes(key.toLowerCase()) ||
      key.toLowerCase().includes(lower)
    ) {
      return gradient;
    }
  }
  return CUISINE_GRADIENTS["default"];
}

function getCuisineEmoji(cuisineName: string): string {
  if (CUISINE_EMOJIS[cuisineName]) return CUISINE_EMOJIS[cuisineName];
  const lower = cuisineName.toLowerCase();
  for (const [key, emoji] of Object.entries(CUISINE_EMOJIS)) {
    if (
      lower.includes(key.toLowerCase()) ||
      key.toLowerCase().includes(lower)
    ) {
      return emoji;
    }
  }
  return CUISINE_EMOJIS["default"];
}

function transformPlace(place: FoursquarePlace): Restaurant {
  const primaryCategory = place.categories?.[0];
  const cuisineName =
    primaryCategory?.short_name || primaryCategory?.name || "Restaurant";

  return {
    id: place.fsq_place_id,
    name: place.name,
    description: getRestaurantDescription(place),
    cuisine: cuisineName,
    image: getCategoryIconUrl(place),
    gradient: getCuisineGradient(cuisineName),
    emoji: getCuisineEmoji(cuisineName),
    address:
      place.location?.formatted_address ||
      place.location?.address ||
      `${place.location?.locality || ""}, ${place.location?.region || ""}`.trim() ||
      "Address not available",
    distance: place.distance,
    rating: place.rating,
    priceLevel: place.price
      ? ["$", "$$", "$$$", "$$$$"][place.price - 1]
      : undefined,
  };
}

function getRestaurantDescription(place: FoursquarePlace): string {
  const parts: string[] = [];

  if (place.categories?.[0]?.name) {
    parts.push(place.categories[0].name);
  }

  if (place.distance) {
    const distanceKm = (place.distance / 1000).toFixed(1);
    parts.push(`${distanceKm}km away`);
  }

  if (place.rating) {
    parts.push(`${place.rating}/10 rating`);
  }

  return parts.join(" • ") || "A local restaurant";
}

// Mock data for development/fallback — instant load, no API dependency
function getMockRestaurants(): Restaurant[] {
  const mockData: Restaurant[] = [
    {
      id: "mock-1",
      name: "The Golden Fork",
      description: "Italian • 0.5km away • 8.5/10 rating",
      cuisine: "Italian",
      image: "https://ss3.4sqi.net/img/categories_v2/food/italian_bg_120.png",
      gradient: CUISINE_GRADIENTS["Italian"],
      emoji: CUISINE_EMOJIS["Italian"],
      address: "123 Main Street",
      distance: 500,
      rating: 8.5,
      priceLevel: "$$",
    },
    {
      id: "mock-2",
      name: "Sakura Sushi",
      description: "Japanese • 0.8km away • 9.0/10 rating",
      cuisine: "Japanese",
      image: "https://ss3.4sqi.net/img/categories_v2/food/sushi_bg_120.png",
      gradient: CUISINE_GRADIENTS["Japanese"],
      emoji: CUISINE_EMOJIS["Japanese"],
      address: "456 Oak Avenue",
      distance: 800,
      rating: 9.0,
      priceLevel: "$$$",
    },
    {
      id: "mock-3",
      name: "Taco Paradise",
      description: "Mexican • 0.3km away • 8.0/10 rating",
      cuisine: "Mexican",
      image: "https://ss3.4sqi.net/img/categories_v2/food/mexican_bg_120.png",
      gradient: CUISINE_GRADIENTS["Mexican"],
      emoji: CUISINE_EMOJIS["Mexican"],
      address: "789 Elm Street",
      distance: 300,
      rating: 8.0,
      priceLevel: "$",
    },
    {
      id: "mock-4",
      name: "Le Petit Bistro",
      description: "French • 1.2km away • 9.2/10 rating",
      cuisine: "French",
      image: "https://ss3.4sqi.net/img/categories_v2/food/french_bg_120.png",
      gradient: CUISINE_GRADIENTS["French"],
      emoji: CUISINE_EMOJIS["French"],
      address: "321 Pine Road",
      distance: 1200,
      rating: 9.2,
      priceLevel: "$$$$",
    },
    {
      id: "mock-5",
      name: "Dragon Palace",
      description: "Chinese • 0.6km away • 8.8/10 rating",
      cuisine: "Chinese",
      image: "https://ss3.4sqi.net/img/categories_v2/food/asian_bg_120.png",
      gradient: CUISINE_GRADIENTS["Chinese"],
      emoji: CUISINE_EMOJIS["Chinese"],
      address: "654 Maple Lane",
      distance: 600,
      rating: 8.8,
      priceLevel: "$$",
    },
    {
      id: "mock-6",
      name: "Spice Garden",
      description: "Indian • 0.9km away • 8.7/10 rating",
      cuisine: "Indian",
      image: "https://ss3.4sqi.net/img/categories_v2/food/indian_bg_120.png",
      gradient: CUISINE_GRADIENTS["Indian"],
      emoji: CUISINE_EMOJIS["Indian"],
      address: "987 Cedar Court",
      distance: 900,
      rating: 8.7,
      priceLevel: "$$",
    },
    {
      id: "mock-7",
      name: "The Burger Joint",
      description: "American • 0.4km away • 7.9/10 rating",
      cuisine: "American",
      image: "https://ss3.4sqi.net/img/categories_v2/food/burger_bg_120.png",
      gradient: CUISINE_GRADIENTS["American"],
      emoji: CUISINE_EMOJIS["American"],
      address: "147 Birch Boulevard",
      distance: 400,
      rating: 7.9,
      priceLevel: "$",
    },
    {
      id: "mock-8",
      name: "Mediterranean Oasis",
      description: "Mediterranean • 1.0km away • 8.6/10 rating",
      cuisine: "Mediterranean",
      image:
        "https://ss3.4sqi.net/img/categories_v2/food/mediterranean_bg_120.png",
      gradient: CUISINE_GRADIENTS["Mediterranean"],
      emoji: CUISINE_EMOJIS["Mediterranean"],
      address: "258 Walnut Way",
      distance: 1000,
      rating: 8.6,
      priceLevel: "$$$",
    },
    {
      id: "mock-9",
      name: "Thai Orchid",
      description: "Thai • 0.7km away • 8.9/10 rating",
      cuisine: "Thai",
      image: "https://ss3.4sqi.net/img/categories_v2/food/thai_bg_120.png",
      gradient: CUISINE_GRADIENTS["Thai"],
      emoji: CUISINE_EMOJIS["Thai"],
      address: "369 Spruce Street",
      distance: 700,
      rating: 8.9,
      priceLevel: "$$",
    },
    {
      id: "mock-10",
      name: "Pasta House",
      description: "Italian • 1.5km away • 8.3/10 rating",
      cuisine: "Italian",
      image: "https://ss3.4sqi.net/img/categories_v2/food/italian_bg_120.png",
      gradient: CUISINE_GRADIENTS["Italian"],
      emoji: CUISINE_EMOJIS["Italian"],
      address: "741 Ash Avenue",
      distance: 1500,
      rating: 8.3,
      priceLevel: "$$",
    },
    {
      id: "mock-11",
      name: "Seoul Kitchen",
      description: "Korean BBQ • 0.4km away • 9.1/10 rating",
      cuisine: "Korean BBQ",
      image: "https://ss3.4sqi.net/img/categories_v2/food/korean_bg_120.png",
      gradient: CUISINE_GRADIENTS["Korean"],
      emoji: CUISINE_EMOJIS["Korean"],
      address: "82 Willow Drive",
      distance: 400,
      rating: 9.1,
      priceLevel: "$$",
    },
    {
      id: "mock-12",
      name: "Ember & Oak",
      description: "Steakhouse • 1.3km away • 9.3/10 rating",
      cuisine: "Steakhouse",
      image:
        "https://ss3.4sqi.net/img/categories_v2/food/steakhouse_bg_120.png",
      gradient: CUISINE_GRADIENTS["Steakhouse"],
      emoji: CUISINE_EMOJIS["Steakhouse"],
      address: "14 Harbour Lane",
      distance: 1300,
      rating: 9.3,
      priceLevel: "$$$$",
    },
    {
      id: "mock-13",
      name: "Brunch & Co.",
      description: "Brunch • 0.2km away • 8.4/10 rating",
      cuisine: "Brunch",
      image: "https://ss3.4sqi.net/img/categories_v2/food/breakfast_bg_120.png",
      gradient: CUISINE_GRADIENTS["Brunch"],
      emoji: CUISINE_EMOJIS["Brunch"],
      address: "5 Morning Circle",
      distance: 200,
      rating: 8.4,
      priceLevel: "$$",
    },
    {
      id: "mock-14",
      name: "Pho Saigon",
      description: "Vietnamese • 0.6km away • 8.8/10 rating",
      cuisine: "Vietnamese",
      image:
        "https://ss3.4sqi.net/img/categories_v2/food/vietnamese_bg_120.png",
      gradient: CUISINE_GRADIENTS["Vietnamese"],
      emoji: CUISINE_EMOJIS["Vietnamese"],
      address: "210 Lotus Road",
      distance: 600,
      rating: 8.8,
      priceLevel: "$",
    },
    {
      id: "mock-15",
      name: "Naan & Curry",
      description: "Indian • 0.5km away • 8.6/10 rating",
      cuisine: "Indian",
      image: "https://ss3.4sqi.net/img/categories_v2/food/indian_bg_120.png",
      gradient: CUISINE_GRADIENTS["Indian"],
      emoji: CUISINE_EMOJIS["Indian"],
      address: "99 Spice Avenue",
      distance: 500,
      rating: 8.6,
      priceLevel: "$$",
    },
    {
      id: "mock-16",
      name: "Trattoria Bella",
      description: "Italian • 0.9km away • 9.0/10 rating",
      cuisine: "Italian",
      image: "https://ss3.4sqi.net/img/categories_v2/food/italian_bg_120.png",
      gradient: CUISINE_GRADIENTS["Italian"],
      emoji: CUISINE_EMOJIS["Italian"],
      address: "77 Vineyard Way",
      distance: 900,
      rating: 9.0,
      priceLevel: "$$$",
    },
    {
      id: "mock-17",
      name: "The Ramen Bar",
      description: "Japanese • 0.3km away • 8.7/10 rating",
      cuisine: "Japanese",
      image: "https://ss3.4sqi.net/img/categories_v2/food/ramen_bg_120.png",
      gradient: CUISINE_GRADIENTS["Japanese"],
      emoji: CUISINE_EMOJIS["Japanese"],
      address: "31 Noodle Street",
      distance: 300,
      rating: 8.7,
      priceLevel: "$",
    },
    {
      id: "mock-18",
      name: "Olive & Vine",
      description: "Greek • 1.1km away • 8.5/10 rating",
      cuisine: "Greek",
      image: "https://ss3.4sqi.net/img/categories_v2/food/greek_bg_120.png",
      gradient: CUISINE_GRADIENTS["Greek"],
      emoji: CUISINE_EMOJIS["Greek"],
      address: "42 Aegean Court",
      distance: 1100,
      rating: 8.5,
      priceLevel: "$$",
    },
    {
      id: "mock-19",
      name: "Café Luna",
      description: "Café • 0.1km away • 8.2/10 rating",
      cuisine: "Café",
      image:
        "https://ss3.4sqi.net/img/categories_v2/food/coffeeshop_bg_120.png",
      gradient: CUISINE_GRADIENTS["Cafe"],
      emoji: CUISINE_EMOJIS["Cafe"],
      address: "1 Moon Lane",
      distance: 100,
      rating: 8.2,
      priceLevel: "$",
    },
    {
      id: "mock-20",
      name: "Tandoor Nights",
      description: "Indian • 0.8km away • 9.4/10 rating",
      cuisine: "Indian",
      image: "https://ss3.4sqi.net/img/categories_v2/food/indian_bg_120.png",
      gradient: CUISINE_GRADIENTS["Indian"],
      emoji: CUISINE_EMOJIS["Indian"],
      address: "66 Fire Lane",
      distance: 800,
      rating: 9.4,
      priceLevel: "$$$",
    },
  ];

  return mockData.slice(0, 15);
}
