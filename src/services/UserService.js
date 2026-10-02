const USERS_STORAGE_KEY = 'growShopUsers';

const DEFAULT_USERS = [
    {
        username: 'admin',
        password: 'admin',
        role: 'admin',
        nombre: 'Administrador',
        apellido: 'Sistema',
        direccion: 'Calle Principal 123',
        telefono: '3124058166',
        tipoIdentificacion: 'CC',
        numeroIdentificacion: '11111111',
        mayorDeEdad: true,
        active: true
    }
];

class UserService {
    constructor() {
        this.users = this.loadUsers();
    }

    loadUsers() {
        try {
            const raw = localStorage.getItem(USERS_STORAGE_KEY);
            if (!raw) {
                localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(DEFAULT_USERS));
                return DEFAULT_USERS;
            }
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : DEFAULT_USERS;
        } catch (error) {
            console.error('Error loading users from storage:', error);
            return DEFAULT_USERS;
        }
    }

    saveUsers(usersList) {
        try {
            localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(usersList));
            this.users = usersList;
        } catch (error) {
            console.error('Error saving users to storage:', error);
        }
    }

    getUsers() {
        return this.loadUsers();
    }

    findUserByUsername(username) {
        const users = this.getUsers();
        return users.find(u => u.username.toLowerCase() === username.toLowerCase());
    }

    registerUser(user) {
        const users = this.getUsers();
        const exists = users.some(u => u.username.toLowerCase() === user.username.toLowerCase());
        if (exists) {
            throw new Error('El nombre de usuario ya está registrado.');
        }

        const newUser = {
            ...user,
            role: 'cliente',
            active: true
        };

        users.push(newUser);
        this.saveUsers(users);
        return newUser;
    }

    toggleUserStatus(username) {
        const users = this.getUsers();
        const updated = users.map(u => {
            if (u.username.toLowerCase() === username.toLowerCase()) {
                if (u.role === 'admin') return u;
                return { ...u, active: !u.active };
            }
            return u;
        });
        this.saveUsers(updated);
    }
}

const userServiceInstance = new UserService();
export default userServiceInstance;
