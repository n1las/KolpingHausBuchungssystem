/**
 * Auth module for KolpingHaus application.
 * Manages user session via sessionStorage.
 */
window.Auth = (function() {
  const SESSION_KEY = 'kolpinghaus_session';
  let currentUser = null;

  return {
    init: function() {
      const stored = sessionStorage.getItem(SESSION_KEY);
      if (stored) {
        currentUser = JSON.parse(stored);
      }
    },

    getCurrentUser: function() {
      return currentUser;
    },

    login: function(username, password) {
      const account = window.Store.authenticate(username, password);
      if (account) {
        currentUser = account;
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(account));
        return true;
      }
      return false;
    },

    logout: function() {
      currentUser = null;
      sessionStorage.removeItem(SESSION_KEY);
    },

    isLoggedIn: function() {
      return currentUser !== null;
    }
  };
})();
