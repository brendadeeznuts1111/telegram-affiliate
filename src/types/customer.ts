/**
 * Customer type definitions
 */

export interface Customer {
  customer_id: number;
  user_id: number;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  referred_by: number;
  created_at: number;
  status: 'active' | 'inactive';
}

export interface CreateCustomerInput {
  referred_by: number;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
}

export interface CustomerListItem {
  customer_id: number;
  customer_name: string;
  customer_phone: string;
  created_at: number;
  status: string;
}

