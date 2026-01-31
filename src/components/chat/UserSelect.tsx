import { useState, useEffect } from 'react';
import { UserProfile } from '@/types';
import { getAllUsers } from '@/lib/users';
import { useAuth } from '@/contexts/AuthContext';
import { Search, User } from 'lucide-react';

interface UserSelectProps {
    onSelect: (user: UserProfile) => void;
    onCancel: () => void;
}

export default function UserSelect({ onSelect, onCancel }: UserSelectProps) {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        async function loadUsers() {
            try {
                const allUsers = await getAllUsers();
                // Filter out current user
                setUsers(allUsers.filter(u => u.uid !== currentUser?.uid));
            } catch (error) {
                console.error("Failed to load users", error);
            } finally {
                setLoading(false);
            }
        }
        loadUsers();
    }, [currentUser?.uid]);

    const filteredUsers = users.filter(u =>
        u.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="flex flex-col h-full bg-white dark:bg-elegant-900 rounded-t-xl">
            <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <h3 className="font-semibold text-elegant-800 dark:text-elegant-100">Nueva Conversación</h3>
                <button onClick={onCancel} className="text-gray-500 hover:text-gray-700 dark:text-gray-400">Cancel</button>
            </div>

            <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar usuario..."
                        className="w-full pl-9 pr-4 py-2 text-sm border rounded-lg dark:bg-elegant-800 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                {loading ? (
                    <div className="p-4 text-center text-gray-500">Cargando usuarios...</div>
                ) : filteredUsers.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">No se encontraron usuarios</div>
                ) : (
                    <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                        {filteredUsers.map(user => (
                            <li
                                key={user.uid}
                                className="p-3 hover:bg-gray-50 dark:hover:bg-elegant-800 cursor-pointer flex items-center gap-3"
                                onClick={() => onSelect(user)}
                            >
                                <div className="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary-600 dark:text-primary-300 font-medium">
                                    {user.photoURL ? (
                                        <img src={user.photoURL} alt={user.displayName} className="h-full w-full rounded-full object-cover" />
                                    ) : (
                                        user.displayName.charAt(0).toUpperCase()
                                    )}
                                </div>
                                <div>
                                    <p className="font-medium text-elegant-800 dark:text-elegant-100">{user.displayName}</p>
                                    <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
