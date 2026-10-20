import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3333/api',
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sgpc_access_token') ?? sessionStorage.getItem('sgpc_access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export type ApiUser = {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'operator';
  storeId: string;
};

export type RegisterPayload = {
  cnpj: string;
  legalName: string;
  fantasyName: string;
  ie: string;
  segment: string;
  cep: string;
  address: string;
  number: string;
  city: string;
  state: string;
  name: string;
  phone: string;
  birthDate: string;
  email: string;
  password: string;
  confirmPassword: string;
  terms: boolean;
  privacy: boolean;
};
