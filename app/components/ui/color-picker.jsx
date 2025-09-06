"use client"

import { useState, useRef, useEffect } from "react"
import { SketchPicker } from "react-color"
import { Input } from "@/app/components/ui/input"
import { Button } from "@/app/components/ui/button"
import { Pipette } from "lucide-react"

// Brand color presets - can be customized per project
const BRAND_PRESETS = [
    '#8B5CF6', // Purple
    '#6366F1', // Indigo
    '#3B82F6', // Blue
    '#0EA5E9', // Sky
    '#10B981', // Emerald
    '#EF4444', // Red
    '#F59E0B', // Amber
    '#EC4899', // Pink
    '#000000', // Black
    '#FFFFFF', // White
    '#6B7280', // Gray
    '#F3F4F6', // Light Gray
    '#DC2626', // Red 600
    '#16A34A', // Green 600
    '#2563EB', // Blue 600
    '#7C3AED', // Violet 600
    '#DB2777', // Pink 600
    '#EA580C', // Orange 600
]

export function ColorPicker({ 
    value = '#000000', 
    onChange, 
    className = '',
    presets = BRAND_PRESETS,
    showAlpha = false,
    disabled = false
}) {
    const [isOpen, setIsOpen] = useState(false)
    const [inputValue, setInputValue] = useState(value)
    const [supportsEyeDropper, setSupportsEyeDropper] = useState(false)
    const containerRef = useRef(null)

    // Update input value when prop changes
    useEffect(() => {
        setInputValue(value)
    }, [value])

    // Check if EyeDropper API is supported
    useEffect(() => {
        setSupportsEyeDropper('EyeDropper' in window)
    }, [])

    // Close picker when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false)
            }
        }

        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const handleInputChange = (e) => {
        const newValue = e.target.value
        setInputValue(newValue)
        
        // Validate hex color (support 3, 6, or 8 character hex)
        if (/^#([0-9A-F]{3}|[0-9A-F]{6}|[0-9A-F]{8})$/i.test(newValue)) {
            onChange({ target: { value: newValue } })
        }
    }

    const handleInputBlur = () => {
        // If invalid, reset to current value
        if (!/^#([0-9A-F]{3}|[0-9A-F]{6}|[0-9A-F]{8})$/i.test(inputValue)) {
            setInputValue(value)
        }
    }

    const handleColorChange = (color) => {
        const newValue = showAlpha ? `rgba(${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b}, ${color.rgb.a})` : color.hex
        setInputValue(newValue)
        onChange({ target: { value: newValue } })
    }

    const handleEyeDropper = async () => {
        if (!supportsEyeDropper) {
            alert('The eye dropper tool is only available in Chrome and Edge browsers.')
            return
        }

        try {
            const eyeDropper = new window.EyeDropper()
            const result = await eyeDropper.open()
            setInputValue(result.sRGBHex)
            onChange({ target: { value: result.sRGBHex } })
        } catch (err) {
            // User canceled or error occurred
            console.log('Eye dropper canceled or failed:', err)
        }
    }

    const handleClick = () => {
        if (!disabled) {
            setIsOpen(!isOpen)
        }
    }

    return (
        <div ref={containerRef} className={`relative ${className}`}>
            <div className="flex gap-2">
                {/* Color Preview Button */}
                <button
                    type="button"
                    onClick={handleClick}
                    disabled={disabled}
                    className={`
                        w-12 h-10 rounded-lg border-2 border-gray-200 shadow-sm transition-colors
                        focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2
                        ${disabled ? 'cursor-not-allowed opacity-50' : 'hover:border-gray-300 cursor-pointer'}
                    `}
                    style={{ backgroundColor: value }}
                    aria-label="Open color picker"
                >
                    <span className="sr-only">Color: {value}</span>
                </button>

                {/* Hex Input */}
                <Input
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    onBlur={handleInputBlur}
                    disabled={disabled}
                    placeholder="#000000"
                    className="flex-1 font-mono text-sm"
                    maxLength={showAlpha ? 9 : 7}
                />
                
                {/* EyeDropper Button */}
                {supportsEyeDropper && (
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleEyeDropper}
                        disabled={disabled}
                        className="h-10 w-10 p-0"
                        title="Pick color from screen (Chrome/Edge only)"
                    >
                        <Pipette className="h-4 w-4" />
                    </Button>
                )}
            </div>

            {/* Color Picker Dropdown */}
            {isOpen && !disabled && (
                <div className="absolute top-full left-0 mt-2 z-50">
                    <div className="shadow-xl rounded-lg overflow-hidden">
                        <SketchPicker
                            color={value}
                            onChange={handleColorChange}
                            disableAlpha={!showAlpha}
                            presetColors={presets}
                            width={240}
                        />
                    </div>
                    {!supportsEyeDropper && (
                        <div className="mt-2 p-2 bg-gray-100 rounded text-xs text-gray-600 text-center">
                            Eye dropper tool is only available in Chrome/Edge
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}