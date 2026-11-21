export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  profileImage: string | null;
  phone: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  rating: number;
  totalReviews: number;
  completedDonations: number;
  totalMealsDonated: number;
  totalMealsReceived: number;
  badges: string[];
}

export interface UserProfileUpdate {
  name?: string;
  phone?: string | null;
  profileImage?: string | null;
}
