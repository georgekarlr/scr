import { supabase } from '../lib/supabase'
import { 
  CreateFeeItemParams, 
  UpdateFeeItemParams,
  FeeItem, 
  ChargeStudentParams, 
  ProcessPaymentParams, 
  LedgerEntry,
  GetTransactionsParams,
  UpdateFeeRecordParams,
  AutoBillTuitionParams,
  AutoBillTuitionResult,
  BatchAutoBillTuitionParams,
  BatchAutoBillTuitionResult,
  ApplyDiscountParams,
  BatchChargeSpecificFeeParams,
  BatchChargeSpecificFeeResult,
  BatchProcessPaymentParams,
  BatchProcessPaymentResult,
  GenerateStudentSOAParams,
  SOAResult
} from '../types/finance'

export const financeService = {
  async createFeeItem(params: CreateFeeItemParams) {
    try {
      const { data, error } = await supabase.rpc('create_fee_item', params)
      if (error) return { data: null, error }
      return { data: data[0] as { id: string; name: string; amount: number }, error: null }
    } catch (err) {
      return { data: null, error: err }
    }
  },

  async getFeeItems(academicYearId: string, category?: string) {
    try {
      const { data, error } = await supabase.rpc('get_fee_items', {
        filter_academic_year_id: academicYearId,
        filter_category: category || null
      })
      if (error) return { data: null, error }
      return { data: data as FeeItem[], error: null }
    } catch (err) {
      return { data: null, error: err }
    }
  },

  async updateFeeItem(params: UpdateFeeItemParams) {
    try {
      const { data, error } = await supabase.rpc('update_fee_item', params)
      if (error) return { data: null, error }
      return { data: data as boolean, error: null }
    } catch (err) {
      return { data: null, error: err }
    }
  },

  async deleteFeeItem(feeItemId: string) {
    try {
      const { data, error } = await supabase.rpc('delete_fee_item', {
        p_fee_item_id: feeItemId
      })
      if (error) return { data: null, error }
      return { data: data as boolean, error: null }
    } catch (err) {
      return { data: null, error: err }
    }
  },

  async chargeStudent(params: ChargeStudentParams) {
    try {
      const { data, error } = await supabase.rpc('charge_student', params)
      if (error) return { data: null, error }
      return { data: data[0]?.id as string, error: null }
    } catch (err) {
      return { data: null, error: err }
    }
  },

  async processPayment(params: ProcessPaymentParams) {
    try {
      const { data, error } = await supabase.rpc('process_payment', params)
      if (error) return { data: null, error }
      return { data: data[0]?.id as string, error: null }
    } catch (err) {
      return { data: null, error: err }
    }
  },

  async generateStudentSOA(params: GenerateStudentSOAParams) {
    try {
      const { data, error } = await supabase.rpc('generate_student_soa', params)
      console.log("datsa", data)
      if (error) return { data: null, error }
      return { data: data as SOAResult, error: null }
    } catch (err) {
      return { data: null, error: err }
    }
  },

  async getTransactions(params: GetTransactionsParams) {
    try {
      const { data, error } = await supabase.rpc('get_transactions', {
        filter_academic_year_id: params.filter_academic_year_id,
        filter_semester: params.filter_semester || null,
        filter_student_id: params.filter_student_id || null,
        filter_type: params.filter_type || null,
        filter_date: params.filter_date || null
      })
      console.log('data get_transactions', data)
      if (error) return { data: null, error }
      return { data: data as LedgerEntry[], error: null }
    } catch (err) {
      return { data: null, error: err }
    }
  },

  async updateFeeRecord(params: UpdateFeeRecordParams) {
    try {
      const { data, error } = await supabase.rpc('update_fee_record', params)
      if (error) return { data: null, error }
      return { data: data as boolean, error: null }
    } catch (err) {
      return { data: null, error: err }
    }
  },

  async deleteFeeRecord(feeId: string) {
    try {
      const { data, error } = await supabase.rpc('delete_fee_record', {
        p_fee_id: feeId
      })
      if (error) return { data: null, error }
      return { data: data as boolean, error: null }
    } catch (err) {
      return { data: null, error: err }
    }
  },

  async autoBillTuition(params: AutoBillTuitionParams) {
    try {
      const { data, error } = await supabase.rpc('auto_bill_tuition', params)
      if (error) return { data: null, error }
      return { data: data[0] as AutoBillTuitionResult, error: null }
    } catch (err) {
      return { data: null, error: err }
    }
  },

  async batchAutoBillTuition(params: BatchAutoBillTuitionParams) {
    try {
      const { data, error } = await supabase.rpc('batch_auto_bill_tuition', params)
      if (error) return { data: null, error }
      return { data: data[0] as BatchAutoBillTuitionResult, error: null }
    } catch (err) {
      return { data: null, error: err }
    }
  },

  async applyDiscount(params: ApplyDiscountParams) {
    try {
      const { data, error } = await supabase.rpc('apply_discount', params)
      if (error) return { data: null, error }
      return { data: data[0]?.id as string, error: null }
    } catch (err) {
      return { data: null, error: err }
    }
  },

  async batchChargeSpecificFee(params: BatchChargeSpecificFeeParams) {
    try {
      const { data, error } = await supabase.rpc('batch_charge_specific_fee', params)
      if (error) return { data: null, error }
      return { data: data[0] as BatchChargeSpecificFeeResult, error: null }
    } catch (err) {
      return { data: null, error: err }
    }
  },

  async batchProcessPayment(params: BatchProcessPaymentParams) {
    try {
      const { data, error } = await supabase.rpc('batch_process_payment', params)
      if (error) return { data: null, error }
      return { data: data[0] as BatchProcessPaymentResult, error: null }
    } catch (err) {
      return { data: null, error: err }
    }
  },

}
