import UserService from './UserService.js';

class AuthenticationService {
    registerSuccessfulLogin(username, password) {
        console.log("registerSuccessfulLogin");
        sessionStorage.setItem('authenticatedUser', username);
    }

    logout() {
        console.log("logout");
        sessionStorage.removeItem('authenticatedUser');
    }

    isUserLoggedIn() {
        let user = sessionStorage.getItem('authenticatedUser');
        if (user === null) return false;
        return true;
    }

    getLoggedInUser() {
        let username = sessionStorage.getItem('authenticatedUser');
        if (!username) return null;
        return UserService.findUserByUsername(username);
    }

    getUserRole() {
        const user = this.getLoggedInUser();
        return user ? user.role : null;
    }

    isUserAdmin() {
        return this.getUserRole() === 'admin';
    }
}
export default new AuthenticationService();