import axios from 'axios';

const rawProductsApiUrl = String(import.meta.env.VITE_APP_PRODUCTS_API_URL ?? '').trim();
const nodeEnv = String(import.meta.env.NODE_ENV ?? import.meta.env.PROD ?? '').toLowerCase();
const isProduction = nodeEnv === 'true' || nodeEnv === 'production';

const resolveApiBaseUrl = () => {
    if (rawProductsApiUrl) {
        return rawProductsApiUrl.replace(/\/productos\/?$/, '');
    }

    if (!isProduction) {
        return 'http://localhost:8080/api';
    }

    return '/api';
};

const apiBaseUrl = resolveApiBaseUrl();

class UserService {
    async getUsers() {
        try {
            const token = sessionStorage.getItem('token');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            const response = await axios.get(`${apiBaseUrl}/admin/users`, { headers });
            return response.data || [];
        } catch (error) {
            console.error('Error getting users:', error);
            throw error;
        }
    }

    async registerUser(user) {
        try {
            const response = await axios.post(`${apiBaseUrl}/auth/register`, user);
            return response.data;
        } catch (error) {
            console.error('Error registering user:', error);
            if (error.response && error.response.data && error.response.data.message) {
                throw new Error(error.response.data.message);
            }
            throw new Error('Ocurrió un error en el servidor al registrar el usuario.');
        }
    }

    async toggleUserStatus(username) {
        try {
            const token = sessionStorage.getItem('token');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            const response = await axios.put(`${apiBaseUrl}/admin/users/${username}/toggle-status`, {}, { headers });
            return response.data;
        } catch (error) {
            console.error(`Error toggling status for user ${username}:`, error);
            if (error.response && error.response.data && error.response.data.message) {
                throw new Error(error.response.data.message);
            }
            throw error;
        }
    }

    async updateProfile(profileData) {
        try {
            const token = sessionStorage.getItem('token');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            const response = await axios.put(`${apiBaseUrl}/users/profile`, profileData, { headers });
            return response.data;
        } catch (error) {
            console.error('Error updating profile:', error);
            if (error.response && error.response.data && error.response.data.message) {
                throw new Error(error.response.data.message);
            }
            throw new Error('Ocurrió un error al actualizar el perfil.');
        }
    }

    async resetPassword(username, newPassword) {
        try {
            const token = sessionStorage.getItem('token');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            const response = await axios.put(`${apiBaseUrl}/admin/users/${username}/reset-password`, { password: newPassword }, { headers });
            return response.data;
        } catch (error) {
            console.error(`Error resetting password for user ${username}:`, error);
            if (error.response && error.response.data && error.response.data.message) {
                throw new Error(error.response.data.message);
            }
            throw error;
        }
    }
}

const userServiceInstance = new UserService();
export default userServiceInstance;
