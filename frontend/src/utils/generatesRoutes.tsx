import { type RouteObject } from "react-router-dom";
import { componentMap } from "../router/routerMap";

// 定义菜单项的类型接口
interface MenuType{
    icon:string;    // 菜单图标
    key:string;     // 路由路径
    label:string;   // 菜单标签
    children?:MenuType[]  // 子菜单项
}

export function generateRoutes(menu:MenuType[]):RouteObject[]{
    return menu.map((item:MenuType)=>{
        const hasChildren=item.children
        // 创建路由对象
        let routerObj:RouteObject={
            path:item.key,
            // 如果有子菜单则不渲染组件,否则渲染对应的组件
            element:hasChildren?null:<>{componentMap[item.key]}</>
        };
        // 递归处理子菜单
        if(item.children){
            routerObj.children=generateRoutes(item.children)
        }
        return routerObj
    })
}