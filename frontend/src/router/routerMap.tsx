import { lazy } from "react"

const Chat=lazy(()=>import("../page/chat"))
const Annotation=lazy(()=>import("../page/Annotation"))
const Review=lazy(()=>import("../page/review"))
const UserManagement=lazy(()=>import("../page/userManagement"))
const VectorTools=lazy(()=>import("../page/vectorTools"))

const Sub1=lazy(()=>import("../page/sub1"))
const Sub2=lazy(()=>import("../page/sub2"))
const Sub11=lazy(()=>import("../page/sub11"))
const Sub12=lazy(()=>import("../page/sub12"))
const Sub21=lazy(()=>import("../page/sub21"))
const Sub211=lazy(()=>import("../page/sub211"))
const Sub212=lazy(()=>import("../page/sub212"))

export const componentMap:any={
    "/chat":<Chat/>,
    "/annotation":<Annotation/>,
    "/review":<Review/>,
    "/userManagement":<UserManagement/>,
    "/vectorTools":<VectorTools/>,

    "/sub1":<Sub1/>,
    "/sub2":<Sub2/>,
    "/sub1/sub11":<Sub11/>,
    "/sub1/sub12":<Sub12/>,
    "/sub2/sub21":<Sub21/>,
    "/sub2/sub21/sub211":<Sub211/>,
    "/sub2/sub21/sub212":<Sub212/>
}