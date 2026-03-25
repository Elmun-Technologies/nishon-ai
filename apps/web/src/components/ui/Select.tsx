import React from 'react'

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  children?: React.ReactNode
}

export function Select({ children, className = '', ...props }: SelectProps) {
  return (
    <select
      className={`w-full px-3 py-2 bg-[#2A2A3A] border border-[#3A3A4A] rounded-lg text-white focus:outline-none focus:border-[#7C3AED] ${className}`}
      {...props}
    >
      {children}
    </select>
  )
}
