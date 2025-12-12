'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { getAllUsers, updateUserProfile } from '@/lib/users';
import { canManageUsers } from '@/lib/permissions';
import { UserProfile, UserRole } from '@/types';
import { Users, Edit, Shield, Mail, Calendar, Clock } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import EditUserModal from '@/components/users/EditUserModal';

export default function UsersPage() {
  const { userProfile } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [filterRole, setFilterRole] = useState<UserRole | 'all'>('all');

  // Verificar permisos
  useEffect(() => {
    if (!userProfile) return;

    if (!canManageUsers(userProfile.role)) {
      showToast('No tienes permisos para acceder a esta página', 'error');
      router.push('/dashboard');
    }
  }, [userProfile, router, showToast]);

  // Cargar usuarios
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      console.log('[UsersPage] Cargando usuarios...');
      const allUsers = await getAllUsers();
      console.log('[UsersPage] Usuarios cargados:', allUsers.length, allUsers);
      setUsers(allUsers);
    } catch (error) {
      console.error('[UsersPage] Error loading users:', error);
      showToast('Error al cargar usuarios', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (user: UserProfile) => {
    setEditingUser(user);
  };

  const handleSaveUser = async (uid: string, data: Partial<UserProfile>) => {
    try {
      await updateUserProfile(uid, data);
      showToast('Usuario actualizado correctamente', 'success');
      setEditingUser(null);
      loadUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      showToast('Error al actualizar usuario', 'error');
    }
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'administrador':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      case 'secretaria':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'profesional':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'administrador':
        return 'Administrador';
      case 'secretaria':
        return 'Secretaria';
      case 'profesional':
        return 'Profesional';
      default:
        return role;
    }
  };

  const filteredUsers = filterRole === 'all'
    ? users
    : users.filter(u => u.role === filterRole);

  console.log('[UsersPage] Renderizando - Total usuarios:', users.length, 'Filtrados:', filteredUsers.length, 'Loading:', loading);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-elegant-600 dark:text-elegant-400">Cargando usuarios...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-primary-dark dark:text-white flex items-center gap-3">
              <Users className="w-8 h-8" />
              Gestión de Usuarios
            </h1>
            <p className="text-elegant-600 dark:text-elegant-400 mt-1">
              Administra los usuarios y sus permisos en el sistema
            </p>
          </div>
        </div>

        {/* Filtros */}
        <div className="card glass-panel">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilterRole('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filterRole === 'all'
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-elegant-100 dark:bg-elegant-800 text-elegant-700 dark:text-elegant-300 hover:bg-elegant-200 dark:hover:bg-elegant-700'
              }`}
            >
              Todos ({users.length})
            </button>
            <button
              onClick={() => setFilterRole('administrador')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filterRole === 'administrador'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/50'
              }`}
            >
              Administradores ({users.filter(u => u.role === 'administrador').length})
            </button>
            <button
              onClick={() => setFilterRole('secretaria')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filterRole === 'secretaria'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50'
              }`}
            >
              Secretarias ({users.filter(u => u.role === 'secretaria').length})
            </button>
            <button
              onClick={() => setFilterRole('profesional')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filterRole === 'profesional'
                  ? 'bg-green-600 text-white shadow-md'
                  : 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50'
              }`}
            >
              Profesionales ({users.filter(u => u.role === 'profesional').length})
            </button>
          </div>
        </div>

        {/* Tabla de Usuarios */}
        {filteredUsers.length === 0 ? (
          <div className="card glass-panel text-center py-12">
            <Users className="w-16 h-16 text-elegant-300 dark:text-elegant-700 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-elegant-900 dark:text-white mb-2">
              No hay usuarios
            </h3>
            <p className="text-elegant-600 dark:text-elegant-400">
              No se encontraron usuarios con este filtro
            </p>
          </div>
        ) : (
          <div className="card glass-panel overflow-hidden">
            {/* Vista Desktop */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-elegant-50 dark:bg-elegant-800/50 border-b border-elegant-200 dark:border-elegant-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-elegant-700 dark:text-elegant-300 uppercase tracking-wider">
                      Usuario
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-elegant-700 dark:text-elegant-300 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-elegant-700 dark:text-elegant-300 uppercase tracking-wider">
                      Rol
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-elegant-700 dark:text-elegant-300 uppercase tracking-wider">
                      Creado
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-elegant-700 dark:text-elegant-300 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-elegant-200 dark:divide-elegant-700">
                  {filteredUsers.map((user) => (
                    <tr
                      key={user.uid}
                      className="hover:bg-elegant-50 dark:hover:bg-elegant-800/30 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary-dark text-white flex items-center justify-center font-bold text-sm shadow-md">
                            {user.displayName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                          </div>
                          <div>
                            <div className="font-semibold text-elegant-900 dark:text-white">
                              {user.displayName || 'Sin nombre'}
                            </div>
                            {user.username && (
                              <div className="text-xs text-elegant-500 dark:text-elegant-400">
                                @{user.username}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-elegant-600 dark:text-elegant-400">
                          <Mail className="w-4 h-4" />
                          <span className="text-sm">{user.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${getRoleBadgeColor(user.role)}`}>
                          <Shield className="w-3 h-3" />
                          {getRoleLabel(user.role)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-elegant-600 dark:text-elegant-400">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          {new Date(user.createdAt).toLocaleDateString('es-AR')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={() => handleEditUser(user)}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors font-medium text-sm"
                        >
                          <Edit className="w-4 h-4" />
                          Editar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Vista Mobile */}
            <div className="md:hidden divide-y divide-elegant-200 dark:divide-elegant-700">
              {filteredUsers.map((user) => (
                <div key={user.uid} className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary-dark text-white flex items-center justify-center font-bold shadow-md flex-shrink-0">
                        {user.displayName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-elegant-900 dark:text-white truncate">
                          {user.displayName || 'Sin nombre'}
                        </div>
                        {user.username && (
                          <div className="text-xs text-elegant-500 dark:text-elegant-400 truncate">
                            @{user.username}
                          </div>
                        )}
                      </div>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0 ml-2 ${getRoleBadgeColor(user.role)}`}>
                      <Shield className="w-3 h-3" />
                      {getRoleLabel(user.role)}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-sm">
                    <div className="flex items-center gap-2 text-elegant-600 dark:text-elegant-400">
                      <Mail className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{user.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-elegant-600 dark:text-elegant-400">
                      <Calendar className="w-4 h-4 flex-shrink-0" />
                      <span>Creado: {new Date(user.createdAt).toLocaleDateString('es-AR')}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleEditUser(user)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors font-medium text-sm"
                  >
                    <Edit className="w-4 h-4" />
                    Editar Usuario
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal de Edición */}
      {editingUser && (
        <EditUserModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSave={handleSaveUser}
        />
      )}
    </DashboardLayout>
  );
}
