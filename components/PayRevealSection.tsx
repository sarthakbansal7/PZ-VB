'use client'

import { RevealText } from '@/components/reveal-text'
import { CircularRevealHeading } from '@/components/ui/circular-reveal-heading'
import { motion } from "framer-motion"
import { useState, useEffect, useRef } from "react"

// Web3 payments platform items for circular reveal
const paymentItems = [
  {
    text: "INSTANT",
    image: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"
  },
  {
    text: "SECURE",
    image: "https://images.unsplash.com/photo-1563986768609-322da13575f3?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"
  },
  {
    text: "GLOBAL",
    image: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"
  },
  {
    text: "AUTOMATED",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"
  }
]

// Custom component for ANYWHERE that shows images by default
function AnywhereRevealText({ shouldAnimate }: { shouldAnimate: boolean }) {
  const [showRedText, setShowRedText] = useState(false)
  const text = "ANYWHERE"
  const letterImages = [
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80", // A
    "https://images.unsplash.com/photo-1469474968028-56623f02e42e?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80", // N
    "https://images.unsplash.com/photo-1518837695005-2083093ee35b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80", // Y
    "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80", // W
    "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80", // H
    "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80", // E
    "https://images.unsplash.com/photo-1519904981063-b0cf448d479e?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80", // R
    "https://images.unsplash.com/photo-1540979388789-6cee28a1cdc9?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80", // E
  ]
  
  useEffect(() => {
    if (shouldAnimate) {
      const timer = setTimeout(() => {
        setShowRedText(true)
      }, 1200) // Delay for overlay effect
      
      return () => clearTimeout(timer)
    }
  }, [shouldAnimate])

  return (
    <div className="flex justify-start">
      <div className="flex">
        {text.split("").map((letter, index) => (
          <motion.span
            key={index}
            className="text-4xl md:text-6xl lg:text-8xl font-black tracking-tight relative overflow-hidden"
            initial={{ scale: 0, opacity: 0 }}
            animate={shouldAnimate ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
            transition={{
              delay: shouldAnimate ? (index * 0.12) + 0.5 : 0, // Start after other texts
              type: "spring",
              damping: 8,
              stiffness: 200,
              mass: 0.8,
            }}
          >
            {/* Image text layer always visible */}
            <motion.span
              className="text-transparent bg-clip-text bg-cover bg-no-repeat"
              animate={shouldAnimate ? { 
                backgroundPosition: "10% center"
              } : {}}
              transition={{ 
                backgroundPosition: { 
                  duration: 3,
                  ease: "easeInOut",
                  repeat: Infinity,
                  repeatType: "reverse"
                }
              }}
              style={{
                backgroundImage: `url('${letterImages[index % letterImages.length]}')`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {letter}
            </motion.span>
            
            {/* Overlay text layer */}
            {showRedText && shouldAnimate && (
              <motion.span
                className="absolute inset-0 text-sky-500 pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 1, 0] }}
                transition={{
                  delay: index * 0.05,
                  duration: 0.4,
                  times: [0, 0.1, 0.7, 1],
                  ease: "easeInOut"
                }}
              >
                {letter}
              </motion.span>
            )}
          </motion.span>
        ))}
      </div>
    </div>
  )
}

export default function PayRevealSection() {
  const [isInView, setIsInView] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isInView) {
          setIsInView(true)
        }
      },
      {
        threshold: 0.3, // Trigger when 30% of the section is visible
        rootMargin: '-50px 0px' // Start animation slightly before the section is fully visible
      }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current)
      }
    }
  }, [isInView])

  return (
    <section ref={sectionRef} className="py-20 bg-gradient-to-b from-white to-gray-50">
      <div className="container mx-auto px-8 lg:px-16 max-w-7xl">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Content - Reveal Text */}
          <div className="space-y-4 text-left">
            <div className="flex justify-start">
              {isInView && (
                <RevealText 
                  text="PAY"
                  textColor="text-gray-900"
                  overlayColor="text-sky-500"
                  fontSize="text-4xl md:text-6xl lg:text-8xl"
                  letterDelay={0.08}
                  overlayDelay={0.05}
                  overlayDuration={0.4}
                  springDuration={600}
                />
              )}
            </div>
            <div className="flex justify-start">
              {isInView && (
                <RevealText 
                  text="ANYONE"
                  textColor="text-gray-900"
                  overlayColor="text-sky-500"
                  fontSize="text-4xl md:text-6xl lg:text-8xl"
                  letterDelay={0.1}
                  overlayDelay={0.05}
                  overlayDuration={0.4}
                  springDuration={600}
                />
              )}
            </div>
            <AnywhereRevealText shouldAnimate={isInView} />
            
            <p className="mt-12 text-xl text-gray-600 max-w-2xl">
              Experience seamless Web3 payments across multiple networks with our cutting-edge platform
            </p>
          </div>

          {/* Right Content - Circular Reveal */}
          <div className="flex items-center justify-center lg:justify-end">
            {isInView && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ 
                  delay: 1.5, // Start after text animations
                  duration: 0.8,
                  type: "spring",
                  damping: 20,
                  stiffness: 100
                }}
              >
                <CircularRevealHeading
                  items={paymentItems}
                  centerText={
                    <div className="text-lg font-bold text-[#444444] text-center">
                      <div className="text-sky-600">PayZoll</div>
                      <div className="text-sm text-gray-500 mt-1">Web3 Payments</div>
                    </div>
                  }
                  size="lg"
                />
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}