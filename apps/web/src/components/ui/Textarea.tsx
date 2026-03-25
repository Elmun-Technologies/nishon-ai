import React from 'react'

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export function Textarea({ className = '', ...props }: TextareaProps) {
  return (
    <textarea
      className={`w-full px-3 py-2 bg-[#2A2A3A] border border-[#3A3A4A] rounded-lg text-white placeholder-[#6B7280] focus:outline-none focus:border-[#7C3AED] resize-none ${className}`}
      {...props}
    />
  )
}
