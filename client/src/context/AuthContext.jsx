import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [accessToken, setAccessToken] = useState(null);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);

    const showToast = (message, type = 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    const getApiUrl = (path) => path.startsWith('http') ? path : `${import.meta.env.VITE_API_URL || ''}${path}`;

    // Helper for authorized fetch calls with JWT Bearer Token
    const authFetch = useCallback(async (url, options = {}) => {
        const headers = options.headers || {};
        if (accessToken) {
            headers['Authorization'] = `Bearer ${accessToken}`;
        }
        options.headers = headers;
        options.credentials = options.credentials || 'include';

        let response = await fetch(getApiUrl(url), options);

        // If 401 token expired, attempt token refresh automatically
        if (response.status === 401 && !url.includes('/api/auth/login') && !url.includes('/api/auth/refresh')) {
            try {
                const refreshRes = await fetch(getApiUrl('/api/auth/refresh'), { method: 'POST', credentials: 'include' });
                const refreshData = await refreshRes.json();
                if (refreshRes.ok && refreshData.accessToken) {
                    setAccessToken(refreshData.accessToken);
                    setUser(refreshData.user);
                    headers['Authorization'] = `Bearer ${refreshData.accessToken}`;
                    options.headers = headers;
                    response = await fetch(getApiUrl(url), options);
                } else {
                    setUser(null);
                    setAccessToken(null);
                }
            } catch (e) {
                setUser(null);
                setAccessToken(null);
            }
        }
        return response;
    }, [accessToken]);

    // Check current auth status on app initialization
    const checkAuth = async () => {
        try {
            const res = await fetch(getApiUrl('/api/auth/me'), { credentials: 'include' });
            const contentType = res.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                setUser(null);
                return;
            }
            const data = await res.json();
            if (data.authenticated && data.user) {
                setUser(data.user);
            } else {
                // Try silent refresh
                const refreshRes = await fetch(getApiUrl('/api/auth/refresh'), { method: 'POST', credentials: 'include' });
                const refreshContentType = refreshRes.headers.get('content-type');
                if (refreshContentType && refreshContentType.includes('application/json')) {
                    const refreshData = await refreshRes.json();
                    if (refreshRes.ok && refreshData.accessToken) {
                        setAccessToken(refreshData.accessToken);
                        setUser(refreshData.user);
                    } else {
                        setUser(null);
                    }
                } else {
                    setUser(null);
                }
            }
        } catch (err) {
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkAuth();
    }, []);

    const parseJsonResponse = async (res, defaultErrMsg = 'Server error occurred') => {
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            try {
                return await res.json();
            } catch (err) {
                throw new Error('Invalid JSON response from server');
            }
        }
        if (!res.ok) {
            throw new Error(`Server connection failed (${res.status} ${res.statusText}). Please check if the backend server is running.`);
        }
        throw new Error(defaultErrMsg);
    };

    const login = async (email, password) => {
        let res;
        try {
            res = await fetch(getApiUrl('/api/auth/login'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ email, password })
            });
        } catch (netErr) {
            throw new Error('Unable to reach backend server. Please make sure backend server is running on port 5000.');
        }

        const data = await parseJsonResponse(res, 'Login failed');
        if (!res.ok) {
            throw new Error(data.error || 'Invalid email or password');
        }
        setAccessToken(data.accessToken);
        setUser(data.user);
        return data;
    };

    const register = async (name, email, password, role = 'tester') => {
        let res;
        try {
            res = await fetch(getApiUrl('/api/auth/register'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ name, email, password, role })
            });
        } catch (netErr) {
            throw new Error('Unable to reach backend server. Please make sure backend server is running on port 5000.');
        }

        const data = await parseJsonResponse(res, 'Registration failed');
        if (!res.ok) {
            throw new Error(data.error || 'Registration failed');
        }
        setAccessToken(data.accessToken);
        setUser(data.user);
        return data;
    };

    const logout = async () => {
        try {
            await fetch(getApiUrl('/api/auth/logout'), { method: 'POST', credentials: 'include' });
        } catch (e) {}
        setUser(null);
        setAccessToken(null);
        localStorage.clear();
    };

    return (
        <AuthContext.Provider value={{ user, accessToken, loading, login, register, logout, authFetch, showToast }}>
            {children}
            {toast && (
                <div className="global-toast">
                    <i className="fas fa-exclamation-circle" style={{ color: '#e74c3c', fontSize: '20px' }}></i>
                    <span style={{ color: '#1E1E2C', fontWeight: '500', fontSize: '14px' }}>{toast.message}</span>
                </div>
            )}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
