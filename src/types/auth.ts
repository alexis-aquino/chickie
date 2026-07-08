export type Role = "owner" | "staff";

export interface UserProfile {
  id: string;
  organizationId: string;
  name: string;
  email: string;
  role: Role;
  avatar: string | null;
  bio: string;
  phone: string;
  theme: "default" | "crimson" | "ocean" | "forest";
  accentColor: string;
  provider: "email";
}

export interface SignUpParams {
  name: string;
  businessName: string;
  email: string;
  password: string;
  role: Role;
  seedDemo: boolean;
}
