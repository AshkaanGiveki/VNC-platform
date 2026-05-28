import { createSlice } from '@reduxjs/toolkit';

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    sidebarOpen: true,
    loading: false,
    modal: null,
  },
  reducers: {
    toggleSidebar: (state) => { state.sidebarOpen = !state.sidebarOpen; },
    setLoading: (state, { payload }) => { state.loading = payload; },
    openModal: (state, { payload }) => { state.modal = payload; },
    closeModal: (state) => { state.modal = null; },
  },
});

export const { toggleSidebar, setLoading, openModal, closeModal } = uiSlice.actions;
export default uiSlice.reducer;