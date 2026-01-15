import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import RootLayout from './RootLayout'
import Landing from './components/landing/Landing'
import Home from './components/home/Home'
import Login from './components/login/Login'
import Signup from './components/register/SignUp'
function App() {
  let provider = createBrowserRouter([
    {
      path: '',
      element: <RootLayout />,
      children : [
        {
          path : '',
          element : <Landing />
        },
        {
          path : '/home',
          element : <Home />
        },
        {
          path : '/login',
          element : <Login />
        },
        {
          path : '/signup',
          element : <Signup />
        }
      ]
    }
  ])
  return (
    <RouterProvider router={provider} />
  )
}

export default App