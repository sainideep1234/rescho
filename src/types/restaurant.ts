export interface Restaurant {
  id: string;
  name: string;
  description: string;
  cuisine: string;
  image: string;
  gradient?: string;
  emoji?: string;
  address: string;
  distance?: number;
  rating?: number;
  priceLevel?: string;
}
