"use client";

import { motion } from "framer-motion";
import {
  ChevronLeft,
  Signal,
  Wifi,
  BatteryFull,
} from "lucide-react";

export function PhoneMockup() {
  return (
    <div className="relative w-[340px] h-[680px] bg-white rounded-[3.5rem] shadow-[0_30px_60px_-15px_rgba(32,65,71,0.15)] border-[8px] border-white overflow-hidden z-10 transform rotate-[-2deg] hover:rotate-0 transition-transform duration-1000 ease-out">
      {/* Status Bar */}
      <div className="absolute top-0 w-full h-10 bg-white z-20 flex justify-between px-8 items-center text-[10px] font-medium text-gray-300">
        <span>9:41</span>
        <div className="flex gap-1.5">
          <Signal className="w-3 h-3" />
          <Wifi className="w-3 h-3" />
          <BatteryFull className="w-3 h-3" />
        </div>
      </div>

      {/* Chat Interface */}
      <div className="w-full h-full bg-[#faf9f6] pt-14 px-5 flex flex-col gap-6 overflow-hidden relative">
        {/* Header inside phone */}
        <div className="absolute top-0 left-0 w-full h-24 bg-white/60 backdrop-blur-md z-10 border-b border-gray-100/50 flex items-end pb-4 px-6">
          <div className="flex items-center gap-4 w-full justify-center relative">
            <div className="absolute left-0 text-teal-900/40">
              <ChevronLeft className="w-5 h-5" />
            </div>
            <div className="text-center">
              <div className="font-serif text-xl font-medium tracking-[2px] text-navy">
                Entiremind
              </div>
              <div className="text-[9px] text-gray-400 uppercase tracking-widest font-sans mt-0.5">
                Always listening
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="mt-16 flex flex-col gap-6">
          {/* System Message */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="self-start max-w-[90%]"
          >
            <div className="bg-white p-5 rounded-2xl rounded-tl-sm shadow-sm border border-gray-100/50 text-[15px] text-teal-900 leading-relaxed font-serif">
              Good morning. What is one thing you wish to manifest into reality
              today?
            </div>
            <span className="text-[9px] text-gray-300 ml-2 mt-1.5 block font-sans">
              8:00 AM
            </span>
          </motion.div>

          {/* User Message */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="self-end max-w-[90%]"
          >
            <div className="bg-navy p-5 rounded-2xl rounded-tr-sm shadow-sm text-[15px] text-cream leading-relaxed font-serif font-light">
              I want to feel more present with my work.
            </div>
            <span className="text-[9px] text-gray-300 text-right mr-2 mt-1.5 block font-sans">
              8:05 AM
            </span>
          </motion.div>

          {/* System Message */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="self-start max-w-[90%]"
          >
            <div className="bg-white p-5 rounded-2xl rounded-tl-sm shadow-sm border border-gray-100/50 text-[15px] text-teal-900 leading-relaxed font-serif">
              Understood. When you feel distraction rising, simply reply with
              &ldquo;Anchor&rdquo;. I will remind you of this intention.
            </div>
            <span className="text-[9px] text-gray-300 ml-2 mt-1.5 block font-sans">
              8:06 AM
            </span>
          </motion.div>

          {/* Typing Indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="self-start mt-2"
          >
            <div className="bg-gray-100 px-4 py-3 rounded-full flex gap-1 w-fit">
              <div className="w-1 h-1 bg-gray-300 rounded-full animate-bounce" />
              <div
                className="w-1 h-1 bg-gray-300 rounded-full animate-bounce"
                style={{ animationDelay: "0.1s" }}
              />
              <div
                className="w-1 h-1 bg-gray-300 rounded-full animate-bounce"
                style={{ animationDelay: "0.2s" }}
              />
            </div>
          </motion.div>
        </div>

        {/* Input Area Mockup */}
        <div className="absolute bottom-0 left-0 w-full p-6 bg-white/80 backdrop-blur-sm border-t border-gray-50">
          <div className="w-full h-12 bg-gray-50 rounded-full flex items-center px-5 text-gray-300 text-sm font-light border border-gray-100">
            Text Message...
          </div>
        </div>
      </div>
    </div>
  );
}
