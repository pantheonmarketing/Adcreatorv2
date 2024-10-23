import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface User {
  email: string;
  created_at: string;
}

export default function AdminDashboard() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [bulkEmails, setBulkEmails] = useState('');
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/auth/manage-users');
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      const data = await response.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error('Failed to fetch users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const addUser = async (email: string) => {
    try {
      const response = await fetch('/api/auth/manage-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to add user');
      }
      
      toast.success(`Added user: ${email}`);
      return true;
    } catch (error) {
      console.error('Failed to add user:', error);
      toast.error(`Failed to add user: ${email}`);
      return false;
    }
  };

  const handleSingleUserAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (await addUser(newEmail)) {
      setNewEmail('');
      fetchUsers();
    }
  };

  const handleBulkAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    const emails = bulkEmails
      .split(/[\n,]/) // Split by newline or comma
      .map(email => email.trim())
      .filter(email => email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)); // Basic email validation

    if (emails.length === 0) {
      toast.error('No valid emails found');
      setIsProcessing(false);
      return;
    }

    let successCount = 0;
    for (const email of emails) {
      if (await addUser(email)) {
        successCount++;
      }
      // Small delay to prevent overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    toast.info(`Added ${successCount} out of ${emails.length} users`);
    setBulkEmails('');
    fetchUsers();
    setIsProcessing(false);
  };

  const removeUser = async (email: string) => {
    try {
      const response = await fetch('/api/auth/manage-users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error('Failed to remove user');
      }

      fetchUsers();
      toast.success('User removed successfully');
    } catch (error) {
      console.error('Failed to remove user:', error);
      toast.error('Failed to remove user');
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl">
      <ToastContainer />
      <div className="mb-8 space-y-6">
        {/* Single User Add */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Add Single User</h2>
          <form onSubmit={handleSingleUserAdd} className="flex gap-4">
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="Enter email to authorize"
              className="flex-1 p-2 rounded bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600"
              required
            />
            <button
              type="submit"
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded transition-all duration-200"
            >
              Add User
            </button>
          </form>
        </div>

        {/* Bulk Add */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Bulk Add Users</h2>
          <form onSubmit={handleBulkAdd} className="space-y-4">
            <textarea
              value={bulkEmails}
              onChange={(e) => setBulkEmails(e.target.value)}
              placeholder="Enter multiple emails (separated by commas or new lines)"
              className="w-full p-2 rounded bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 h-32"
            />
            <button
              type="submit"
              disabled={isProcessing}
              className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? 'Processing...' : 'Add Users'}
            </button>
          </form>
        </div>
      </div>

      {/* User List */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Authorized Users</h2>
        {loading ? (
          <div className="text-gray-600 dark:text-gray-300">Loading...</div>
        ) : users.length === 0 ? (
          <div className="text-gray-600 dark:text-gray-300">No authorized users found</div>
        ) : (
          <div className="space-y-4">
            {users.map((user: User) => (
              <div
                key={user.email}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded"
              >
                <div>
                  <p className="text-gray-900 dark:text-white">{user.email}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Added: {new Date(user.created_at).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => removeUser(user.email)}
                  className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded transition-colors duration-200"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
