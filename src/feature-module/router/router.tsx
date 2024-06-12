import React from 'react'
import { Outlet, Route, Routes } from 'react-router'
import { authRoutes, publicRoutes } from './router.link';
import Header from '../../core/common/header';
import Sidebar from '../../core/common/sidebar';
import ThemeSettings from '../../core/common/theme-settings/themeSettings';

const ALLRoutes = () => {

  const HeaderLayout = () => (
    <>
      <Header />
      <Sidebar/>
      <Outlet />
      <ThemeSettings/>
    </>
  );
  const AuthPages = () => (
    <>
    
      <Outlet />
    </>
  );
  return (
    <>
      <Routes>
        <Route path={"/"} element={<HeaderLayout />}>
          {publicRoutes.map((route, idx) => (
            <Route path={route.path} element={route.element} key={idx} />
          ))}
        </Route>
        <Route path={"/"} element={<AuthPages />}>
          {authRoutes.map((route, idx) => (
            <Route path={route.path} element={route.element} key={idx} />
          ))}
        </Route>
      </Routes>
    </>
  )
}

export default ALLRoutes
