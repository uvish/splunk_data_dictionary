const isLoggedIn = () => {
       return (localStorage.getItem('user') !== null && localStorage.getItem('sessionKey') !== null);
}
const getUserName = () => {
    return localStorage.getItem('user');
}
const getSessionKey = () => {
    return localStorage.getItem('sessionKey');
}
const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('sessionKey');
    window.location.href = '/'
}
const createSession = (user,sessionKey) => {
    localStorage.setItem('sessionKey', sessionKey);
    localStorage.setItem('user', user);
}

exports.isLoggedIn = isLoggedIn;
exports.getUserName = getUserName;
exports.getSessionKey = getSessionKey;
exports.logout = logout;
exports.createSession = createSession;