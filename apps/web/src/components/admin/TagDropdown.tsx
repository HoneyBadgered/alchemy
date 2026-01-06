'use client';

/**
 * Tag Dropdown Component
 * 
 * Reusable multi-select and single-select dropdown for admin tag management.
 * Supports max selection limits, required fields, and custom styling.
 */

import { useState, useRef, useEffect } from 'react';
import type { TagOption } from '@alchemy/types';

interface TagDropdownProps {
  label: string;
  description?: string;
  value: string | string[];
  options: TagOption[];
  onChange: (value: string | string[]) => void;
  multiSelect?: boolean;
  maxSelections?: number;
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
}

export default function TagDropdown({
  label,
  description,
  value,
  options,
  onChange,
  multiSelect = false,
  maxSelections,
  required = false,
  placeholder = 'Select...',
  disabled = false,
}: TagDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get selected values as array
  const selectedValues = Array.isArray(value) ? value : value ? [value] : [];

  // Check if selection limit reached
  const isMaxReached = multiSelect && maxSelections ? selectedValues.length >= maxSelections : false;

  // Handle option toggle
  const handleToggle = (optionValue: string) => {
    if (disabled) return;

    if (multiSelect) {
      const newValues = selectedValues.includes(optionValue)
        ? selectedValues.filter(v => v !== optionValue)
        : isMaxReached
        ? selectedValues
        : [...selectedValues, optionValue];
      
      onChange(newValues);
    } else {
      onChange(optionValue);
      setIsOpen(false);
    }
  };

  // Get display text
  const getDisplayText = () => {
    if (selectedValues.length === 0) return placeholder;
    
    if (multiSelect) {
      return selectedValues
        .map(v => options.find(opt => opt.value === v)?.label || v)
        .join(', ');
    }
    
    return options.find(opt => opt.value === value)?.label || value;
  };

  // Get option label
  const getOptionLabel = (option: TagOption) => {
    const count = selectedValues.length;
    const limitText = maxSelections ? ` (${count}/${maxSelections})` : '';
    
    if (option.description) {
      return (
        <div>
          <div className="font-medium">{option.label}</div>
          <div className="text-xs text-gray-500">{option.description}</div>
        </div>
      );
    }
    
    return option.label;
  };

  return (
    <div className="space-y-1" ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
        {multiSelect && maxSelections && (
          <span className="text-xs text-gray-500 ml-2">
            (max {maxSelections})
          </span>
        )}
      </label>
      
      {description && (
        <p className="text-xs text-gray-500">{description}</p>
      )}

      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`
            w-full px-3 py-2 text-left bg-white border rounded-md shadow-sm
            focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500
            ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'cursor-pointer hover:border-gray-400'}
            ${selectedValues.length === 0 ? 'text-gray-400' : 'text-gray-900'}
          `}
        >
          <div className="flex items-center justify-between">
            <span className="block truncate">{getDisplayText()}</span>
            <svg
              className={`h-5 w-5 text-gray-400 transition-transform ${isOpen ? 'transform rotate-180' : ''}`}
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </button>

        {isOpen && (
          <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
            {options.map((option) => {
              const isSelected = selectedValues.includes(option.value);
              const isDisabled = multiSelect && !isSelected && isMaxReached;

              return (
                <div
                  key={option.value}
                  onClick={() => !isDisabled && handleToggle(option.value)}
                  className={`
                    cursor-pointer select-none relative py-2 pl-3 pr-9
                    ${isSelected ? 'bg-amber-50 text-amber-900' : 'text-gray-900'}
                    ${isDisabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-gray-100'}
                  `}
                >
                  <div className="flex items-start">
                    {multiSelect && (
                      <div className="flex items-center h-5 mr-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          disabled={isDisabled}
                          className="h-4 w-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      {getOptionLabel(option)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {multiSelect && selectedValues.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {selectedValues.map(v => {
            const option = options.find(opt => opt.value === v);
            return (
              <span
                key={v}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800"
              >
                {option?.label || v}
                <button
                  type="button"
                  onClick={() => handleToggle(v)}
                  disabled={disabled}
                  className="ml-1.5 inline-flex items-center justify-center h-4 w-4 rounded-full text-amber-400 hover:bg-amber-200 hover:text-amber-500 focus:outline-none"
                >
                  <span className="sr-only">Remove {option?.label || v}</span>
                  <svg className="h-2 w-2" stroke="currentColor" fill="none" viewBox="0 0 8 8">
                    <path strokeLinecap="round" strokeWidth="1.5" d="M1 1l6 6m0-6L1 7" />
                  </svg>
                </button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
