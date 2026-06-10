import React, { useEffect, useState } from 'react';
import { ReceiptText, Search, CreditCard, Plus, Calendar, User, History, Wallet, Edit2, Trash2, Filter, X } from 'lucide-react';
import { financeService } from '../../../services/financeService';
import { academicYearService } from '../../../services/academicYearService';
import { studentService } from '../../../services/studentService';
import { courseService } from '../../../services/courseService';
import { subjectService } from '../../../services/subjectService';
import { useAuth } from '../../../contexts/AuthContext';
import { LedgerEntry, TransactionType, FeeItem } from '../../../types/finance';
import { AcademicYear } from '../../../types/academicYear';
import { Student } from '../../../types/student';
import ErrorModal from '../../../components/ui/ErrorModal';

const Ledger: React.FC = () => {
  const { profile, user } = useAuth();
  const role = profile?.role || user?.user_metadata?.role;
  const isSuperAdmin = role === 'super_admin';

  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedAY, setSelectedAY] = useState<string>('');
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [balance, setBalance] = useState<number>(0);
  const [feeItems, setFeeItems] = useState<FeeItem[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [error, setError] = useState('');
  const [studentSearch, setStudentSearch] = useState('');

  const [filterType, setFilterType] = useState<TransactionType | ''>('');
  const [filterDate, setFilterDate] = useState<string>('');

  const [isChargeModalOpen, setIsChargeModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [selectedEntry, setSelectedEntry] = useState<LedgerEntry | null>(null);
  const [isAutoBillModalOpen, setIsAutoBillModalOpen] = useState(false);
  const [autoBillSemester, setAutoBillSemester] = useState('1st Semester');
  const [autoBillResult, setAutoBillResult] = useState<any>(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  const [isBatchAutoBillModalOpen, setIsBatchAutoBillModalOpen] = useState(false);
  const [batchAutoBillSemester, setBatchAutoBillSemester] = useState('1st Semester');
  const [batchAutoBillResult, setBatchAutoBillResult] = useState<any>(null);
  const [isBatchSuccessModalOpen, setIsBatchSuccessModalOpen] = useState(false);

  const [isBatchChargeModalOpen, setIsBatchChargeModalOpen] = useState(false);
  const [batchChargeData, setBatchChargeData] = useState({
    p_fee_item_id: '',
    p_semester: '1st Semester',
    p_filter_course_id: '',
    p_filter_year_level: '',
    p_filter_subject_id: '',
    p_filter_student_type: ''
  });
  const [courses, setCourses] = useState<any[]>([]);
  const [subjectsList, setSubjectsList] = useState<any[]>([]);

  const [chargeData, setChargeData] = useState({
    p_amount: 0,
    p_description: '',
    p_fee_item_id: ''
  });

  const [paymentData, setPaymentData] = useState({
    p_amount: 0,
    p_description: ''
  });

  const [discountData, setDiscountData] = useState({
    p_amount: 0,
    p_description: ''
  });

  const [editData, setEditData] = useState({
    p_amount: 0,
    p_description: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: ayData, error: ayError } = await academicYearService.getAcademicYears();
      if (ayError) throw ayError;
      if (ayData) {
        setAcademicYears(ayData);
        const activeAY = ayData.find(ay => ay.is_active);
        let currentAY = '';
        if (activeAY) currentAY = activeAY.id;
        else if (ayData.length > 0) currentAY = ayData[0].id;

        if (currentAY) {
          setSelectedAY(currentAY);
          fetchFeeItems(currentAY);
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    const { data, error } = await studentService.getStudentsList({ search_term: studentSearch });
    if (error) setError(error.message);
    else if (data) setStudents(data);
  };

  const fetchLedger = async (studentId: string, ayId: string) => {
    setLedgerLoading(true);
    try {
      const [ledgerRes, balanceRes] = await Promise.all([
        financeService.getTransactions({
          filter_academic_year_id: ayId,
          filter_student_id: studentId,
          filter_type: filterType || null,
          filter_date: filterDate || null
        }),
        financeService.getStudentBalance(studentId, ayId)
      ]);

      if (ledgerRes.error) throw ledgerRes.error;
      if (balanceRes.error) throw balanceRes.error;

      setLedger(ledgerRes.data || []);
      setBalance(balanceRes.data || 0);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLedgerLoading(false);
    }
  };

  const fetchFeeItems = async (ayId: string) => {
    const { data, error } = await financeService.getFeeItems(ayId);
    if (error) setError(error.message);
    else if (data) setFeeItems(data);
  };

  const fetchFilters = async () => {
    const [coursesRes, subjectsRes] = await Promise.all([
      courseService.getCourses(),
      subjectService.getSubjects()
    ]);
    if (coursesRes.data) setCourses(coursesRes.data);
    if (subjectsRes.data) setSubjectsList(subjectsRes.data);
  };

  useEffect(() => {
    fetchData();
    fetchFilters();
  }, []);

  useEffect(() => {
    const timer = setTimeout(fetchStudents, 300);
    return () => clearTimeout(timer);
  }, [studentSearch]);

  useEffect(() => {
    if (selectedAY) {
      fetchFeeItems(selectedAY);
    }
    if (selectedStudent && selectedAY) {
      fetchLedger(selectedStudent.student_id, selectedAY);
    }
  }, [selectedAY, filterType, filterDate]);

  const handleSelectStudent = (student: Student) => {
    setSelectedStudent(student);
    if (selectedAY) {
      fetchLedger(student.student_id, selectedAY);
      fetchFeeItems(selectedAY);
    }
  };

  const handleChargeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !selectedAY) return;
    setSubmitting(true);
    const { error } = await financeService.chargeStudent({
      p_student_id: selectedStudent.student_id,
      p_academic_year_id: selectedAY,
      p_amount: chargeData.p_amount,
      p_description: chargeData.p_description,
      p_fee_item_id: chargeData.p_fee_item_id || null
    });
    if (error) setError(error.message);
    else {
      setIsChargeModalOpen(false);
      fetchLedger(selectedStudent.student_id, selectedAY);
    }
    setSubmitting(false);
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !selectedAY) return;
    setSubmitting(true);
    const { error } = await financeService.processPayment({
      p_student_id: selectedStudent.student_id,
      p_academic_year_id: selectedAY,
      p_amount: paymentData.p_amount,
      p_description: paymentData.p_description
    });
    if (error) setError(error.message);
    else {
      setIsPaymentModalOpen(false);
      fetchLedger(selectedStudent.student_id, selectedAY);
    }
    setSubmitting(false);
  };

  const handleDiscountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !selectedAY) return;
    setSubmitting(true);
    const { error } = await financeService.applyDiscount({
      p_student_id: selectedStudent.student_id,
      p_academic_year_id: selectedAY,
      p_amount: discountData.p_amount,
      p_description: discountData.p_description
    });
    if (error) setError(error.message);
    else {
      setIsDiscountModalOpen(false);
      fetchLedger(selectedStudent.student_id, selectedAY);
    }
    setSubmitting(false);
  };

  const handleEditOpen = (entry: LedgerEntry) => {
    setSelectedEntry(entry);
    setEditData({
      p_amount: entry.amount,
      p_description: entry.description
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEntry || !selectedStudent || !selectedAY) return;
    setSubmitting(true);
    const { error } = await financeService.updateFeeRecord({
      p_fee_id: selectedEntry.id,
      p_amount: editData.p_amount,
      p_description: editData.p_description
    });
    if (error) setError(error.message);
    else {
      setIsEditModalOpen(false);
      fetchLedger(selectedStudent.student_id, selectedAY);
    }
    setSubmitting(false);
  };

  const handleDeleteRecord = async (feeId: string) => {
    if (!window.confirm('CRITICAL: Are you sure you want to DELETE this financial record? This action is permanent and should only be used to fix errors.')) return;
    if (!selectedStudent || !selectedAY) return;
    
    const { error } = await financeService.deleteFeeRecord(feeId);
    if (error) setError(error.message);
    else {
      fetchLedger(selectedStudent.student_id, selectedAY);
    }
  };

  const handleAutoBillSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !selectedAY) return;
    setSubmitting(true);
    const { data, error } = await financeService.autoBillTuition({
      p_student_id: selectedStudent.student_id,
      p_academic_year_id: selectedAY,
      p_semester: autoBillSemester
    });
    
    if (error) setError(error.message);
    else if (data) {
      setAutoBillResult(data);
      setIsAutoBillModalOpen(false);
      setIsSuccessModalOpen(true);
      fetchLedger(selectedStudent.student_id, selectedAY);
    }
    setSubmitting(false);
  };

  const handleBatchAutoBillSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAY) return;
    setSubmitting(true);
    const { data, error } = await financeService.batchAutoBillTuition({
      p_academic_year_id: selectedAY,
      p_semester: batchAutoBillSemester
    });
    
    if (error) setError(error.message);
    else if (data) {
      setBatchAutoBillResult(data);
      setIsBatchAutoBillModalOpen(false);
      setIsBatchSuccessModalOpen(true);
      if (selectedStudent) {
        fetchLedger(selectedStudent.student_id, selectedAY);
      }
    }
    setSubmitting(false);
  };

  const handleBatchChargeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAY || !batchChargeData.p_fee_item_id) return;
    setSubmitting(true);
    const { data, error } = await financeService.batchChargeSpecificFee({
      p_fee_item_id: batchChargeData.p_fee_item_id,
      p_academic_year_id: selectedAY,
      p_semester: batchChargeData.p_semester,
      p_filter_course_id: batchChargeData.p_filter_course_id || null,
      p_filter_year_level: batchChargeData.p_filter_year_level || null,
      p_filter_subject_id: batchChargeData.p_filter_subject_id || null,
      p_filter_student_type: batchChargeData.p_filter_student_type || null
    });
    
    if (error) setError(error.message);
    else if (data) {
      setBatchAutoBillResult(data); // Reusing the same success state/type for consistency
      setIsBatchChargeModalOpen(false);
      setIsBatchSuccessModalOpen(true);
      if (selectedStudent) {
        fetchLedger(selectedStudent.student_id, selectedAY);
      }
    }
    setSubmitting(false);
  };

  const onFeeItemChange = (itemId: string) => {
    const item = feeItems.find(fi => fi.id === itemId);
    if (item) {
      setChargeData({
        ...chargeData,
        p_fee_item_id: itemId,
        p_amount: item.amount,
        p_description: item.name
      });
    } else {
      setChargeData({
        ...chargeData,
        p_fee_item_id: '',
        p_amount: 0,
        p_description: ''
      });
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ReceiptText className="w-8 h-8 text-blue-600" />
          Student Ledger & Payments
        </h1>
        {(role === 'super_admin' || role === 'cashier') && (
          <div className="flex gap-2">
            <button
              onClick={() => setIsBatchChargeModalOpen(true)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition-colors flex items-center gap-2"
            >
              <Plus size={18} />
              Batch Charge Fee
            </button>
            <button
              onClick={() => setIsBatchAutoBillModalOpen(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <History size={18} />
              Batch Auto-Bill
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Student Search & Selection */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-5 h-5 text-gray-500" />
            <h2 className="text-lg font-semibold">Select Student</h2>
          </div>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search student..."
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {students.map((student) => (
              <button
                key={student.student_id}
                onClick={() => handleSelectStudent(student)}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  selectedStudent?.student_id === student.student_id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-100 hover:border-blue-200 hover:bg-gray-50'
                }`}
              >
                <div className="font-semibold text-gray-900">
                  {student.last_name}, {student.first_name}
                </div>
                <div className="text-xs text-gray-500">
                  {student.student_id_number} • {student.year_level} • {student.course_code}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Ledger Details */}
        <div className="lg:col-span-2 space-y-6">
          {!selectedStudent ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center text-gray-500">
              <User className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>Please select a student to view their ledger and process transactions.</p>
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-500">Current Balance</span>
                    <Wallet className="w-5 h-5 text-blue-500" />
                  </div>
                  <div className={`text-2xl font-bold ${balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    ₱{balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Outstanding amount for the selected year</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex flex-col justify-center">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsChargeModalOpen(true)}
                      className="flex-1 bg-red-50 text-red-600 px-4 py-2 rounded-lg font-semibold hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                    >
                      <Plus size={18} /> Charge
                    </button>
                    <button
                      onClick={() => setIsPaymentModalOpen(true)}
                      className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <CreditCard size={18} /> Payment
                    </button>
                    <button
                      onClick={() => setIsDiscountModalOpen(true)}
                      className="flex-1 bg-indigo-50 text-indigo-600 px-4 py-2 rounded-lg font-semibold hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2"
                    >
                      <Plus size={18} /> Discount
                    </button>
                  </div>
                  <button
                    onClick={() => setIsAutoBillModalOpen(true)}
                    className="mt-2 w-full bg-blue-50 text-blue-600 px-4 py-2 rounded-lg font-semibold hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"
                  >
                    <History size={18} /> Auto-Bill Tuition
                  </button>
                </div>
              </div>

              {/* Ledger Table */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                  <div className="flex items-center gap-2 font-semibold">
                    <History className="w-5 h-5 text-gray-500" />
                    Transaction History
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => selectedStudent && fetchLedger(selectedStudent.student_id, selectedAY)}
                      className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                      title="Refresh Ledger"
                    >
                      <History size={18} className={ledgerLoading ? 'animate-spin' : ''} />
                    </button>
                    <select
                      value={selectedAY}
                      onChange={(e) => setSelectedAY(e.target.value)}
                      className="text-sm border-gray-300 rounded-md focus:ring-blue-500"
                    >
                      {academicYears.map(ay => (
                        <option key={ay.id} value={ay.id}>{ay.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="p-4 bg-white border-b border-gray-100 flex flex-wrap gap-4 items-center">
                  <div className="flex items-center gap-2">
                    <Filter size={16} className="text-gray-400" />
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value as TransactionType | '')}
                      className="text-xs border-gray-300 rounded-md focus:ring-blue-500"
                    >
                      <option value="">All Types</option>
                      <option value="charge">Charges</option>
                      <option value="payment">Payments</option>
                      <option value="discount">Discounts</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-gray-400" />
                    <input
                      type="date"
                      value={filterDate}
                      onChange={(e) => setFilterDate(e.target.value)}
                      className="text-xs border-gray-300 rounded-md focus:ring-blue-500"
                    />
                    {filterDate && (
                      <button 
                        onClick={() => setFilterDate('')}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                        {isSuperAdmin && <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {ledgerLoading ? (
                        <tr><td colSpan={4} className="px-6 py-4 text-center">Loading...</td></tr>
                      ) : ledger.length === 0 ? (
                        <tr><td colSpan={4} className="px-6 py-10 text-center text-gray-500">No transactions found.</td></tr>
                      ) : (
                        ledger.map((entry) => (
                          <tr key={entry.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(entry.created_at).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {entry.description}
                              {entry.cashier_name && (
                                <div className="text-[10px] text-gray-400 uppercase">By {entry.cashier_name}</div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                entry.transaction_type === 'charge' ? 'bg-red-100 text-red-800' : 
                                entry.transaction_type === 'payment' ? 'bg-green-100 text-green-800' :
                                'bg-indigo-100 text-indigo-800'
                              }`}>
                                {entry.transaction_type}
                              </span>
                            </td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-bold ${
                              entry.transaction_type === 'charge' ? 'text-red-600' : 
                              entry.transaction_type === 'payment' ? 'text-green-600' :
                              'text-indigo-600'
                            }`}>
                              {entry.transaction_type === 'charge' ? '+' : '-'} ₱{entry.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                            {isSuperAdmin && (
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex justify-end gap-2">
                                  <button 
                                    onClick={() => handleEditOpen(entry)}
                                    className="text-blue-600 hover:text-blue-900" 
                                    title="Edit Record"
                                  >
                                    <Edit2 size={16} />
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteRecord(entry.id)}
                                    className="text-red-600 hover:text-red-900" 
                                    title="Delete Record"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </td>
                            )}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Charge Modal */}
      {isChargeModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-semibold text-gray-900">Add Charge</h3>
              <button onClick={() => setIsChargeModalOpen(false)} className="text-gray-400 hover:text-gray-500">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleChargeSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Fee Item (Optional)</label>
                <select
                  value={chargeData.p_fee_item_id}
                  onChange={(e) => onFeeItemChange(e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500"
                >
                  <option value="">Manual Entry / Custom Charge</option>
                  {feeItems.map(item => (
                    <option key={item.id} value={item.id}>{item.name} (₱{item.amount})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <input
                  type="text"
                  required
                  value={chargeData.p_description}
                  onChange={(e) => setChargeData({ ...chargeData, p_description: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Amount (₱)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={chargeData.p_amount}
                  onChange={(e) => setChargeData({ ...chargeData, p_amount: parseFloat(e.target.value) })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setIsChargeModalOpen(false)} className="px-4 py-2 border rounded-md">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-red-600 text-white rounded-md disabled:opacity-50">
                  {submitting ? 'Processing...' : 'Add Charge'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-semibold text-gray-900">Process Payment</h3>
              <button onClick={() => setIsPaymentModalOpen(false)} className="text-gray-400 hover:text-gray-500">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handlePaymentSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Amount (₱)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  max={balance > 0 ? balance : undefined}
                  value={paymentData.p_amount}
                  onChange={(e) => setPaymentData({ ...paymentData, p_amount: parseFloat(e.target.value) })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description / Reference</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cash Receipt #1234"
                  value={paymentData.p_description}
                  onChange={(e) => setPaymentData({ ...paymentData, p_description: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setIsPaymentModalOpen(false)} className="px-4 py-2 border rounded-md">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-green-600 text-white rounded-md disabled:opacity-50">
                  {submitting ? 'Processing...' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Discount Modal */}
      {isDiscountModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-semibold text-gray-900">Apply Discount / Scholarship</h3>
              <button onClick={() => setIsDiscountModalOpen(false)} className="text-gray-400 hover:text-gray-500">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleDiscountSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Academic Scholarship (100%)"
                  value={discountData.p_description}
                  onChange={(e) => setDiscountData({ ...discountData, p_description: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Amount (₱)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={discountData.p_amount}
                  onChange={(e) => setDiscountData({ ...discountData, p_amount: parseFloat(e.target.value) })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setIsDiscountModalOpen(false)} className="px-4 py-2 border rounded-md">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-indigo-600 text-white rounded-md disabled:opacity-50">
                  {submitting ? 'Applying...' : 'Apply Discount'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Record Modal (Super Admin Only) */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-semibold text-gray-900">Edit Financial Record</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-500">
                <X size={24} />
              </button>
            </div>
            <div className="p-4 bg-amber-50 border-b border-amber-100 text-amber-800 text-xs">
              <strong>WARNING:</strong> You are modifying a historical financial record. Ensure this change is documented and authorized.
            </div>
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Amount (₱)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={editData.p_amount}
                  onChange={(e) => setEditData({ ...editData, p_amount: parseFloat(e.target.value) })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <input
                  type="text"
                  required
                  value={editData.p_description}
                  onChange={(e) => setEditData({ ...editData, p_description: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 border rounded-md">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50">
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Auto-Bill Tuition Modal */}
      {isAutoBillModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-semibold text-gray-900">Auto-Bill Tuition</h3>
              <button onClick={() => setIsAutoBillModalOpen(false)} className="text-gray-400 hover:text-gray-500">
                <X size={24} />
              </button>
            </div>
            <div className="p-4 bg-blue-50 border-b border-blue-100 text-blue-800 text-xs">
              This will automatically calculate and charge tuition based on enrolled units for the selected semester.
            </div>
            <form onSubmit={handleAutoBillSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Semester</label>
                <select
                  required
                  value={autoBillSemester}
                  onChange={(e) => setAutoBillSemester(e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500"
                >
                  <option value="1st Semester">1st Semester</option>
                  <option value="2nd Semester">2nd Semester</option>
                  <option value="Summer">Summer</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setIsAutoBillModalOpen(false)} className="px-4 py-2 border rounded-md">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50">
                  {submitting ? 'Processing...' : 'Run Auto-Billing'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {isSuccessModalOpen && autoBillResult && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                <CreditCard size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Auto-Billing Successful</h3>
              <p className="text-gray-600 mb-6">Tuition has been successfully calculated and charged to the student's ledger.</p>
              
              <div className="w-full bg-gray-50 rounded-lg p-4 space-y-2 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Total Units:</span>
                  <span className="font-semibold text-gray-900">{autoBillResult.total_units} units</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Rate per Unit:</span>
                  <span className="font-semibold text-gray-900">₱{autoBillResult.tuition_rate.toLocaleString()}</span>
                </div>
                <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-lg">
                  <span className="text-gray-900">Total Charged:</span>
                  <span className="text-blue-600">₱{autoBillResult.total_charged.toLocaleString()}</span>
                </div>
              </div>

              <button
                onClick={() => setIsSuccessModalOpen(false)}
                className="w-full py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batch Charge Specific Fee Modal */}
      {isBatchChargeModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-semibold text-gray-900">Batch Charge Specific Fee</h3>
              <button onClick={() => setIsBatchChargeModalOpen(false)} className="text-gray-400 hover:text-gray-500">
                <X size={24} />
              </button>
            </div>
            <div className="p-4 bg-indigo-50 border-b border-indigo-100 text-indigo-800 text-xs text-center">
              Apply a specific fee to a filtered group of students in bulk.
            </div>
            <form onSubmit={handleBatchChargeSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Fee Item</label>
                  <select
                    required
                    value={batchChargeData.p_fee_item_id}
                    onChange={(e) => setBatchChargeData({ ...batchChargeData, p_fee_item_id: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500"
                  >
                    <option value="">Select Fee Item</option>
                    {feeItems.map(fi => (
                      <option key={fi.id} value={fi.id}>{fi.name} (₱{fi.amount.toLocaleString()})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Semester</label>
                  <select
                    required
                    value={batchChargeData.p_semester}
                    onChange={(e) => setBatchChargeData({ ...batchChargeData, p_semester: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500"
                  >
                    <option value="1st Semester">1st Semester</option>
                    <option value="2nd Semester">2nd Semester</option>
                    <option value="Summer">Summer</option>
                  </select>
                </div>
              </div>

              <div className="border-t pt-4 mt-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Filters (Optional)</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Course</label>
                    <select
                      value={batchChargeData.p_filter_course_id}
                      onChange={(e) => setBatchChargeData({ ...batchChargeData, p_filter_course_id: e.target.value })}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500"
                    >
                      <option value="">All Courses</option>
                      {courses.map(c => (
                        <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Year Level</label>
                    <select
                      value={batchChargeData.p_filter_year_level}
                      onChange={(e) => setBatchChargeData({ ...batchChargeData, p_filter_year_level: e.target.value })}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500"
                    >
                      <option value="">All Year Levels</option>
                      <option value="1st Year">1st Year</option>
                      <option value="2nd Year">2nd Year</option>
                      <option value="3rd Year">3rd Year</option>
                      <option value="4th Year">4th Year</option>
                      <option value="5th Year">5th Year</option>
                      <option value="Grade 7">Grade 7</option>
                      <option value="Grade 8">Grade 8</option>
                      <option value="Grade 9">Grade 9</option>
                      <option value="Grade 10">Grade 10</option>
                      <option value="Grade 11">Grade 11</option>
                      <option value="Grade 12">Grade 12</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Subject</label>
                    <select
                      value={batchChargeData.p_filter_subject_id}
                      onChange={(e) => setBatchChargeData({ ...batchChargeData, p_filter_subject_id: e.target.value })}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500"
                    >
                      <option value="">All Subjects</option>
                      {subjectsList.map(s => (
                        <option key={s.id} value={s.id}>{s.code} - {s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Student Type</label>
                    <select
                      value={batchChargeData.p_filter_student_type}
                      onChange={(e) => setBatchChargeData({ ...batchChargeData, p_filter_student_type: e.target.value })}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500"
                    >
                      <option value="">All Types</option>
                      <option value="regular">Regular</option>
                      <option value="irregular">Irregular</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setIsBatchChargeModalOpen(false)} className="px-4 py-2 border rounded-md">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-indigo-600 text-white rounded-md disabled:opacity-50">
                  {submitting ? 'Processing Batch...' : 'Apply Batch Charge'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Batch Auto-Bill Tuition Modal */}
      {isBatchAutoBillModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-semibold text-gray-900">Batch Auto-Bill Tuition</h3>
              <button onClick={() => setIsBatchAutoBillModalOpen(false)} className="text-gray-400 hover:text-gray-500">
                <X size={24} />
              </button>
            </div>
            <div className="p-4 bg-blue-50 border-b border-blue-100 text-blue-800 text-xs text-center">
              This will automatically bill ALL enrolled students who haven't been charged for the selected semester yet.
            </div>
            <form onSubmit={handleBatchAutoBillSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Academic Year</label>
                <select
                  disabled
                  value={selectedAY}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 bg-gray-50"
                >
                  {academicYears.map(ay => (
                    <option key={ay.id} value={ay.id}>{ay.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Semester</label>
                <select
                  required
                  value={batchAutoBillSemester}
                  onChange={(e) => setBatchAutoBillSemester(e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500"
                >
                  <option value="1st Semester">1st Semester</option>
                  <option value="2nd Semester">2nd Semester</option>
                  <option value="Summer">Summer</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setIsBatchAutoBillModalOpen(false)} className="px-4 py-2 border rounded-md">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50">
                  {submitting ? 'Processing Batch...' : 'Run Batch Billing'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Batch Success Modal */}
      {isBatchSuccessModalOpen && batchAutoBillResult && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
                <History size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Batch Billing Complete</h3>
              <p className="text-gray-600 mb-6">The automated billing process has finished successfully.</p>
              
              <div className="w-full bg-gray-50 rounded-lg p-4 space-y-2 mb-6 text-left">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Students Billed:</span>
                  <span className="font-semibold text-gray-900">{batchAutoBillResult.students_billed}</span>
                </div>
                <div className="flex justify-between text-sm border-t border-gray-200 pt-2">
                  <span className="text-gray-500">Total Revenue Generated:</span>
                  <span className="font-bold text-blue-600">₱{batchAutoBillResult.total_revenue_generated.toLocaleString()}</span>
                </div>
              </div>

              <button
                onClick={() => setIsBatchSuccessModalOpen(false)}
                className="w-full py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {error && <ErrorModal message={error} onClose={() => setError('')} />}
    </div>
  );
};

export default Ledger;
