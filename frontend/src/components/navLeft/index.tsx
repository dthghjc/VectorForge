import { Menu } from 'antd';
import { useState,useEffect } from 'react';
import logo from "../../assets/logo.png"
import icons from './iconList';
import { useNavigate,useLocation } from 'react-router-dom';
import { useSelector } from "react-redux";
import "./index.scss"

interface MenuItem{
    key:string;
    label:string;
    icon?:React.ReactNode;
    children?:MenuItem[]
}

function navLeft(){
    const navigate = useNavigate();
    const { menuList } = useSelector((state:any) => state.authSlice);
    const [menuData,setMenuData] = useState<MenuItem[]>([]);
    const location = useLocation();

    useEffect(() => {
        configMenu()
    },[menuList]);

    async function configMenu(){
     

}
