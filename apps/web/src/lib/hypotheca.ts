export interface EncumbranceClaim {
  claimId: string;
  token: string;
  obligor: string;
  claimant: string;
  amount: string;
  status: 'active' | 'released' | 'defaulted';
  createdAt: string;
  updatedAt: string;
}

export interface EncumbranceBalance {
  token: string;
  totalBalance: string;
  totalHeld: string;
  availableBalance: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {})
    },
    ...init
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Hypotheca request failed');
  }

  return response.json() as Promise<T>;
}

export async function fetchAvailableBalance(token: string): Promise<EncumbranceBalance> {
  return request<EncumbranceBalance>(`/api/assets/${encodeURIComponent(token)}/available-balance`);
}

export async function fetchClaims(token: string): Promise<{ claims: EncumbranceClaim[] }> {
  return request<{ claims: EncumbranceClaim[] }>(`/api/assets/${encodeURIComponent(token)}/claims`);
}

export async function createEncumbrance(payload: {
  token: string;
  obligor: string;
  claimant: string;
  amount: string | number;
}): Promise<{ message: string; claim: EncumbranceClaim }> {
  return request<{ message: string; claim: EncumbranceClaim }>('/api/encumbrances', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}
