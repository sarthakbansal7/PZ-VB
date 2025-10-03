"use client";

import React from 'react';
import { Star, Quote } from 'lucide-react';

const testimonials = [
  {
    id: 1,
    name: "Sarah Chen",
    role: "HR Director",
    company: "TechFlow Inc.",
    image: "https://images.unsplash.com/photo-1494790108755-2616b332c647?w=150&h=150&fit=crop&crop=face",
    content: "VietBuild-Pay revolutionized our payroll process. The governance integration for our DAO operations is seamless, and the transparent payment system has improved trust across our organization.",
    rating: 5,
    category: "payroll"
  },
  {
    id: 2,
    name: "Marcus Rodriguez",
    role: "Community Manager",
    company: "CryptoVerse DAO",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    content: "The airdrop distribution system saved us weeks of manual work. We distributed tokens to 10,000+ community members in minutes with their batch processing feature.",
    rating: 5,
    category: "airdrop"
  },
  {
    id: 3,
    name: "Emily Watson",
    role: "Finance Lead",
    company: "BuildDAO",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
    content: "The governance-linked payroll system ensures complete transparency. Every payment is tied to proposals, making our DAO operations truly decentralized and accountable.",
    rating: 5,
    category: "dao"
  },
  {
    id: 4,
    name: "David Kim",
    role: "Operations Manager",
    company: "StartupHub",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    content: "The CSV bulk upload feature is a game-changer. Managing hundreds of employee payments has never been easier. The interface is intuitive and the process is lightning fast.",
    rating: 5,
    category: "payroll"
  },
  {
    id: 5,
    name: "Lisa Thompson",
    role: "Blockchain Developer",
    company: "Web3 Collective",
    image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop&crop=face",
    content: "Multi-chain support is phenomenal. We run airdrops across Ethereum, BSC, and Polygon seamlessly. The gas optimization features save us thousands in transaction fees.",
    rating: 5,
    category: "airdrop"
  },
  {
    id: 6,
    name: "James Wilson",
    role: "Treasury Manager",
    company: "DeFi Guild",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
    content: "The multi-sig integration with our DAO treasury is flawless. Every payment requires proper governance approval, ensuring complete decentralization and security.",
    rating: 5,
    category: "dao"
  },
  {
    id: 7,
    name: "Anna Martinez",
    role: "People Operations",
    company: "RemoteFirst Co.",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face",
    content: "Global payroll has never been this simple. The platform handles different currencies and payment methods effortlessly. Our remote team gets paid on time, every time.",
    rating: 5,
    category: "payroll"
  },
  {
    id: 8,
    name: "Roberto Silva",
    role: "Community Lead",
    company: "GameFi Alliance",
    image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&h=150&fit=crop&crop=face",
    content: "The gamification features in their airdrop system increased our community engagement by 300%. Users love the interactive distribution process and real-time tracking.",
    rating: 5,
    category: "airdrop"
  }
];

const TestimonialsSection = () => {
  return (
    <section className="py-20 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 overflow-hidden">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Trusted by{' '}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Industry Leaders
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            See how organizations worldwide are transforming their payment operations with VietBuild-Pay
          </p>
        </div>

        {/* Scrolling Testimonials Container */}
        <div className="relative">
          {/* Gradient Overlays for fade effect */}
          <div className="absolute left-0 top-0 w-32 h-full bg-gradient-to-r from-slate-50 via-blue-50 to-transparent z-10 pointer-events-none"></div>
          <div className="absolute right-0 top-0 w-32 h-full bg-gradient-to-l from-slate-50 via-blue-50 to-transparent z-10 pointer-events-none"></div>
          
          {/* First Row - Left to Right */}
          <div className="mb-8">
            <div className="flex animate-scroll-left space-x-6">
              {/* Duplicate testimonials for seamless loop */}
              {[...testimonials, ...testimonials].map((testimonial, index) => (
                <TestimonialCard key={`row1-${index}`} testimonial={testimonial} />
              ))}
            </div>
          </div>

          {/* Second Row - Right to Left */}
          <div className="mb-8">
            <div className="flex animate-scroll-right space-x-6">
              {/* Reverse and duplicate for opposite direction */}
              {[...testimonials.slice().reverse(), ...testimonials.slice().reverse()].map((testimonial, index) => (
                <TestimonialCard key={`row2-${index}`} testimonial={testimonial} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes scroll-left {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        @keyframes scroll-right {
          0% {
            transform: translateX(-50%);
          }
          100% {
            transform: translateX(0);
          }
        }

        .animate-scroll-left {
          animation: scroll-left 60s linear infinite;
          width: fit-content;
        }

        .animate-scroll-right {
          animation: scroll-right 60s linear infinite;
          width: fit-content;
        }

        .animate-scroll-left:hover,
        .animate-scroll-right:hover {
          animation-play-state: paused;
        }
      `}</style>
    </section>
  );
};

const TestimonialCard = ({ testimonial }: { testimonial: typeof testimonials[0] }) => {
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'payroll':
        return 'from-green-500 to-emerald-500';
      case 'airdrop':
        return 'from-purple-500 to-violet-500';
      case 'dao':
        return 'from-orange-500 to-amber-500';
      default:
        return 'from-blue-500 to-indigo-500';
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'payroll':
        return { text: 'Payroll', emoji: '💼' };
      case 'airdrop':
        return { text: 'Airdrop', emoji: '🎯' };
      case 'dao':
        return { text: 'DAO', emoji: '🏛️' };
      default:
        return { text: 'Platform', emoji: '⚡' };
    }
  };

  const categoryInfo = getCategoryBadge(testimonial.category);

  return (
    <div className="flex-shrink-0 w-96 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-gray-100 hover:scale-105">
      {/* Category Badge */}
      <div className="flex justify-between items-start mb-4">
        <div className={`px-3 py-1 rounded-full text-xs font-medium text-white bg-gradient-to-r ${getCategoryColor(testimonial.category)}`}>
          {categoryInfo.emoji} {categoryInfo.text}
        </div>
        <Quote className="text-gray-300" size={24} />
      </div>

      {/* Content */}
      <p className="text-gray-700 text-sm leading-relaxed mb-6 line-clamp-4">
        "{testimonial.content}"
      </p>

      {/* Rating */}
      <div className="flex items-center mb-4">
        {[...Array(testimonial.rating)].map((_, i) => (
          <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
        ))}
      </div>

      {/* User Info */}
      <div className="flex items-center">
        <img
          src={testimonial.image}
          alt={testimonial.name}
          className="w-12 h-12 rounded-full object-cover mr-4"
        />
        <div>
          <h4 className="font-semibold text-gray-900 text-sm">{testimonial.name}</h4>
          <p className="text-gray-600 text-xs">{testimonial.role}</p>
          <p className="text-gray-500 text-xs">{testimonial.company}</p>
        </div>
      </div>
    </div>
  );
};

export default TestimonialsSection;
