import React from 'react';

const PagePlaceholder: React.FC<{ title: string; description: string }> = ({ title, description }) => (
  <div className="p-8">
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">{title}</h1>
      <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
        <p className="text-gray-600 mb-4">{description}</p>
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
          <p className="text-sm text-blue-800 italic">This page is currently under development.</p>
        </div>
      </div>
    </div>
  </div>
);


// Moderator Pages
export const ClassesPage = () => <PagePlaceholder title="Classes" description="Manage classes within your department." />;
export const EnrollmentPage = () => <PagePlaceholder title="Enrollment" description="Assign students to classes." />;
export const RequestsInboxPage = () => <PagePlaceholder title="Requests Inbox" description="Approve student addition requests from teachers." />;

// Student Pages
export const MyGradesPage = () => <PagePlaceholder title="My Grades" description="View your academic performance." />;
export const MyAttendancePage = () => <PagePlaceholder title="My Attendance" description="Track your attendance records." />;
