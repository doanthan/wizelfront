"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { 
  Users,
  Search,
  AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function SuperuserUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [impersonating, setImpersonating] = useState(null);

  const fetchUsers = async (page = 1, search = "") => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        ...(search && { search })
      });

      const response = await fetch(`/api/superuser/users?${params}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch users');
      }
      
      const data = await response.json();
      setUsers(data.users);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching users:', error);
      // Show error to user
      setUsers([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchUsers(1, searchQuery);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchUsers(page, searchQuery);
  };

  const handleImpersonate = async (user) => {
    if (impersonating) return;
    
    setImpersonating(user._id);
    try {
      const response = await fetch('/api/superuser/impersonate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ targetUserId: user._id })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create impersonation token');
      }
      
      const data = await response.json();
      
      // Set the impersonation token as a cookie and redirect
      document.cookie = `next-auth.session-token=${data.token}; path=/; max-age=7200; samesite=strict`;
      
      // Redirect to dashboard
      window.location.href = '/dashboard';
      
    } catch (error) {
      console.error('Error impersonating user:', error);
      alert(`Error: ${error.message}`);
      setImpersonating(null);
    }
  };

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-gray dark:text-white mb-2">
          User Management
        </h1>
        <p className="text-neutral-gray dark:text-gray-400">
          Search and impersonate users for support and debugging
        </p>
      </div>

      {/* Search and Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Impersonation
          </CardTitle>
          <CardDescription>
            Search and impersonate users to help with support and debugging
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 mb-4">
            <div className="flex-1 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search by name or email..."
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-blue dark:bg-gray-800 dark:text-white"
              />
            </div>
            <Button onClick={handleSearch} disabled={loading}>
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>

          {/* Users List */}
          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-blue mx-auto mb-4"></div>
                <p className="text-neutral-gray">Loading users...</p>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-neutral-gray mx-auto mb-4" />
                <p className="text-neutral-gray">No users found</p>
                {searchQuery && (
                  <p className="text-sm text-neutral-gray mt-2">
                    Try adjusting your search terms
                  </p>
                )}
              </div>
            ) : (
              users.map((user) => (
                <div
                  key={user._id}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-medium text-slate-gray dark:text-white">
                        {user.name}
                      </h3>
                      <span className={cn(
                        "px-2 py-1 text-xs rounded-full",
                        user.status === 'active' 
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                      )}>
                        {user.status}
                      </span>
                    </div>
                    <p className="text-sm text-neutral-gray dark:text-gray-400 mb-1">
                      {user.email}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-neutral-gray">
                      <span>Stores: {user.store_count}</span>
                      {user.last_login && (
                        <span>Last login: {new Date(user.last_login).toLocaleDateString()}</span>
                      )}
                      <span>Joined: {new Date(user.created_at).toLocaleDateString()}</span>
                    </div>
                    {user.store_names.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {user.store_names.map((storeName, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 rounded"
                          >
                            {storeName}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <Button
                    onClick={() => handleImpersonate(user)}
                    disabled={impersonating === user._id}
                    className="bg-gradient-to-r from-sky-blue to-vivid-violet hover:from-royal-blue hover:to-deep-purple text-white"
                  >
                    {impersonating === user._id ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Impersonating...
                      </>
                    ) : (
                      <>
                        <Users className="h-4 w-4 mr-2" />
                        Impersonate
                      </>
                    )}
                  </Button>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t">
              <div className="text-sm text-neutral-gray">
                Showing {users.length} of {pagination.totalUsers} users
                (Page {pagination.currentPage} of {pagination.totalPages})
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={!pagination.hasPreviousPage || loading}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={!pagination.hasNextPage || loading}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Warning */}
      <Card className="border-yellow-200 dark:border-yellow-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-yellow-800 dark:text-yellow-400">
            <AlertTriangle className="h-5 w-5" />
            Security Notice
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="text-sm text-neutral-gray space-y-1">
            <li>• Impersonation sessions are limited to 2 hours</li>
            <li>• All impersonation activities are logged for security</li>
            <li>• Cannot impersonate other super users</li>
            <li>• Use responsibly and only for legitimate support purposes</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}