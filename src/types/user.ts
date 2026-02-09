export interface FirebaseUser {
  uid: string;
  email: string | undefined; // Changed to string | undefined
  displayName: string | null; // Changed to string | null
  photoURL: string | null;     // Changed to string | null
  emailVerified: boolean;
  disabled: boolean;
  creationTime: string;
  lastSignInTime: string | null;
  customClaims?: { [key: string]: any };
  providerData: Array<{
    uid: string;
    displayName: string | null;
    email: string | null;
    photoURL: string | null;
    providerId: string;
  }>;
  isSuspicious?: boolean; // Add this property
}

export interface UserFilters {
  search: string;
  status: 'all' | 'enabled' | 'disabled';
  emailVerified: 'all' | 'verified' | 'unverified';
  provider: 'all' | 'email' | 'google' | 'facebook';
  admin: 'all' | 'admin' | 'non-admin';
  dateRange: {
    from: Date | null;
    to: Date | null;
  };
  pageSize: number; // Make pageSize a required property
  sortField: keyof FirebaseUser; // Add sortField
  sortDirection: 'asc' | 'desc'; // Add sortDirection
  suspiciousOnly?: 'all' | 'suspicious'; // Change to string literal type
}

export interface BulkAction {
  type: 'enable' | 'disable' | 'delete';
  userIds: string[];
}