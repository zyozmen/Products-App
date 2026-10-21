import axios from 'axios';
import AuthenticationService from './AuthenticationService.js';
import { getApiBaseUrl } from './apiConfig.js';
import { isAssignableUserState, normalizeUserState } from './userState.js';

const serverMessage = (error) => error?.response?.data?.message;

// El header Authorization lo agrega el interceptor global (ver httpClient.js).
class UserService {
    async getUsers() {
        try {
            const response = await axios.get(`${getApiBaseUrl()}/admin/users`);
            return response.data || [];
        } catch (error) {
            console.error('Error getting users:', error?.response?.status ?? error?.message);
            throw error;
        }
    }

    async registerUser(user) {
        try {
            const response = await axios.post(`${getApiBaseUrl()}/auth/register`, user);
            return response.data;
        } catch (error) {
            console.error('Error registering user:', error?.response?.status ?? error?.message);
            if (serverMessage(error)) {
                throw new Error(serverMessage(error));
            }
            throw new Error('Ocurrió un error en el servidor al registrar el usuario.');
        }
    }

    // Solo el rol ADMIN puede cambiar el estado (ACTIVO | INACTIVO); PENDIENTE nunca se envía; el backend debe validarlo también.
    async updateUserState(username, state) {
        const nextState = normalizeUserState(state);
        if (!isAssignableUserState(nextState)) {
            throw new Error(`Estado de usuario inválido: ${state}`);
        }
        if (!AuthenticationService.isUserAdmin()) {
            throw new Error('Solo un administrador puede cambiar el estado de un usuario.');
        }

        try {
            const response = await axios.put(
                `${getApiBaseUrl()}/admin/users/${encodeURIComponent(username)}/state`,
                { state: nextState },
            );
            return response.data;
        } catch (error) {
            console.error(`Error updating state for user ${username}:`, error?.response?.status ?? error?.message);
            if (serverMessage(error)) {
                throw new Error(serverMessage(error));
            }
            throw error;
        }
    }

    async updateProfile(profileData) {
        try {
            const response = await axios.put(`${getApiBaseUrl()}/users/profile`, profileData);
            return response.data;
        } catch (error) {
            console.error('Error updating profile:', error?.response?.status ?? error?.message);
            if (serverMessage(error)) {
                throw new Error(serverMessage(error));
            }
            throw new Error('Ocurrió un error al actualizar el perfil.');
        }
    }

    async resetPassword(username, newPassword) {
        try {
            const response = await axios.put(
                `${getApiBaseUrl()}/admin/users/${encodeURIComponent(username)}/reset-password`,
                { password: newPassword },
            );
            return response.data;
        } catch (error) {
            console.error(`Error resetting password for user ${username}:`, error?.response?.status ?? error?.message);
            if (serverMessage(error)) {
                throw new Error(serverMessage(error));
            }
            throw error;
        }
    }
}

const userServiceInstance = new UserService();
export default userServiceInstance;
