import { RouterProvider,createBrowserRouter } from "react-router-dom";
import { routers } from "./router";


function App() {

  return (
    <>
      <RouterProvider router={createBrowserRouter(routers)}></RouterProvider>
    </>
  )
}

export default App
