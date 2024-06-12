import { configureStore } from "@reduxjs/toolkit";
import commonSlice from "./commonSlice";

const store = configureStore({
    reducer: commonSlice,
  });
  
  export default store;
  