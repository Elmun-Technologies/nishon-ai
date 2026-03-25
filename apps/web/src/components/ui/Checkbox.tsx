import React from 'react'

interface CheckboxProps {
  id?: string
  checked?: boolean
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  disabled?: boolean
  className?: string
}

export function Checkbox({ id, checked, onChange, disabled, className = '' }: CheckboxProps) {
  return (
    <input
      type="checkbox"
      id={id}
      checked={checked}
      onChange={onChange}
      disabled={disabled}
      className={`w-4 h-4 accent-[#7C3AED] cursor-pointer ${className}`}
    />
  )
}
