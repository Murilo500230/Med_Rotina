let authToken: string | null = null;

export function definirAuthToken(token: string | null) {
  authToken = token;
}

export function obterAuthToken() {
  return authToken;
}
