import { lazy } from "react"

const Chat=lazy(()=>import("../page/chat"))

export const componentMap:any={
    "/chat":<Chat/>
}