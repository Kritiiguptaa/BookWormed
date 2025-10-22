import React, { useContext } from 'react'
import { Routes, Route } from 'react-router-dom'

import Home from './pages/Home'
import Posts from './pages/Posts'
import Navbar from './components/Navbar'
import Friends from './components/friends.jsx'
import Search from './components/search.jsx';
import Footer from './components/Footer'

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Login from './components/Login'
import { AppContext } from './context/AppContext'
// import Verify from './pages/Verify'

const App = () => {

  const { showLogin } = useContext(AppContext)

  return (
    // <div className='px-4 sm:px-10 md:px-14 lg:px-28 min-h-screen bg-gray-900 '>
      <div className='min-h-screen bg-gray-900 '>
      <ToastContainer position='bottom-right' />
      <Navbar />
      {showLogin && <Login />}
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path="/search" element={<Search />} />
        <Route path='/friends' element={<Friends/>}/>
        <Route path='/posts' element={<Posts/>}/>
      </Routes>
      <Footer />
    </div>
  )
}

export default App