import React from 'react';
import { X, FileText, Download, Printer } from 'lucide-react';
import { StudentTOR } from '../../types/student';

interface StudentTORModalProps {
  isOpen: boolean;
  onClose: () => void;
  torData: StudentTOR | null;
  loading: boolean;
}

const StudentTORModal: React.FC<StudentTORModalProps> = ({ isOpen, onClose, torData, loading }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-blue-700 text-white shrink-0">
          <div className="flex items-center gap-2">
            <FileText size={24} />
            <h3 className="text-xl font-bold">Transcript of Records</h3>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => window.print()} 
              className="p-2 hover:bg-blue-600 rounded-lg transition-colors"
              title="Print TOR"
            >
              <Printer size={20} />
            </button>
            <button onClick={onClose} className="text-white/80 hover:text-white">
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 print:p-0" id="tor-content">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
              <p className="mt-4 text-gray-500 font-medium">Generating Transcript...</p>
            </div>
          ) : torData ? (
            <div className="space-y-8">
              {/* Header */}
              <div className="text-center space-y-2 border-b pb-6">
                <h2 className="text-3xl font-black text-blue-700 uppercase tracking-tight">Official Transcript of Records</h2>
                <p className="text-gray-500 font-bold uppercase text-sm tracking-widest">Office of the University Registrar</p>
              </div>

              {/* Student Info */}
              <div className="grid grid-cols-2 gap-8 bg-gray-50 p-6 rounded-xl border border-gray-100">
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">Full Name</label>
                    <p className="text-lg font-bold text-gray-900">{torData.student.full_name}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">Student ID Number</label>
                    <p className="text-lg font-bold text-gray-900">{torData.student.student_id_number || 'N/A'}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">Current Course</label>
                    <p className="text-lg font-bold text-gray-900">{torData.student.current_course || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">Date Generated</label>
                    <p className="text-lg font-bold text-gray-900">{new Date(torData.student.date_generated).toLocaleDateString(undefined, { dateStyle: 'long' })}</p>
                  </div>
                </div>
              </div>

              {/* Academic Records */}
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-black">AR</span>
                  Academic History
                </h3>
                
                <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-4 py-3 text-[10px] font-black text-gray-500 uppercase">Year & Semester</th>
                        <th className="px-4 py-3 text-[10px] font-black text-gray-500 uppercase">Subject Code</th>
                        <th className="px-4 py-3 text-[10px] font-black text-gray-500 uppercase">Subject Name</th>
                        <th className="px-4 py-3 text-[10px] font-black text-gray-500 uppercase text-center">Units</th>
                        <th className="px-4 py-3 text-[10px] font-black text-gray-500 uppercase text-center">Grade</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {torData.records.length > 0 ? (
                        torData.records.map((record, index) => (
                          <tr key={index} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-4 py-3">
                              <p className="text-xs font-bold text-gray-900">{record.academic_year}</p>
                              <p className="text-[10px] text-gray-500 uppercase font-medium">{record.semester}</p>
                            </td>
                            <td className="px-4 py-3 text-xs font-bold text-blue-700">{record.subject_code}</td>
                            <td className="px-4 py-3 text-xs font-medium text-gray-700">{record.subject_name}</td>
                            <td className="px-4 py-3 text-xs font-bold text-gray-900 text-center">{record.units}</td>
                            <td className="px-4 py-3 text-center">
                              <span className={`text-xs font-black ${record.final_grade && parseFloat(record.final_grade) >= 75 ? 'text-green-600' : 'text-red-600'}`}>
                                {record.final_grade || '--'}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="px-4 py-10 text-center text-gray-400 italic text-sm">
                            No academic records found for this student.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Footer / Certification */}
              <div className="mt-12 pt-12 border-t border-dashed border-gray-200 grid grid-cols-2 gap-12">
                <div className="space-y-4">
                  <div className="h-px bg-gray-300 w-full mb-8"></div>
                  <p className="text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">University Registrar Signature</p>
                </div>
                <div className="space-y-4 text-right">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Certification</p>
                  <p className="text-[10px] text-gray-500 leading-relaxed">
                    This is a certified true copy of the academic record of the student mentioned above. 
                    Any alteration or erasure renders this document null and void.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-20 text-gray-500">
              Failed to load transcript data.
            </div>
          )}
        </div>
        
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 shrink-0 bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-white border border-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-100 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentTORModal;
