import React from 'react';
import { NavLink } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard,
  User,
  Clock,
  ClipboardList,
  FileText,
  X,
  Building2,
  ShieldAlert,
  ChevronRight,
  Megaphone,
  FilePieChart
} from 'lucide-react';

export const Sidebar = ({ isOpen, onClose }) => {
  const { user, roleView } = useApp();

  const isAdmin = user?.role === 'Admin';

  const employeeNavigationItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'My Profile', path: '/profile', icon: User },
    { name: 'Attendance', path: '/attendance', icon: Clock },
    { name: 'Leave Requests', path: '/leaves', icon: ClipboardList },
    { name: 'Salary Slips', path: '/salary-slips', icon: FileText },
  ];

  const adminNavigationItems = [
    { name: 'Admin Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Manage Employees', path: '/admin/employees', icon: User },
    { name: 'Departments', path: '/admin/departments', icon: Building2 },
    { name: 'Attendance Register', path: '/admin/attendance', icon: Clock },
    { name: 'Leave Approvals', path: '/admin/leaves', icon: ClipboardList },
    { name: 'Payroll & Salary', path: '/admin/payroll', icon: FileText },
    { name: 'Bulletin Board', path: '/admin/announcements', icon: Megaphone },
    { name: 'Reports', path: '/admin/reports', icon: FilePieChart },
  ];

  const navigationItems = isAdmin ? adminNavigationItems : employeeNavigationItems;

  const sidebarContent = (
    <div className="flex h-full flex-col bg-slate-900 text-slate-300">
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between border-b border-slate-800 px-6">
        <div className="flex items-center gap-2">
          <Building2 className="h-6 w-6 text-indigo-400 animate-pulse" />
          <span className="text-lg font-bold tracking-tight text-white">
            Smart<span className="text-indigo-400 font-semibold text-sm ml-1 uppercase tracking-widest">EMS</span>
          </span>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
          aria-label="Close Sidebar"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* User Quick Info */}
      <div className="flex flex-col items-center border-b border-slate-800 p-6 text-center">
        <img
          src={user.avatar}
          alt={user.name}
          className="h-16 w-16 rounded-full border-2 border-indigo-500/25 object-cover"
          referrerPolicy="no-referrer"
        />
        <h4 className="mt-3 font-semibold text-white tracking-wide text-sm">{user.name}</h4>
        <span className="text-xs text-slate-400 mt-1 font-medium">{user.designation}</span>
        <span className="mt-2.5 inline-flex items-center rounded-full bg-slate-800 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-400">
          {user.id}
        </span>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1.5 px-3 py-6 overflow-y-auto">
        <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
          {isAdmin ? 'Administration Portal' : 'Employee Dashboard'}
        </div>
        {navigationItems.map(item => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.path}
              end={item.path === '/'}
              onClick={() => {
                if (window.innerWidth < 1024) onClose();
              }}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-xs font-semibold tracking-wide transition-all duration-150 group ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={`h-4.5 w-4.5 shrink-0 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'}`} />
                  <span className="flex-1">{item.name}</span>
                  <ChevronRight className={`h-3 w-3 shrink-0 opacity-0 transition-all duration-150 group-hover:opacity-100 ${isActive ? 'opacity-100' : ''}`} />
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Role view active helper */}
      {roleView !== 'Employee' && (
        <div className="m-4 rounded-lg bg-indigo-950/60 border border-indigo-500/20 p-3.5 text-xs text-indigo-300">
          <div className="flex gap-2">
            <ShieldAlert className="h-4 w-4 shrink-0 text-indigo-400" />
            <div>
              <p className="font-bold text-indigo-200">Simulation Mode</p>
              <p className="text-[10px] text-indigo-300/80 mt-0.5 leading-relaxed">
                You are viewing the app as a <strong className="text-white">{roleView}</strong>. Switch back in the header anytime.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Footer Branding */}
      <div className="border-t border-slate-800 p-4 text-center space-y-1">
        <div className="text-[10px] text-slate-500 font-mono tracking-wider">
          SOFTWALLET EMS v1.0
        </div>
        <div className="text-[9px] text-slate-600 font-medium">
          Assigned to: <span className="text-slate-400 font-semibold">Varshik Pal</span>
        </div>
        <div className="text-[8px] text-slate-600">
          Softwallet Innovative Technologies
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Back-drop overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs transition lg:hidden"
        />
      )}

      {/* Desktop static sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-slate-800 bg-slate-900 lg:block">
        {sidebarContent}
      </aside>

      {/* Mobile drawer sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 lg:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
};
