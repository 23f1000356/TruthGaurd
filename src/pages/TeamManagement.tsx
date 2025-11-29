import { useState } from 'react';
import { Mail, UserPlus, MoreVertical, Clock } from 'lucide-react';
import { TeamMember, AuditLog } from '../types';

const mockTeamMembers: TeamMember[] = [
  { id: '1', name: 'Sarah Johnson', email: 'sarah@company.com', role: 'admin', status: 'active' },
  { id: '2', name: 'Michael Chen', email: 'michael@company.com', role: 'analyst', status: 'active' },
  { id: '3', name: 'Emily Rodriguez', email: 'emily@company.com', role: 'analyst', status: 'active' },
  { id: '4', name: 'David Kim', email: 'david@company.com', role: 'viewer', status: 'active' },
  { id: '5', name: 'Jessica Brown', email: 'jessica@company.com', role: 'viewer', status: 'suspended' },
];

const mockAuditLogs: AuditLog[] = [
  { id: '1', userId: '1', userName: 'Sarah Johnson', action: 'Verified Claim #12847', timestamp: '2 hours ago' },
  { id: '2', userId: '2', userName: 'Michael Chen', action: 'Edited Project Settings', timestamp: '3 hours ago' },
  { id: '3', userId: '3', userName: 'Emily Rodriguez', action: 'Generated Report #456', timestamp: '5 hours ago' },
  { id: '4', userId: '1', userName: 'Sarah Johnson', action: 'Added new team member', timestamp: '1 day ago' },
  { id: '5', userId: '4', userName: 'David Kim', action: 'Viewed Analytics Dashboard', timestamp: '1 day ago' },
];

export default function TeamManagement() {
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'viewer' | 'analyst' | 'admin'>('viewer');
  const [members] = useState<TeamMember[]>(mockTeamMembers);

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-[#2E8372]/20 text-[#2E8372]';
      case 'analyst': return 'bg-indigo-100 text-indigo-700';
      case 'viewer': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    return status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700';
  };

  const handleInvite = () => {
    console.log('Inviting:', inviteEmail, inviteRole);
    setInviteEmail('');
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
      <div className="w-full">
        <div className="mb-8">
          <h2 className="text-3xl font-semibold text-[#1A1A1A] mb-2">Team Management</h2>
          <p className="text-gray-600">Manage team members and monitor activity</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-1 bg-white rounded-3xl shadow-[0_4px_16px_rgba(0,0,0,0.06)] p-8">
            <h3 className="text-lg font-semibold text-[#1A1A1A] mb-6">Invite Members</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#2B2B2B] mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="colleague@company.com"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#2E8372] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#2B2B2B] mb-2">
                  Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as 'viewer' | 'analyst' | 'admin')}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#2E8372] transition-all"
                >
                  <option value="viewer">Viewer</option>
                  <option value="analyst">Analyst</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <button
                onClick={handleInvite}
                className="w-full px-6 py-3 rounded-full bg-[#2E8372] text-white font-medium hover:bg-[#3C8E80] transition-all shadow-lg flex items-center justify-center space-x-2"
              >
                <UserPlus size={18} />
                <span>Send Invitation</span>
              </button>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="text-sm font-semibold text-[#1A1A1A] mb-3">Pending Invites</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-[#F5F2ED] rounded-lg">
                  <span className="text-sm text-gray-700">john@company.com</span>
                  <span className="text-xs text-gray-500">2d ago</span>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 bg-white rounded-3xl shadow-[0_4px_16px_rgba(0,0,0,0.06)] p-8">
            <h3 className="text-lg font-semibold text-[#1A1A1A] mb-6">Team Members</h3>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-4 px-4 text-sm font-semibold text-gray-600">Member</th>
                    <th className="text-left py-4 px-4 text-sm font-semibold text-gray-600">Email</th>
                    <th className="text-left py-4 px-4 text-sm font-semibold text-gray-600">Role</th>
                    <th className="text-left py-4 px-4 text-sm font-semibold text-gray-600">Status</th>
                    <th className="text-left py-4 px-4 text-sm font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((member, index) => (
                    <tr
                      key={member.id}
                      className={`border-b border-gray-100 hover:bg-[#F5F2ED] transition-all ${
                        index % 2 === 0 ? 'bg-slate-50/50' : ''
                      }`}
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-[#2E8372] flex items-center justify-center text-white font-medium">
                            {member.name.charAt(0)}
                          </div>
                          <span className="text-sm font-medium text-[#1A1A1A]">{member.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-gray-600">{member.email}</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(member.role)}`}>
                          {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(member.status)}`}>
                          {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <button className="p-2 hover:bg-gray-100 rounded-lg transition-all">
                          <MoreVertical size={16} className="text-gray-600" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-[0_4px_16px_rgba(0,0,0,0.06)] p-8">
          <h3 className="text-lg font-semibold text-[#1A1A1A] mb-6">Audit Logs</h3>

          <div className="space-y-4">
            {mockAuditLogs.map((log, index) => (
              <div
                key={log.id}
                className={`flex items-center justify-between p-4 rounded-xl transition-all hover:bg-[#F5F2ED] ${
                  index % 2 === 0 ? 'bg-slate-50/50' : ''
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-full bg-[#2E8372]/10 flex items-center justify-center">
                    <Clock size={18} className="text-[#2E8372]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#1A1A1A]">{log.userName}</p>
                    <p className="text-sm text-gray-600">{log.action}</p>
                  </div>
                </div>
                <span className="text-xs text-gray-500">{log.timestamp}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
