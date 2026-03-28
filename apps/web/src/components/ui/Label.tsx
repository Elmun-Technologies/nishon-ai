import * as React from 'react'
import { cn } from '@/lib/utils'

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean
}

export function Label({ children, required, className, ...props }: LabelProps) {
  return (
    <label className={cn('block text-sm font-medium text-[#9CA3AF] mb-1', className)} {...props}>
      {children}
      {required && <span className="text-red-400 ml-1">*</span>}
    </label>
  )
}
