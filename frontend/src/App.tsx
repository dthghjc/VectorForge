import { RouterProvider,createBrowserRouter, useSearchParams } from "react-router-dom";
import { routers } from "./router";


function App() {
  const { token } = useSelector((state: any) => state.authSlice);
  const 
  return (
    <>
      <RouterProvider router={createBrowserRouter(routers)}></RouterProvider>
    </>
  )
}

export default App
