import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { routers } from "./router";
import { useSelector } from "react-redux";
import { useEffect } from "react";
import { useMenu } from "./hooks/useMenu";
import type { RootState } from "./store";

function App() {

  return (
    <>
      <RouterProvider router={createBrowserRouter(routers)}></RouterProvider>
    </>
  );
}

export default App;
 