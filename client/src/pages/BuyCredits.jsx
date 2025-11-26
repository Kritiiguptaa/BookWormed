import React, { useContext } from 'react'
import { assets, plans } from '../assests/assets.js'
import {AppContext} from '../context/AppContext'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import axios from 'axios'
const Subscription = () => {

  const {user,backendUrl,loadSubscriptionData,token,setShowLogin,subscription}=useContext(AppContext)

  const navigate=useNavigate()

  const initPay=async (order)=>{
    // Defensive checks and logging to help diagnose why checkout may not open
    try {
      const key = import.meta.env.VITE_RAZORPAY_KEY_ID;
      console.log('initPay called with order:', order);
      console.log('Razorpay key:', key ? '[present]' : '[missing]');

      if (!key) {
        toast.error('Razorpay key not configured (VITE_RAZORPAY_KEY_ID)');
        return;
      }

      if (!window || !window.Razorpay) {
        console.error('window.Razorpay is undefined. Checkout script may not have loaded.');
        toast.error('Payment SDK not loaded. Check console for details.');
        return;
      }

      const options = {
        key,
        amount: order.amount,
        currency: order.currency,
        name: 'Subscription Payment',
        description: 'Premium Subscription',
        order_id: order.id,
        receipt: order.receipt,
        handler: async(response)=>{
          try{
            console.log('Razorpay handler response:', response);
            const {data}=await axios.post(backendUrl+'/api/user/verify-razor',response,{headers:{token}})
            console.log('verify-razor response:', data);
            if(data.success){
              loadSubscriptionData();
              navigate('/')
              toast.success('Subscription activated!')
            } else {
              toast.error(data.message || 'Verification failed')
            }
          }catch(error){
            console.error('Error verifying razorpay payment:', error);
            toast.error(error.response?.data?.message || error.message)
          }
        }
      }

      const rzp = new window.Razorpay(options)
      rzp.open()
    } catch (err) {
      console.error('initPay error:', err)
      toast.error(err.message || 'Payment initiation failed')
    }
  }

  const paymentRazorpay = async(planId)=>{
    try{
      if(!user){
        setShowLogin(true)
        return
      }

      console.log('Requesting order for plan:', planId)
      const {data}= await axios.post(backendUrl + '/api/user/pay-razor', {planId},{headers:{token}})
      console.log('pay-razor response:', data)
      if(data && data.success && data.order){
        initPay(data.order)
      } else {
        toast.error(data?.message || 'Failed to create order')
      }
    }catch(error){
      console.error('paymentRazorpay error:', error)
      toast.error(error.response?.data?.message || error.message)
    }
  }

  return (
    <motion.div 
    initial={{opacity:0.2,y:100}}
    transition={{duration:1}}
    whileInView={{opacity:1, y:0}}
    viewport={{once:true}}
    
    className='min-h-[80vh] text-center pt-14 mb-10'>
      <button className='text-white border border-gray-400 px-10 py-2 rounded-full mb-6'>Premium Subscription</button>
      <h1 className='text-white text-center text-3xl font-medium mb-4'>Choose Your Plan</h1>
      
      {/* Trial Info Banner */}
      {subscription?.status === 'trial' && subscription?.trialEndsAt && (
        <div className='bg-yellow-500/20 border border-yellow-500 text-yellow-300 px-6 py-3 rounded-lg mb-6 mx-auto max-w-2xl'>
          <p className='font-medium'>🎉 Your free trial is active until {new Date(subscription.trialEndsAt).toLocaleDateString()}</p>
        </div>
      )}
      
      {!user && (
        <div className='bg-blue-500/20 border border-blue-500 text-blue-300 px-6 py-3 rounded-lg mb-6 mx-auto max-w-2xl'>
          <p className='font-medium'>✨ Get 1 month FREE trial when you sign up!</p>
        </div>
      )}

      <div className='flex flex-wrap justify-center gap-6 text-left'>
        {plans.map((item,index)=>(
          <div key={index} className='bg-white drop-shadow-sm border rounded-lg py-12 px-8 text-gray-600 
          hover:scale-105 transition-all duration-500'>
            <img width={40} src={assets.credit_star} alt=''/>
            <p className='mt-3 mb-1 font-semibold text-2xl'>{item.id}</p>
            <p className='text-sm mb-4'>{item.desc} </p>
            <p className='mt-6'>
              <span className='text-3xl font-medium'>₹{item.price}</span>/{item.duration}</p>
              
            {/* Premium Features List */}
            <div className='mt-6 mb-6 space-y-2'>
              <p className='text-sm flex items-center gap-2'>
                <span className='text-green-500'>✓</span> Unlimited Book Lists
              </p>
              <p className='text-sm flex items-center gap-2'>
                <span className='text-green-500'>✓</span> Personalized Recommendations
              </p>
              <p className='text-sm flex items-center gap-2'>
                <span className='text-green-500'>✓</span> Advanced Features
              </p>
            </div>
            
            <button 
              onClick={()=>paymentRazorpay(item.id)} 
              className='w-full bg-gray-800 text-white mt-8 text-sm rounded-md py-2.5 min-w-52'
              disabled={subscription?.status === 'active'}
            >
              {subscription?.status === 'active' ? 'Current Plan' : user ? 'Subscribe' : 'Get Started'} 
            </button>
          </div>
        ))}
      </div>

    </motion.div>
  )
}

export default Subscription


