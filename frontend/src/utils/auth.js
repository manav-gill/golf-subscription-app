export function getToken() {
  return localStorage.getItem('token');
}

export function isAuthenticated() {
  return Boolean(getToken());
}
