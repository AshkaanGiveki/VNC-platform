import { createSlice } from '@reduxjs/toolkit';

function getCookie(name) {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? match[2] : null;
}

const accessToken = getCookie('accessToken');
const refreshToken = getCookie('refreshToken');
const csrfToken = getCookie('csrf-token');

const initialState = {
  user: null,
  accessToken: accessToken || null,
  refreshToken: refreshToken || null,
  csrfToken: csrfToken || null,
  isAuthenticated: !!(accessToken && refreshToken),
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, { payload }) => {
      state.user = payload.user;
      state.accessToken = payload.accessToken;
      state.refreshToken = payload.refreshToken;
      state.isAuthenticated = true;

      // Set cookies
      document.cookie = `accessToken=${payload.accessToken}; path=/; max-age=${15 * 60}`;
      document.cookie = `refreshToken=${payload.refreshToken}; path=/; max-age=${7 * 24 * 60 * 60}`;
    },
    setCsrfToken: (state, { payload }) => {
      state.csrfToken = payload;
      document.cookie = `csrf-token=${payload}; path=/; SameSite=Strict`;
    },
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.csrfToken = null;
      state.isAuthenticated = false;

      // Clear cookies
      document.cookie = 'accessToken=; path=/; max-age=0';
      document.cookie = 'refreshToken=; path=/; max-age=0';
      document.cookie = 'csrf-token=; path=/; max-age=0';
    },
    updateUser: (state, { payload }) => {
      state.user = { ...state.user, ...payload };
    },
    restoreSession: (state, { payload }) => {
      // payload is the user object
      state.user = payload;
      state.isAuthenticated = true;
    },
  },
});

export const { setCredentials, setCsrfToken, logout, updateUser, restoreSession } = authSlice.actions;
export default authSlice.reducer;
