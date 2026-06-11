export type FeeCategory = 'tuition' | 'miscellaneous' | 'laboratory' | 'other';

export interface FeeItem {
  id: string;
  name: string;
  category: FeeCategory;
  amount: number;
  applicable_to_year_level: string | null;
  applicable_to_subject: string | null;
  subject_code: string | null;
  subject_name: string | null;
}

export interface CreateFeeItemParams {
  p_name: string;
  p_category: FeeCategory;
  p_amount: number;
  p_academic_year_id: string;
  p_applicable_to_year_level?: string | null;
  p_applicable_to_subject?: string | null;
}

export interface UpdateFeeItemParams {
  p_fee_item_id: string;
  p_name: string;
  p_category: FeeCategory;
  p_amount: number;
  p_applicable_to_year_level?: string | null;
  p_applicable_to_subject?: string | null;
}

export interface ChargeStudentParams {
  p_student_id: string;
  p_amount: number;
  p_description: string;
  p_academic_year_id: string;
  p_fee_item_id?: string | null;
}

export interface ProcessPaymentParams {
  p_student_id: string;
  p_amount: number;
  p_description: string;
  p_academic_year_id: string;
}

export interface LedgerEntry {
  id: string;
  created_at: string;
  transaction_type: TransactionType;
  description: string;
  amount: number;
  cashier_name: string | null;
  student_id?: string;
  student_first_name?: string;
  student_last_name?: string;
}

export interface GetTransactionsParams {
  filter_academic_year_id: string;
  filter_student_id?: string | null;
  filter_type?: TransactionType | null;
  filter_date?: string | null;
}

export interface UpdateFeeRecordParams {
  p_fee_id: string;
  p_amount: number;
  p_description: string;
}

export interface AutoBillTuitionParams {
  p_student_id: string;
  p_academic_year_id: string;
  p_semester: string;
}

export interface AutoBillTuitionResult {
  total_units: number;
  tuition_rate: number;
  total_charged: number;
}

export interface BatchAutoBillTuitionParams {
  p_academic_year_id: string;
  p_semester: string;
}

export interface BatchAutoBillTuitionResult {
  students_billed: number;
  total_revenue_generated: number;
}

export interface ApplyDiscountParams {
  p_student_id: string;
  p_amount: number;
  p_description: string;
  p_academic_year_id: string;
}

export interface BatchChargeSpecificFeeParams {
  p_fee_item_id: string;
  p_academic_year_id: string;
  p_semester: string;
  p_filter_course_id?: string | null;
  p_filter_year_level?: string | null;
  p_filter_subject_id?: string | null;
  p_filter_student_type?: string | null;
}

export interface BatchChargeSpecificFeeResult {
  students_billed: number;
  total_revenue_generated: number;
}

export interface GenerateStudentSOAParams {
  p_student_id: string;
  p_academic_year_id: string;
  p_semester: string;
}

export interface SOAResult {
  student: {
    student_id_number: string;
    full_name: string;
    year_level: string;
    course_code: string;
    semester: string;
  };
  transactions: {
    date: string;
    type: TransactionType;
    description: string;
    amount: number;
    cashier: string | null;
  }[];
  summary: {
    total_charges: number;
    total_discounts: number;
    total_payments: number;
    remaining_balance: number;
    active_grading_period: string;
    amount_due_now: number;
  };
}

export interface FinanceFilters {
  filter_academic_year_id: string;
}

export type TransactionType = 'charge' | 'payment' | 'discount';
