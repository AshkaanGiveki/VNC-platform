import { createSlice } from '@reduxjs/toolkit';

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    sidebarOpen: true,
    loading: false,
    modal: null,
    mobileMenuOpen: false, 
  },
  reducers: {
    toggleSidebar: (state) => { state.sidebarOpen = !state.sidebarOpen; },
    setLoading: (state, { payload }) => { state.loading = payload; },
    openModal: (state, { payload }) => { state.modal = payload; },
    closeModal: (state) => { state.modal = null; },
    toggleMobileMenu: (state) => { state.mobileMenuOpen = !state.mobileMenuOpen; },
    closeMobileMenu: (state) => { state.mobileMenuOpen = false; },
  },
});

export const { toggleSidebar, setLoading, openModal, closeModal, toggleMobileMenu, closeMobileMenu } = uiSlice.actions;
export default uiSlice.reducer;