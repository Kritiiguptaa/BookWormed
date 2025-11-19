import React, { useContext } from 'react'
import { Routes, Route } from 'react-router-dom'

import Home from './pages/Home'
import Posts from './pages/Posts'
import BrowseBooks from './pages/BrowseBooks'
import BookDetails from './pages/BookDetails'
import MyLists from './pages/MyLists'
import About from './pages/About'
import Groups from './pages/Groups'
import GroupDetails from './pages/GroupDetails'
import UserProfile from './pages/UserProfile'
import Notifications from './pages/Notifications'
import Navbar from './components/Navbar'
import Friends from './components/friends.jsx'
import Search from './components/search.jsx';
import Footer from './components/Footer'
import BuyCredit from './pages/BuyCredits.jsx'

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
        <Route path='/groups' element={<Groups/>}/>
        <Route path='/groups/:id' element={<GroupDetails/>}/>
        <Route path='/books' element={<BrowseBooks/>}/>
        <Route path='/books/:id' element={<BookDetails/>}/>
        <Route path='/my-lists' element={<MyLists/>}/>
        <Route path='/about' element={<About/>}/>
        <Route path='/profile/:userId' element={<UserProfile/>}/>
        <Route path='/notifications' element={<Notifications/>}/>
        <Route path='/buy' element={<BuyCredit />} />
      </Routes>
      <Footer />
    </div>
  )
}

export default App