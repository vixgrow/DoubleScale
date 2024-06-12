import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  darkMode: false,
  activityTogglePopup: false,
  activityTogglePopupTwo: false,
  toggleAddCampaign: false,
  themeSettings: false,
  modalTitle: "",
  addTogglePopupTwo: false,
  headerCollapse: false,
  mobileSidebar: false,
  miniSidebar: false,
  expandMenu: false,
};
const commonSlice = createSlice({
  name: "CRMS",
  initialState,
  reducers: {
    setDarkMode: (state, { payload }) => {
      state.darkMode = payload;
    },
    setActivityTogglePopup: (state, { payload }) => {
      state.activityTogglePopup = payload;
    },
    setAddTogglePopupTwo: (state, { payload }) => {
      state.addTogglePopupTwo = payload;
    },
    setActivityTogglePopupTwo: (state, { payload }) => {
      state.activityTogglePopupTwo = payload;
    },
    setToggleAddCampaign: (state, { payload }) => {
      state.toggleAddCampaign = payload;
    },
    setThemeSettings: (state, { payload }) => {
      state.themeSettings = payload;
    },
    setModalTitle: (state, { payload }) => {
      state.modalTitle = payload;
    },
    setHeaderCollapse: (state, { payload }) => {
      state.headerCollapse = payload;
    },
    setMobileSidebar: (state, { payload }) => {
      state.mobileSidebar = payload;
    },
    setMiniSidebar: (state, { payload }) => {
      state.miniSidebar = payload;
    },
    setExpandMenu: (state, { payload }) => {
      state.expandMenu = payload;
    },
  },
});

export const { setDarkMode, setToggleAddCampaign, setAddTogglePopupTwo } =
  commonSlice.actions;
export const {
  setActivityTogglePopup,
  setHeaderCollapse,
  setMobileSidebar,
  setMiniSidebar,
  setExpandMenu,
} = commonSlice.actions;
export const { setActivityTogglePopupTwo } = commonSlice.actions;
export const { setThemeSettings } = commonSlice.actions;
export const { setModalTitle } = commonSlice.actions;
export default commonSlice.reducer;
export const setToogleHeader = (payload: any) => ({
  type: "toggle_header",
  payload,
});
