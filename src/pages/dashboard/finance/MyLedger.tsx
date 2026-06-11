import React, { useEffect, useState } from 'react';
import { ReceiptText, Calendar, Wallet, History, AlertCircle } from 'lucide-react';
import { financeService } from '../../../services/financeService';
import { academicYearService } from '../../../services/academicYearService';
import { useAuth } from '../../../contexts/AuthContext';
import { SOAResult } from '../../../types/finance';
import { AcademicYear } from '../../../types/academicYear';
import ErrorModal from '../../../components/ui/ErrorModal';

const MyLedger: React.FC = () => {
  const { user } = useAuth();
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [selectedAY, setSelectedAY] = useState<string>('');
  const [selectedSemester, setSelectedSemester] = useState<string>('1st Semester');
  const [soaData, setSoaData] = useState<SOAResult | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: ayData, error: ayError } = await academicYearService.getAcademicYears();
      if (ayError) throw ayError;
      if (ayData) {
        setAcademicYears(ayData);
        const activeAY = ayData.find(ay => ay.is_active);
        if (activeAY) setSelectedAY(activeAY.id);
        else if (ayData.length > 0) setSelectedAY(ayData[0].id);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchLedger = async (ayId: string) => {
    if (!user?.id) return;
    setLedgerLoading(true);
    try {
      const { data, error } = await financeService.generateStudentSOA({
        p_student_id: user.id,
        p_academic_year_id: ayId,
        p_semester: selectedSemester
      });

      if (error) throw error;
      setSoaData(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLedgerLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedAY && user?.id) {
      fetchLedger(selectedAY);
    }
  }, [selectedAY, selectedSemester, user?.id]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ReceiptText className="w-8 h-8 text-blue-600" />
            My Statement of Account
          </h1>
          <p className="text-gray-600">View your transaction history and outstanding balance.</p>
        </div>
        
        <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-gray-200 shadow-sm">
          <Calendar size={18} className="text-gray-400" />
          <select
            value={selectedAY}
            onChange={(e) => setSelectedAY(e.target.value)}
            className="text-sm border-none focus:ring-0 bg-transparent"
          >
            {academicYears.map(ay => (
              <option key={ay.id} value={ay.id}>{ay.name} {ay.is_active ? '(Current)' : ''}</option>
            ))}
          </select>
          <div className="w-px h-4 bg-gray-200 mx-1"></div>
          <select
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
            className="text-sm border-none focus:ring-0 bg-transparent"
          >
            <option value="1st Semester">1st Semester</option>
            <option value="2nd Semester">2nd Semester</option>
            <option value="Summer">Summer</option>
          </select>
        </div>
      </div>

      {/* Summary Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-4">
            <div className={`p-4 rounded-full flex-shrink-0 ${(soaData?.summary.remaining_balance || 0) > 0 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
              <Wallet size={32} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wider truncate">Remaining Balance</p>
              <h2 className={`text-2xl font-black truncate ${(soaData?.summary.remaining_balance || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                ₱{(soaData?.summary.remaining_balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </h2>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-4">
            <div className={`p-4 rounded-full flex-shrink-0 ${soaData?.summary.amount_due_now && soaData.summary.amount_due_now > 0 ? 'bg-orange-50 text-orange-600' : 'bg-green-50 text-green-600'}`}>
              <Calendar size={32} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wider truncate">Amount Due Now</p>
              <h2 className={`text-2xl font-black truncate ${soaData?.summary.amount_due_now && soaData.summary.amount_due_now > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                ₱{(soaData?.summary.amount_due_now || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </h2>
              <p className="text-[10px] text-gray-400 uppercase mt-1 truncate">
                {soaData?.summary.active_grading_period ? `Period: ${soaData.summary.active_grading_period}` : 'No active period'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-6 rounded-xl shadow-md text-white sm:col-span-2 lg:col-span-1">
          <h3 className="text-lg font-bold mb-2">Quick Info</h3>
          <ul className="space-y-2 text-blue-50 text-sm">
            <li className="flex justify-between">
              <span>Student ID:</span>
              <span className="font-mono">{user?.user_metadata?.student_id_number || 'N/A'}</span>
            </li>
            <li className="flex justify-between">
              <span>Academic Year:</span>
              <span>{academicYears.find(ay => ay.id === selectedAY)?.name || 'N/A'}</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
          <History className="w-5 h-5 text-gray-500" />
          <h3 className="font-bold text-gray-900">Transaction History</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {ledgerLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  </td>
                </tr>
              ) : !soaData || soaData.transactions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-20 text-center text-gray-500">
                    <History className="w-12 h-12 mx-auto mb-4 opacity-10" />
                    <p>No transactions recorded for this period.</p>
                  </td>
                </tr>
              ) : (
                soaData.transactions.map((entry, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(entry.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="font-medium">{entry.description}</div>
                      {entry.cashier && (
                        <div className="text-[10px] text-gray-400 uppercase tracking-tight">Processed by {entry.cashier}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                        entry.type === 'charge' 
                          ? 'bg-red-50 text-red-700 border border-red-100' 
                          : entry.type === 'payment'
                            ? 'bg-green-50 text-green-700 border border-green-100'
                            : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                      }`}>
                        {entry.type}
                      </span>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-black ${
                      entry.type === 'charge' ? 'text-red-600' : 
                      entry.type === 'payment' ? 'text-green-600' :
                      'text-indigo-600'
                    }`}>
                      {entry.type === 'charge' ? '+' : '-'} ₱{entry.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end">
          <div className="text-right">
            <span className="text-sm text-gray-500 mr-4 font-medium">TOTAL BALANCE:</span>
            <span className={`text-xl font-black ${(soaData?.summary.remaining_balance || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
              ₱{(soaData?.summary.remaining_balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {error && <ErrorModal message={error} onClose={() => setError('')} />}
    </div>
  );
};

export default MyLedger;
