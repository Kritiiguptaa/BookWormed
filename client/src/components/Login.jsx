import React, { useContext, useEffect, useState } from 'react'
import { assets } from '../assests/assets.js'
import { AppContext } from '../context/AppContext'
import { motion } from 'framer-motion'
import axios from 'axios'
import { toast } from 'react-toastify'

const Login = () => {
  const [state, setState] = useState('Login')
  // const { setShowLogin, backendUrl, setToken, setUser } = useContext(AppContext)
  const { setShowLogin, backendUrl, setToken} = useContext(AppContext)

  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [usernameAvailable, setUsernameAvailable] = useState(null)
  const [checkingUsername, setCheckingUsername] = useState(false)

  // 🔍 Check username availability with debounce
  useEffect(() => {
    const check = async () => {
      if (!username.trim()) {
        setUsernameAvailable(null)
        return
      }
      setCheckingUsername(true)
      try {
        const { data } = await axios.get(`${backendUrl}/api/user/check-username/${username}`)
        setUsernameAvailable(data.available)
      } catch (err) {
        console.error(err)
      } finally {
        setCheckingUsername(false)
      }
    }

    const timeout = setTimeout(check, 500) // wait 0.5s after typing
    return () => clearTimeout(timeout)
  }, [username, backendUrl])

  const onSubmitHandler = async (e) => {
    e.preventDefault()
    try {
      if (state === 'Login') {
        const { data } = await axios.post(backendUrl + '/api/user/login', { email, password })
        if (data.success) {
          setToken(data.token)
          // setUser(data.user)
          localStorage.setItem('token', data.token)
          setShowLogin(false)
        } else {
          toast.error(data.message)
        }
      } else {
        // prevent submission if username already taken
        if (usernameAvailable === false) {
          toast.error('Username already taken')
          return
        }

        const { data } = await axios.post(backendUrl + '/api/user/register', {
          name,
          username,
          email,
          password
        })
        if (data.success) {
          setToken(data.token)
          // setUser(data.user)
          localStorage.setItem('token', data.token)
          setShowLogin(false)
        } else {
          toast.error(data.message)
        }
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  return (
    <div className="absolute top-0 left-0 right-0 bottom-0 z-10 backdrop-blur-sm bg-black/30 flex justify-center items-center">
      <motion.form
        onSubmit={onSubmitHandler}
        initial={{ opacity: 0.2, y: 50 }}
        transition={{ duration: 0.3 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="relative bg-white p-10 rounded-xl text-slate-500"
      >
        <h1 className="text-center text-2xl text-neutral-700 font-medium">{state}</h1>
        <p className="text-center text-sm">Welcome! Please sign in to continue</p>

        {state !== 'Login' && (
          <>
            <div className="border px-6 py-2 flex items-center gap-2 rounded-full mt-4">
              <img className="h-5" src={assets.profile_icon} alt="" />
              <input
                onChange={(e) => setName(e.target.value)}
                value={name}
                type="text"
                className="outline-none text-sm"
                placeholder="Full name"
                required
              />
            </div>

            {/* 🧍 Username input */}
            <div className="border px-6 py-2 flex items-center gap-2 rounded-full mt-4">
              <img className="h-5" src={assets.profile_icon} alt="" />
              <input
                onChange={(e) => setUsername(e.target.value)}
                value={username}
                type="text"
                className="outline-none text-sm"
                placeholder="Choose a username"
                required
              />
            </div>
            {username && (
              <p
                className={`text-xs mt-1 ${
                  usernameAvailable === null
                    ? 'text-gray-400'
                    : usernameAvailable
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}
              >
                {checkingUsername
                  ? 'Checking...'
                  : usernameAvailable === null
                  ? ''
                  : usernameAvailable
                  ? 'Username available ✓'
                  : 'Username already taken ✗'}
              </p>
            )}
          </>
        )}

        <div className="border px-6 py-2 flex items-center gap-2 rounded-full mt-4">
          <img src={assets.email_icon} alt="" />
          <input
            onChange={(e) => setEmail(e.target.value)}
            value={email}
            type="email"
            className="outline-none text-sm"
            placeholder="Email id"
            required
          />
        </div>

        <div className="border px-6 py-2 flex items-center gap-2 rounded-full mt-4">
          <img src={assets.lock_icon} alt="" />
          <input
            onChange={(e) => setPassword(e.target.value)}
            value={password}
            type="password"
            className="outline-none text-sm"
            placeholder="Password"
            required
          />
        </div>

        <p className="text-sm text-blue-600 my-4 cursor-pointer">Forgot Password?</p>

        <button className="bg-blue-600 w-full text-white py-2 rounded-full">
          {state === 'Login' ? 'Login' : 'Create Account'}
        </button>

        {state === 'Login' ? (
          <p className="mt-5 text-center">
            Don't have an account?
            <span className="text-blue-600 cursor-pointer" onClick={() => setState('Sign Up')}>
              Sign up
            </span>
          </p>
        ) : (
          <p className="mt-5 text-center">
            Already have an account?
            <span className="text-blue-600 cursor-pointer" onClick={() => setState('Login')}>
              Log in
            </span>
          </p>
        )}

        <img
          onClick={() => setShowLogin(false)}
          src={assets.cross_icon}
          alt=""
          className="absolute top-5 right-5 cursor-pointer"
        />
      </motion.form>
    </div>
  )
}

export default Login
