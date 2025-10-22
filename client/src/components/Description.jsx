import React from 'react'
import { assets } from '../assests/assets.js'
import { motion } from 'framer-motion'
import { useContext } from 'react'
import { AppContext } from '../context/AppContext'
import { useNavigate } from 'react-router-dom'
const Description = () => {
    const {user,setShowLogin}=useContext(AppContext)
    const navigate=useNavigate()
    const onclickHandler=()=>{
    //   if(user){
    //     navigate('/result')
    //   }
    //   else{
        setShowLogin(true)
    //   }
    }
  return (
    <motion.div 
    initial={{opacity:0.2,y:100}}
    transition={{duration:1}}
    whileInView={{opacity:1,y:0}}
    viewport={{once:true}}
    className='flex-grow container mx-auto flex flex-col items-center justify-center text-center my-12 md:my-24 p-6'>
            <h1 className='text-4xl md:text-6xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-sky-400'>
                Read. Review. Repeat.
            </h1>
            <p className='text-lg text-gray-400 max-w-2xl mb-8'>
                Join a growing community of readers who love to share what they’re reading. 
                Rate books, write reviews, follow your friends, and keep your bookshelf alive with every turn of the page.
            </p>
            <button 
                onClick={onclickHandler} 
                className="bg-emerald-500 hover:bg-emerald-600 text-gray-900 font-bold py-3 px-8 rounded-full transition-transform transform hover:scale-105 text-lg shadow-lg shadow-emerald-500/20"
            >
                Join the Community
            </button>

    </motion.div>
  )
}

export default Description