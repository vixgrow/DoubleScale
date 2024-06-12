import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux';
import { setThemeSettings } from '../../data/redux/commonSlice';
import ImageWithBasePath from '../imageWithBasePath';
import { all_routes } from '../../../feature-module/router/all_routes';
import { Link } from "react-router-dom";
const route = all_routes;
const ThemeSettings = () => {


    const dispatch = useDispatch();

    const themeOpen = useSelector((state:any) => state?.themeSettings);


    
    const [layoutTheme, setLayoutTheme]=useState(localStorage.getItem("dataTheme")
);


const [layoutColor, setLayoutColor]=useState(localStorage.getItem("dataColor")
);
const [layoutBar, setLayoutBar]=useState(localStorage.getItem("dataSidebar")
);


    const themeDark = () =>{
        localStorage.setItem("dataTheme", "dark");
        setLayoutTheme("dark");
        document.documentElement.setAttribute("data-theme", "dark");
    }
    const themeLight = () =>{
        localStorage.setItem("dataTheme", "light");
        setLayoutTheme("light");
        document.documentElement.setAttribute("data-theme", "light");
    }
    const colorRed = () =>{
        localStorage.setItem("dataColor", "red");
        setLayoutColor("red");
        document.documentElement.setAttribute("data-color", "red");
    }
    const colorYellow = () =>{
        localStorage.setItem("dataColor", "yellow");
        setLayoutColor("yellow");
        document.documentElement.setAttribute("data-color", "yellow");
    }
    const colorBlue = () =>{
        localStorage.setItem("dataColor", "blue");
        setLayoutColor("blue");
        document.documentElement.setAttribute("data-color", "blue");
    }
    const colorGreen = () =>{
        localStorage.setItem("dataColor", "green");
        setLayoutColor("green");
        document.documentElement.setAttribute("data-color", "green");
    }
    const sidebarLight = () =>{
        localStorage.setItem("dataSidebar", "light");
        setLayoutBar("light");
        document.documentElement.setAttribute("data-sidebar", "light");
    }
    const sidebarDark = () =>{
        localStorage.setItem("dataSidebar", "dark");
        setLayoutBar("dark");
        document.documentElement.setAttribute("data-sidebar", "dark");
    }
    const sidebarBlue = () =>{
        localStorage.setItem("dataSidebar", "blue");
        setLayoutBar("blue");
        document.documentElement.setAttribute("data-sidebar", "blue");
    }
    const sidebarGreen = () =>{
        localStorage.setItem("dataSidebar", "green");
        setLayoutBar("green");
        document.documentElement.setAttribute("data-sidebar", "green");
    }
    const sidebarBgOne = () =>{
        localStorage.setItem("dataSidebar", "sidebarbg1");
        setLayoutBar("sidebarbg1");
        document.documentElement.setAttribute("data-sidebar", "sidebarbg1");
    }
    const sidebarBgTwo = () =>{
        localStorage.setItem("dataSidebar", "sidebarbg2");
        setLayoutBar("sidebarbg2");
        document.documentElement.setAttribute("data-sidebar", "sidebarbg2");
    }
    const sidebarBgThree = () =>{
        localStorage.setItem("dataSidebar", "sidebarbg3");
        setLayoutBar("sidebarbg3");
        document.documentElement.setAttribute("data-sidebar", "sidebarbg3");
    }
    const sidebarBgFour = () =>{
        localStorage.setItem("dataSidebar", "sidebarbg4");
        setLayoutBar("sidebarbg4");
        document.documentElement.setAttribute("data-sidebar", "sidebarbg4");
    }
    const resetData = () =>{
        localStorage.setItem("dataTheme", "light");
        localStorage.setItem("dataColor", "red");
        localStorage.setItem("dataSidebar", "light");
        setLayoutTheme("light");
        setLayoutColor("red");
        setLayoutBar("light");
        document.documentElement.setAttribute("data-theme", "light");  
        document.documentElement.setAttribute("data-color", "red");
        document.documentElement.setAttribute("data-sidebar", "light");

    }

    useEffect(() => {
        const themeToSet = layoutTheme || ""; 
        const colorToSet = layoutColor || ""; 
        const barToSet = layoutBar || ""; 
        document.documentElement.setAttribute("data-theme", themeToSet);
        document.documentElement.setAttribute("data-color", colorToSet);
        document.documentElement.setAttribute("data-sidebar", barToSet);
    }, []);



  return (
   
<div>
  <div className="sidebar-contact">
    <div className="toggle-theme"  onClick={() => dispatch(setThemeSettings(!themeOpen))}><i className="fa fa-cog fa-w-16 fa-spin" /></div>
  </div>
  <div className={`sidebar-themesettings ${themeOpen ? "open" : ""}`}>
    <div className="themesettings-header">
      <h4>Theme Customizer</h4>
      <Link to="#" id="theme-settings"   onClick={() => dispatch(setThemeSettings(!themeOpen))}><i className="ti ti-x"  /></Link>
    </div>
    <div className="themesettings-inner">
      <div className="themesettings-content">
        <h6>Layout</h6>
        <div className="row">
          <div className="col-lg-6" onClick={themeLight}>
            <div className="input-themeselect">
              <input type="radio" name="theme" id="lightTheme" defaultValue="light" checked={layoutTheme === "light" ? true : false} />
              <label htmlFor="lightTheme">
                <ImageWithBasePath src="assets/img/theme/theme-04.png" alt="img" />
                <span className="w-100">
                  <span>Light</span>
                  <span className="checkboxs-theme" />
                </span>
              </label>
            </div>
          </div>
          <div className="col-lg-6" onClick={themeDark}>
            <div className="input-themeselect">
              <input type="radio" name="theme" id="darkTheme" defaultValue="dark" checked={layoutTheme === "dark" ? true : false} />
              <label htmlFor="darkTheme">
                <ImageWithBasePath src="assets/img/theme/theme-05.png" alt="img" />
                <span className="w-100">
                  <span>Dark</span>
                  <span className="checkboxs-theme" />
                </span>
              </label>
            </div>
          </div>
        </div>
      </div>
      <div className="themesettings-content">
        <h6>Colors</h6>
        <div className="row">
          <div className="col-lg-12">
            <div className="theme-colorsset">
              <ul>
                <li>
                  <div className="input-themeselects" onClick={colorRed}>
                    <input type="radio" name="color" id="redColor" defaultValue="red" checked={layoutColor === "red" ? true : false} />
                    <label htmlFor="redColor" className="red-clr" />
                  </div>
                </li>
                <li>
                  <div className="input-themeselects" onClick={colorYellow}>
                    <input type="radio" name="color" id="yellowColor" defaultValue="yellow" checked={layoutColor === "yellow" ? true : false}/>
                    <label htmlFor="yellowColor" className="yellow-clr" />
                  </div>
                </li>
                <li>
                  <div className="input-themeselects" onClick={colorBlue}>
                    <input type="radio" name="color" id="blueColor" defaultValue="blue" checked={layoutColor === "blue" ? true : false}/>
                    <label htmlFor="blueColor" className="blue-clr" />
                  </div>
                </li>
                <li>
                  <div className="input-themeselects" onClick={colorGreen}>
                    <input type="radio" name="color" id="greenColor" defaultValue="green"  checked={layoutColor === "green" ? true : false}/>
                    <label htmlFor="greenColor" className="green-clr" />
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      <div className="themesettings-content">
        <h6>Sidebar</h6>
        <div className="row">
          <div className="col-lg-6" onClick={sidebarLight}>
            <div className="input-themeselect">
              <input type="radio" name="sidebar" id="lightSidebar" defaultValue="light" checked={layoutBar === "light" ? true : false} />
              <label htmlFor="lightSidebar">
                <ImageWithBasePath src="assets/img/theme/theme-04.png" alt="img" />
                <span className="w-100">
                  <span>Light</span>
                  <span className="checkboxs-theme" />
                </span>
              </label>
            </div>
          </div>
          <div className="col-lg-6" onClick={sidebarDark}>
            <div className="input-themeselect">
              <input type="radio" name="sidebar" id="darkSidebar" defaultValue="dark" checked={layoutBar === "dark" ? true : false}/>
              <label htmlFor="darkSidebar">
                <ImageWithBasePath src="assets/img/theme/theme-04.svg" alt="img" />
                <span className="w-100">
                  <span>Dark</span>
                  <span className="checkboxs-theme" />
                </span>
              </label>
            </div>
          </div>
          <div className="col-lg-6"  onClick={sidebarBlue}>
            <div className="input-themeselect">
              <input type="radio" name="sidebar" id="blueSidebar" defaultValue="blue" checked={layoutBar === "blue" ? true : false}/>
              <label htmlFor="blueSidebar">
                <ImageWithBasePath src="assets/img/theme/theme-05.svg" alt="img" />
                <span className="w-100">
                  <span>Blue</span>
                  <span className="checkboxs-theme" />
                </span>
              </label>
            </div>
          </div>
          <div className="col-lg-6"  onClick={sidebarGreen}>
            <div className="input-themeselect">
              <input type="radio" name="sidebar" id="greenSidebar" defaultValue="green" checked={layoutBar === "green" ? true : false}/>
              <label htmlFor="greenSidebar">
                <ImageWithBasePath src="assets/img/theme/theme-06.svg" alt="img" />
                <span className="w-100">
                  <span>Green</span>
                  <span className="checkboxs-theme" />
                </span>
              </label>
            </div>
          </div>
        </div>
      </div>
      <div className="themesettings-content m-0 border-0">
        <h6>Sidebar Background</h6>
        <div className="row">
          <div className="col-lg-6" onClick={sidebarBgOne}>
            <div className="input-themeselect">
              <input type="radio" name="sidebar" id="sidebarBg1" defaultValue="sidebarbg1" checked={layoutBar === "sidebarbg1" ? true : false} />
              <label htmlFor="sidebarBg1">
                <ImageWithBasePath src="assets/img/theme/theme-07.svg" alt="img" />
                <span className="w-100">
                  <span>Bg-1</span>
                  <span className="checkboxs-theme" />
                </span>
              </label>
            </div>
          </div>
          <div className="col-lg-6" onClick={sidebarBgTwo}>
            <div className="input-themeselect">
              <input type="radio" name="sidebar" id="sidebarBg2" defaultValue="sidebarbg2" checked={layoutBar === "sidebarbg2" ? true : false}/>
              <label htmlFor="sidebarBg2">
                <ImageWithBasePath src="assets/img/theme/theme-08.svg" alt="img" />
                <span className="w-100">
                  <span>Bg-2</span>
                  <span className="checkboxs-theme" />
                </span>
              </label>
            </div>
          </div>
          <div className="col-lg-6" onClick={sidebarBgThree}>
            <div className="input-themeselect">
              <input type="radio" name="sidebar" id="sidebarBg3" defaultValue="sidebarbg3" checked={layoutBar === "sidebarbg3" ? true : false}/>
              <label htmlFor="sidebarBg3">
                <ImageWithBasePath src="assets/img/theme/theme-09.svg" alt="img" />
                <span className="w-100">
                  <span>Bg-3</span>
                  <span className="checkboxs-theme" />
                </span>
              </label>
            </div>
          </div>
          <div className="col-lg-6" onClick={sidebarBgFour}>
            <div className="input-themeselect">
              <input type="radio" name="sidebar" id="sidebarBg4" defaultValue="sidebarbg4" checked={layoutBar === "sidebarbg4" ? true : false}/>
              <label htmlFor="sidebarBg4">
                <ImageWithBasePath src="assets/img/theme/theme-10.svg" alt="img" />
                <span className="w-100">
                  <span>Bg-4</span>
                  <span className="checkboxs-theme" />
                </span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div className="themesettings-footer">
      <ul>
        <li>
          <Link to="#" className="btn btn-cancel close-theme">Cancel</Link>
        </li>
        <li>
          <Link to="#" id="resetButton" className="btn btn-reset" onClick={resetData}>Reset</Link>
        </li>
      </ul>
    </div>
  </div>
</div>

  )
}

export default ThemeSettings