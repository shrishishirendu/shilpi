/** A person. One row per human, reused across deals. No role here (decision D2). */
export interface Contact {
  id: string;
  agencyId: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  identityVerified: boolean;
  createdAt: string;
}

/** Fields accepted when creating a contact. Name required; the rest optional. */
export interface NewContact {
  fullName: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  notes?: string | null;
}

/** Partial update — only provided fields are written. */
export interface ContactUpdate {
  fullName?: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  notes?: string | null;
}
