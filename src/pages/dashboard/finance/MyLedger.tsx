import React, { useEffect, useState } from 'react';
import { ReceiptText, Calendar, Wallet, History, AlertCircle } from 'lucide-react';
import { financeService } from '../../../services/financeService';
import { academicYearService } from '../../../services/academicYearService';
import { useAuth } from '../../../contexts/AuthContext';
import { LedgerEntry } from '../../../types/finance';
import { AcademicYear } from '../../../types/academicYear';
import ErrorModal from '../../../components/ui/ErrorModal';

const MyLedger: React.FC = () => {
  const { user } = useAuth();
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [selectedAY, setSelectedAY] = useState<string>('');
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [balance, setBalance] = useState<number>(0);
  
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
      const [ledgerRes, balanceRes] = await Promise.all([
        financeService.getStudentLedger(user.id, ayId),
        financeService.getStudentBalance(user.id, ayId)
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

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedAY && user?.id) {
      fetchLedger(selectedAY);
    }
  }, [selectedAY, user?.id]);

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
        </div>
      </div>

      {/* Summary Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 col-span-1 md:col-span-2">
          <div className="flex items-center gap-4">
            <div className={`p-4 rounded-full ${balance > 0 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
              <Wallet size={32} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Remaining Balance</p>
              <h2 className={`text-3xl font-black ${balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                ₱{balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </h2>
            </div>
          </div>
          {balance > 0 && (
            <div className="mt-4 flex items-start gap-2 text-sm text-amber-700 bg-amber-50 p-3 rounded-lg border border-amber-100">
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
              <p>Please settle your outstanding balance at the Cashier's office to avoid any inconvenience during enrollment or graduation.</p>
            </div>
          )}
        </div>

        <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-6 rounded-xl shadow-md text-white">
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
              ) : ledger.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-20 text-center text-gray-500">
                    <History className="w-12 h-12 mx-auto mb-4 opacity-10" />
                    <p>No transactions recorded for this period.</p>
                  </td>
                </tr>
              ) : (
                ledger.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(entry.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="font-medium">{entry.description}</div>
                      {entry.cashier_name && (
                        <div className="text-[10px] text-gray-400 uppercase tracking-tight">Processed by {entry.cashier_name}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                        entry.transaction_type === 'charge' 
                          ? 'bg-red-50 text-red-700 border border-red-100' 
                          : entry.transaction_type === 'payment'
                            ? 'bg-green-50 text-green-700 border border-green-100'
                            : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                      }`}>
                        {entry.transaction_type}
                      </span>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-black ${
                      entry.transaction_type === 'charge' ? 'text-red-600' : 
                      entry.transaction_type === 'payment' ? 'text-green-600' :
                      'text-indigo-600'
                    }`}>
                      {entry.transaction_type === 'charge' ? '+' : '-'} ₱{entry.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
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
            <span className={`text-xl font-black ${balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
              ₱{balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {error && <ErrorModal message={error} onClose={() => setError('')} />}
    </div>
  );
};

export default MyLedger;
