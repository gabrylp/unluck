import { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

export function Input({ label, className = '', id, ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-white/60">
          {label}
        </label>
      )}
      <input
        id={id}
        className={`glass rounded-none px-3 py-2.5 text-sm text-white/90 outline-none transition-all placeholder:text-white/30 focus:bg-white/10 focus:border-white/30 ${className}`}
        {...props}
      />
    </div>
  )
}
