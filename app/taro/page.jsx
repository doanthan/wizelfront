"use client";

import { useState, useEffect, useRef } from 'react';
import {
  Smartphone, Download, Upload, Palette, Type,
  Image as ImageIcon, Sparkles, QrCode, Barcode as BarcodeIcon,
  Settings, RotateCw, Grid, Sliders
} from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import QRCode from 'qrcode';
import Barcode from 'react-barcode';

export default function TaroWalletDesigner() {
  const [deviceType, setDeviceType] = useState('iphone'); // 'iphone' or 'android'
  const [codeType, setCodeType] = useState('qr'); // 'qr' or 'barcode'
  const [isFlipped, setIsFlipped] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const canvasRef = useRef(null);

  const [cardConfig, setCardConfig] = useState({
    // Branding
    brandName: 'Your Brand',
    cardTitle: 'Loyalty Card',
    description: 'Member since 2025',
    memberNumber: '1234567890',
    logoUrl: '',

    // Colors
    backgroundColor: '#8B5CF6',
    backgroundGradient: 'linear',
    secondaryColor: '#7C3AED',
    textColor: '#FFFFFF',
    secondaryTextColor: '#E0E7FF',
    accentColor: '#60A5FA',

    // Style
    borderRadius: 16,
    pattern: 'none', // 'none', 'dots', 'lines', 'grid'
    font: 'sans', // 'sans', 'serif', 'mono'
    cardHeight: 'normal', // 'compact', 'normal', 'tall'
    shadowIntensity: 'medium',

    // Code settings
    codeData: 'https://yourstore.com/member/1234567890',
    barcodeFormat: 'CODE128',
  });

  // Generate QR code
  useEffect(() => {
    if (codeType === 'qr' && cardConfig.codeData) {
      QRCode.toDataURL(cardConfig.codeData, {
        width: 200,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        }
      }).then(setQrCodeUrl).catch(err => {
        console.error('QR Code generation error:', err);
      });
    }
  }, [codeType, cardConfig.codeData]);

  const updateConfig = (field, value) => {
    setCardConfig(prev => ({ ...prev, [field]: value }));
  };

  const getCardHeight = () => {
    switch(cardConfig.cardHeight) {
      case 'compact': return 'h-[180px]';
      case 'tall': return 'h-[280px]';
      default: return 'h-[220px]';
    }
  };

  const getPatternStyle = () => {
    switch(cardConfig.pattern) {
      case 'dots':
        return {
          backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '20px 20px'
        };
      case 'lines':
        return {
          backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.05) 10px, rgba(255,255,255,0.05) 20px)`
        };
      case 'grid':
        return {
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)
          `,
          backgroundSize: '30px 30px'
        };
      default:
        return {};
    }
  };

  const getBackgroundStyle = () => {
    if (cardConfig.backgroundGradient === 'linear') {
      return {
        background: `linear-gradient(135deg, ${cardConfig.backgroundColor} 0%, ${cardConfig.secondaryColor} 100%)`,
        ...getPatternStyle()
      };
    } else if (cardConfig.backgroundGradient === 'radial') {
      return {
        background: `radial-gradient(circle at top left, ${cardConfig.backgroundColor} 0%, ${cardConfig.secondaryColor} 100%)`,
        ...getPatternStyle()
      };
    } else {
      return {
        backgroundColor: cardConfig.backgroundColor,
        ...getPatternStyle()
      };
    }
  };

  const getFontFamily = () => {
    switch(cardConfig.font) {
      case 'serif': return 'font-serif';
      case 'mono': return 'font-mono';
      default: return 'font-sans';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
                <Sparkles className="h-8 w-8 text-vivid-violet" />
                Taro Card Wallet Designer
              </h1>
              <p className="mt-2 text-gray-900 dark:text-gray-300">
                Design beautiful digital wallet cards for Apple Wallet and Google Pay
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setIsFlipped(!isFlipped)}
                className="hidden md:flex"
              >
                <RotateCw className="h-4 w-4 mr-2" />
                Flip Card
              </Button>
              <Button
                className="bg-gradient-to-r from-sky-blue to-vivid-violet hover:from-royal-blue hover:to-deep-purple text-white shadow-md hover:shadow-lg"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Card
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left Panel - Card Preview */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  Device Preview
                </h2>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={deviceType === 'iphone' ? 'default' : 'outline'}
                    onClick={() => setDeviceType('iphone')}
                    className={deviceType === 'iphone' ? 'bg-sky-blue hover:bg-royal-blue text-white' : ''}
                  >
                    <Smartphone className="h-4 w-4 mr-2" />
                    iPhone
                  </Button>
                  <Button
                    size="sm"
                    variant={deviceType === 'android' ? 'default' : 'outline'}
                    onClick={() => setDeviceType('android')}
                    className={deviceType === 'android' ? 'bg-sky-blue hover:bg-royal-blue text-white' : ''}
                  >
                    <Smartphone className="h-4 w-4 mr-2" />
                    Android
                  </Button>
                </div>
              </div>

              {/* Device Frame */}
              <div className="flex justify-center items-center py-12">
                {deviceType === 'iphone' ? (
                  // iPhone Frame
                  <div className="relative">
                    {/* Phone Body */}
                    <div className="relative bg-gray-900 rounded-[3.5rem] p-3 shadow-2xl w-[375px] h-[812px]">
                      {/* Dynamic Island */}
                      <div className="absolute top-3 left-1/2 transform -translate-x-1/2 w-[120px] h-[35px] bg-black rounded-full z-50 flex items-center justify-center">
                        <div className="w-2 h-2 bg-gray-700 rounded-full mr-4"></div>
                        <div className="w-12 h-3 bg-gray-800 rounded-full"></div>
                      </div>

                      {/* Screen */}
                      <div className="w-full h-full bg-gray-100 rounded-[3rem] overflow-hidden relative">
                        {/* Status Bar */}
                        <div className="absolute top-0 left-0 right-0 h-14 bg-transparent px-8 pt-3 flex justify-between items-start text-xs font-semibold text-gray-900 z-40">
                          <span>9:41</span>
                          <div className="flex gap-1 items-center">
                            <svg className="w-4 h-3" viewBox="0 0 16 12" fill="currentColor">
                              <rect x="0" y="3" width="4" height="6" rx="1" opacity="0.4"/>
                              <rect x="5" y="2" width="4" height="8" rx="1" opacity="0.6"/>
                              <rect x="10" y="0" width="4" height="12" rx="1"/>
                            </svg>
                            <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
                              <path d="M11 2H13V14H11V2Z" opacity="0.4"/>
                              <path d="M14 4.5V11.5C14 12.3 13.7 13 13.2 13.5C12.7 14 12 14 11.5 14H11V2H11.5C12 2 12.7 2 13.2 2.5C13.7 3 14 3.7 14 4.5Z"/>
                            </svg>
                          </div>
                        </div>

                        {/* Wallet Content */}
                        <div className="pt-14 pb-8 h-full overflow-hidden bg-white">
                          {/* Header */}
                          <div className="px-6 py-4 bg-gradient-to-b from-gray-50 to-white">
                            <h3 className="text-3xl font-bold text-gray-900">Wallet</h3>
                          </div>

                          {/* Card Stack */}
                          <div className="px-6 py-4 relative">
                            {/* Background cards for stacking effect */}
                            <div className="absolute left-8 right-8 top-8 h-[220px] bg-gray-300 rounded-2xl opacity-20 transform translate-y-3 scale-95"></div>
                            <div className="absolute left-7 right-7 top-6 h-[220px] bg-gray-300 rounded-2xl opacity-30 transform translate-y-2 scale-97"></div>

                            {/* Main Card */}
                            <div
                              className={`${getCardHeight()} rounded-2xl shadow-2xl overflow-hidden transform transition-all hover:scale-[1.02] cursor-pointer relative ${getFontFamily()}`}
                              style={getBackgroundStyle()}
                              onClick={() => setIsFlipped(!isFlipped)}
                            >
                              {!isFlipped ? (
                                // Front of card
                                <div
                                  className="h-full flex flex-col justify-between p-6 relative"
                                  style={{ color: cardConfig.textColor }}
                                >
                                  {/* Card Header */}
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <h4 className="text-2xl font-bold mb-1 leading-tight">
                                        {cardConfig.brandName}
                                      </h4>
                                      <p className="text-sm mt-1" style={{ color: cardConfig.secondaryTextColor }}>
                                        {cardConfig.cardTitle}
                                      </p>
                                    </div>
                                    {cardConfig.logoUrl && (
                                      <div className="w-14 h-14 bg-white bg-opacity-20 backdrop-blur-sm rounded-xl flex items-center justify-center ml-3">
                                        <div className="w-10 h-10 rounded-lg bg-white bg-opacity-40"></div>
                                      </div>
                                    )}
                                  </div>

                                  {/* Card Body */}
                                  <div className="flex-1 flex flex-col justify-center">
                                    <div>
                                      <p className="text-xs opacity-75 mb-1 uppercase tracking-wider">Member Number</p>
                                      <p className="text-xl font-bold tracking-wider font-mono">
                                        {cardConfig.memberNumber}
                                      </p>
                                    </div>
                                  </div>

                                  {/* Card Footer */}
                                  <div>
                                    <p className="text-xs" style={{ color: cardConfig.secondaryTextColor }}>
                                      {cardConfig.description}
                                    </p>
                                  </div>

                                  {/* Accent Strip */}
                                  <div
                                    className="absolute bottom-0 left-0 right-0 h-1.5"
                                    style={{ backgroundColor: cardConfig.accentColor }}
                                  />

                                  {/* Info Icon */}
                                  <div className="absolute bottom-4 right-4">
                                    <div className="w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs opacity-75">
                                      i
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                // Back of card - Code Display (maintains card style)
                                <div
                                  className="h-full flex flex-col items-center justify-center p-6 relative"
                                  style={{
                                    background: 'linear-gradient(to bottom, #f7f7f7 0%, #ffffff 100%)',
                                  }}
                                >
                                  {/* Card branding at top */}
                                  <div className="absolute top-4 left-0 right-0 text-center">
                                    <h4 className="text-base font-bold text-gray-900">
                                      {cardConfig.brandName}
                                    </h4>
                                    <p className="text-xs text-gray-600 mt-0.5">{cardConfig.cardTitle}</p>
                                  </div>

                                  {/* QR Code or Barcode - centered */}
                                  <div className="flex-1 flex items-center justify-center">
                                    {codeType === 'qr' ? (
                                      qrCodeUrl ? (
                                        <div className="bg-white p-3 rounded-lg shadow-sm">
                                          <img src={qrCodeUrl} alt="QR Code" className="w-44 h-44" />
                                        </div>
                                      ) : (
                                        <div className="bg-white p-3 rounded-lg shadow-sm w-44 h-44 flex items-center justify-center">
                                          <span className="text-xs text-gray-500">Generating QR...</span>
                                        </div>
                                      )
                                    ) : (
                                      <div className="bg-white p-4 rounded-lg shadow-sm">
                                        <Barcode
                                          value={cardConfig.memberNumber || '1234567890'}
                                          format={cardConfig.barcodeFormat}
                                          width={2}
                                          height={70}
                                          displayValue={true}
                                          fontSize={11}
                                          background="#FFFFFF"
                                          lineColor="#000000"
                                        />
                                      </div>
                                    )}
                                  </div>

                                  {/* Member number at bottom */}
                                  <div className="absolute bottom-4 left-0 right-0 text-center">
                                    <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">
                                      Member Number
                                    </p>
                                    <p className="text-sm text-gray-900 font-mono font-semibold tracking-wider">
                                      {cardConfig.memberNumber}
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Tap to use hint */}
                            <div className="mt-6 text-center">
                              <p className="text-sm text-gray-900 font-medium">
                                Tap to {isFlipped ? 'see card' : 'use card'}
                              </p>
                            </div>
                          </div>

                          {/* Additional Cards */}
                          <div className="px-6 mt-6">
                            <div className="bg-gray-100 rounded-2xl p-6 text-center border-2 border-dashed border-gray-300">
                              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-200 flex items-center justify-center">
                                <span className="text-2xl text-gray-900">+</span>
                              </div>
                              <p className="text-sm font-medium text-gray-900">Add Card</p>
                            </div>
                          </div>
                        </div>

                        {/* Home Indicator */}
                        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gray-900 rounded-full"></div>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Android Frame
                  <div className="relative">
                    <div className="relative bg-gray-900 rounded-[2.5rem] p-2 shadow-2xl w-[375px] h-[812px]">
                      {/* Screen */}
                      <div className="w-full h-full bg-white rounded-[2.2rem] overflow-hidden relative">
                        {/* Status Bar */}
                        <div className="bg-white px-6 py-3 flex justify-between items-center text-xs text-gray-900 font-medium">
                          <span>9:41 AM</span>
                          <div className="flex gap-2 items-center">
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z"/>
                            </svg>
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M15.67 4H14V2h-4v2H8.33C7.6 4 7 4.6 7 5.33v15.33C7 21.4 7.6 22 8.33 22h7.33c.74 0 1.34-.6 1.34-1.33V5.33C17 4.6 16.4 4 15.67 4z"/>
                            </svg>
                          </div>
                        </div>

                        {/* Google Pay Content */}
                        <div className="h-full overflow-hidden bg-gray-50">
                          {/* Header */}
                          <div className="bg-white px-6 py-5 shadow-sm">
                            <div className="flex items-center justify-between">
                              <h3 className="text-2xl font-bold text-gray-900">Passes</h3>
                              <Button size="sm" variant="ghost" className="text-sky-blue">
                                <Settings className="h-5 w-5" />
                              </Button>
                            </div>
                          </div>

                          {/* Cards */}
                          <div className="px-4 py-6">
                            {/* Main Card - Google Wallet Style (no flip, shows everything) */}
                            <div className="rounded-2xl shadow-xl overflow-hidden bg-white">
                              {/* Card Header with Brand Color */}
                              <div
                                className="p-5 relative"
                                style={getBackgroundStyle()}
                              >
                                <div className="flex items-start gap-3">
                                  {/* Logo */}
                                  <div className="w-12 h-12 rounded-full bg-white bg-opacity-30 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                                    <div
                                      className="w-8 h-8 rounded-full"
                                      style={{
                                        backgroundColor: cardConfig.textColor,
                                        opacity: 0.5
                                      }}
                                    ></div>
                                  </div>

                                  {/* Brand Name */}
                                  <div className="flex-1" style={{ color: cardConfig.textColor }}>
                                    <h4 className="text-lg font-bold leading-tight">
                                      {cardConfig.brandName}
                                    </h4>
                                  </div>
                                </div>
                              </div>

                              {/* Card Content */}
                              <div
                                className="p-5"
                                style={{
                                  ...getBackgroundStyle(),
                                  opacity: 0.95
                                }}
                              >
                                {/* Card Title */}
                                <h3
                                  className="text-xl font-bold mb-4"
                                  style={{ color: cardConfig.textColor }}
                                >
                                  {cardConfig.cardTitle}
                                </h3>

                                {/* Member Details */}
                                <div className="grid grid-cols-2 gap-4 mb-5">
                                  <div>
                                    <p
                                      className="text-xs opacity-75 mb-1"
                                      style={{ color: cardConfig.textColor }}
                                    >
                                      Member name
                                    </p>
                                    <p
                                      className="text-sm font-semibold"
                                      style={{ color: cardConfig.textColor }}
                                    >
                                      {cardConfig.description}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p
                                      className="text-xs opacity-75 mb-1"
                                      style={{ color: cardConfig.textColor }}
                                    >
                                      Member ID
                                    </p>
                                    <p
                                      className="text-sm font-semibold font-mono"
                                      style={{ color: cardConfig.textColor }}
                                    >
                                      {cardConfig.memberNumber}
                                    </p>
                                  </div>
                                </div>

                                {/* Barcode/QR Code - Integrated in card */}
                                <div className="bg-white rounded-xl p-4 shadow-sm">
                                  {codeType === 'qr' ? (
                                    qrCodeUrl ? (
                                      <div className="flex justify-center">
                                        <img src={qrCodeUrl} alt="QR Code" className="w-full max-w-[280px] h-auto" />
                                      </div>
                                    ) : (
                                      <div className="flex justify-center items-center h-32">
                                        <span className="text-xs text-gray-500">Generating QR...</span>
                                      </div>
                                    )
                                  ) : (
                                    <div className="flex justify-center">
                                      <Barcode
                                        value={cardConfig.memberNumber || '1234567890'}
                                        format={cardConfig.barcodeFormat}
                                        width={2}
                                        height={60}
                                        displayValue={false}
                                        background="#FFFFFF"
                                        lineColor="#000000"
                                      />
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Details Button */}
                            <div className="mt-6 px-4">
                              <button className="w-full py-3 bg-white rounded-full border-2 border-gray-300 text-sky-blue font-semibold text-sm hover:bg-gray-50 transition-colors">
                                Details
                              </button>
                            </div>

                            {/* Add More Card Hint */}
                            <div className="mt-8 text-center">
                              <div className="inline-flex items-center gap-2 text-gray-600 text-sm">
                                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                                  <span className="text-lg text-gray-600">+</span>
                                </div>
                                <span>Add another pass</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Navigation Bar */}
                        <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-8 py-3 flex justify-around">
                          <div className="w-6 h-6 rounded bg-gray-300"></div>
                          <div className="w-6 h-6 rounded bg-gray-300"></div>
                          <div className="w-6 h-6 rounded bg-sky-blue"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Panel - Customization */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 sticky top-8 max-h-[calc(100vh-4rem)] overflow-y-auto">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
                <Sliders className="h-5 w-5" />
                Customize Card
              </h2>

              <Tabs defaultValue="branding" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-4">
                  <TabsTrigger value="branding">
                    <Type className="h-4 w-4" />
                  </TabsTrigger>
                  <TabsTrigger value="colors">
                    <Palette className="h-4 w-4" />
                  </TabsTrigger>
                  <TabsTrigger value="style">
                    <Grid className="h-4 w-4" />
                  </TabsTrigger>
                </TabsList>

                {/* Branding Tab */}
                <TabsContent value="branding" className="space-y-4">
                  <div>
                    <Label className="text-gray-900 dark:text-gray-100">Brand Name</Label>
                    <Input
                      value={cardConfig.brandName}
                      onChange={(e) => updateConfig('brandName', e.target.value)}
                      placeholder="Your Brand"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-gray-900 dark:text-gray-100">Card Title</Label>
                    <Input
                      value={cardConfig.cardTitle}
                      onChange={(e) => updateConfig('cardTitle', e.target.value)}
                      placeholder="Loyalty Card"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-gray-900 dark:text-gray-100">Description</Label>
                    <Input
                      value={cardConfig.description}
                      onChange={(e) => updateConfig('description', e.target.value)}
                      placeholder="Member since 2025"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-gray-900 dark:text-gray-100">Member Number</Label>
                    <Input
                      value={cardConfig.memberNumber}
                      onChange={(e) => updateConfig('memberNumber', e.target.value)}
                      placeholder="1234567890"
                      className="mt-1 font-mono"
                    />
                  </div>

                  <div>
                    <Label className="text-gray-900 dark:text-gray-100 mb-2 block">
                      Code Type
                    </Label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant={codeType === 'qr' ? 'default' : 'outline'}
                        onClick={() => setCodeType('qr')}
                        className={`flex-1 ${codeType === 'qr' ? 'bg-sky-blue hover:bg-royal-blue text-white' : ''}`}
                      >
                        <QrCode className="h-4 w-4 mr-2" />
                        QR Code
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={codeType === 'barcode' ? 'default' : 'outline'}
                        onClick={() => setCodeType('barcode')}
                        className={`flex-1 ${codeType === 'barcode' ? 'bg-sky-blue hover:bg-royal-blue text-white' : ''}`}
                      >
                        <BarcodeIcon className="h-4 w-4 mr-2" />
                        Barcode
                      </Button>
                    </div>
                  </div>

                  {codeType === 'qr' && (
                    <div>
                      <Label className="text-gray-900 dark:text-gray-100">QR Code Data (URL)</Label>
                      <Input
                        value={cardConfig.codeData}
                        onChange={(e) => updateConfig('codeData', e.target.value)}
                        placeholder="https://..."
                        className="mt-1 text-xs"
                      />
                    </div>
                  )}

                  {codeType === 'barcode' && (
                    <div>
                      <Label className="text-gray-900 dark:text-gray-100">Barcode Format</Label>
                      <select
                        value={cardConfig.barcodeFormat}
                        onChange={(e) => updateConfig('barcodeFormat', e.target.value)}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      >
                        <option value="CODE128">CODE128 (Default)</option>
                        <option value="EAN13">EAN13</option>
                        <option value="UPC">UPC</option>
                        <option value="CODE39">CODE39</option>
                      </select>
                    </div>
                  )}

                  <div>
                    <Label className="text-gray-900 dark:text-gray-100">Logo URL</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        value={cardConfig.logoUrl}
                        onChange={(e) => updateConfig('logoUrl', e.target.value)}
                        placeholder="https://..."
                        className="flex-1 text-xs"
                      />
                      <Button variant="outline" size="icon">
                        <Upload className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                {/* Colors Tab */}
                <TabsContent value="colors" className="space-y-4">
                  <div>
                    <Label className="text-gray-900 dark:text-gray-100 mb-2 block">Gradient Style</Label>
                    <div className="grid grid-cols-3 gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant={cardConfig.backgroundGradient === 'solid' ? 'default' : 'outline'}
                        onClick={() => updateConfig('backgroundGradient', 'solid')}
                        className={cardConfig.backgroundGradient === 'solid' ? 'bg-sky-blue text-white' : ''}
                      >
                        Solid
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={cardConfig.backgroundGradient === 'linear' ? 'default' : 'outline'}
                        onClick={() => updateConfig('backgroundGradient', 'linear')}
                        className={cardConfig.backgroundGradient === 'linear' ? 'bg-sky-blue text-white' : ''}
                      >
                        Linear
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={cardConfig.backgroundGradient === 'radial' ? 'default' : 'outline'}
                        onClick={() => updateConfig('backgroundGradient', 'radial')}
                        className={cardConfig.backgroundGradient === 'radial' ? 'bg-sky-blue text-white' : ''}
                      >
                        Radial
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label className="text-gray-900 dark:text-gray-100">Primary Color</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        type="color"
                        value={cardConfig.backgroundColor}
                        onChange={(e) => updateConfig('backgroundColor', e.target.value)}
                        className="w-16 h-10 p-1 cursor-pointer"
                      />
                      <Input
                        value={cardConfig.backgroundColor}
                        onChange={(e) => updateConfig('backgroundColor', e.target.value)}
                        className="flex-1 font-mono text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-gray-900 dark:text-gray-100">Secondary Color</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        type="color"
                        value={cardConfig.secondaryColor}
                        onChange={(e) => updateConfig('secondaryColor', e.target.value)}
                        className="w-16 h-10 p-1 cursor-pointer"
                      />
                      <Input
                        value={cardConfig.secondaryColor}
                        onChange={(e) => updateConfig('secondaryColor', e.target.value)}
                        className="flex-1 font-mono text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-gray-900 dark:text-gray-100">Text Color</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        type="color"
                        value={cardConfig.textColor}
                        onChange={(e) => updateConfig('textColor', e.target.value)}
                        className="w-16 h-10 p-1 cursor-pointer"
                      />
                      <Input
                        value={cardConfig.textColor}
                        onChange={(e) => updateConfig('textColor', e.target.value)}
                        className="flex-1 font-mono text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-gray-900 dark:text-gray-100">Secondary Text</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        type="color"
                        value={cardConfig.secondaryTextColor}
                        onChange={(e) => updateConfig('secondaryTextColor', e.target.value)}
                        className="w-16 h-10 p-1 cursor-pointer"
                      />
                      <Input
                        value={cardConfig.secondaryTextColor}
                        onChange={(e) => updateConfig('secondaryTextColor', e.target.value)}
                        className="flex-1 font-mono text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-gray-900 dark:text-gray-100">Accent Color</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        type="color"
                        value={cardConfig.accentColor}
                        onChange={(e) => updateConfig('accentColor', e.target.value)}
                        className="w-16 h-10 p-1 cursor-pointer"
                      />
                      <Input
                        value={cardConfig.accentColor}
                        onChange={(e) => updateConfig('accentColor', e.target.value)}
                        className="flex-1 font-mono text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-gray-900 dark:text-gray-100 mb-2 block">Preset Themes</Label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          updateConfig('backgroundColor', '#8B5CF6');
                          updateConfig('secondaryColor', '#7C3AED');
                          updateConfig('textColor', '#FFFFFF');
                          updateConfig('accentColor', '#60A5FA');
                        }}
                        className="h-14 rounded-lg bg-gradient-to-br from-vivid-violet to-deep-purple hover:scale-105 transition-transform shadow-md"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          updateConfig('backgroundColor', '#1e293b');
                          updateConfig('secondaryColor', '#0f172a');
                          updateConfig('textColor', '#FFFFFF');
                          updateConfig('accentColor', '#60A5FA');
                        }}
                        className="h-14 rounded-lg bg-gradient-to-br from-slate-800 to-slate-950 hover:scale-105 transition-transform shadow-md"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          updateConfig('backgroundColor', '#059669');
                          updateConfig('secondaryColor', '#047857');
                          updateConfig('textColor', '#FFFFFF');
                          updateConfig('accentColor', '#34D399');
                        }}
                        className="h-14 rounded-lg bg-gradient-to-br from-emerald-600 to-emerald-700 hover:scale-105 transition-transform shadow-md"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          updateConfig('backgroundColor', '#DC2626');
                          updateConfig('secondaryColor', '#B91C1C');
                          updateConfig('textColor', '#FFFFFF');
                          updateConfig('accentColor', '#F87171');
                        }}
                        className="h-14 rounded-lg bg-gradient-to-br from-red-600 to-red-700 hover:scale-105 transition-transform shadow-md"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          updateConfig('backgroundColor', '#EA580C');
                          updateConfig('secondaryColor', '#C2410C');
                          updateConfig('textColor', '#FFFFFF');
                          updateConfig('accentColor', '#FB923C');
                        }}
                        className="h-14 rounded-lg bg-gradient-to-br from-orange-600 to-orange-700 hover:scale-105 transition-transform shadow-md"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          updateConfig('backgroundColor', '#2563EB');
                          updateConfig('secondaryColor', '#1D4ED8');
                          updateConfig('textColor', '#FFFFFF');
                          updateConfig('accentColor', '#60A5FA');
                        }}
                        className="h-14 rounded-lg bg-gradient-to-br from-royal-blue to-blue-700 hover:scale-105 transition-transform shadow-md"
                      />
                    </div>
                  </div>
                </TabsContent>

                {/* Style Tab */}
                <TabsContent value="style" className="space-y-4">
                  <div>
                    <Label className="text-gray-900 dark:text-gray-100 mb-2 block">Card Pattern</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant={cardConfig.pattern === 'none' ? 'default' : 'outline'}
                        onClick={() => updateConfig('pattern', 'none')}
                        className={cardConfig.pattern === 'none' ? 'bg-sky-blue text-white' : ''}
                      >
                        None
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={cardConfig.pattern === 'dots' ? 'default' : 'outline'}
                        onClick={() => updateConfig('pattern', 'dots')}
                        className={cardConfig.pattern === 'dots' ? 'bg-sky-blue text-white' : ''}
                      >
                        Dots
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={cardConfig.pattern === 'lines' ? 'default' : 'outline'}
                        onClick={() => updateConfig('pattern', 'lines')}
                        className={cardConfig.pattern === 'lines' ? 'bg-sky-blue text-white' : ''}
                      >
                        Lines
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={cardConfig.pattern === 'grid' ? 'default' : 'outline'}
                        onClick={() => updateConfig('pattern', 'grid')}
                        className={cardConfig.pattern === 'grid' ? 'bg-sky-blue text-white' : ''}
                      >
                        Grid
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label className="text-gray-900 dark:text-gray-100 mb-2 block">Font Style</Label>
                    <div className="grid grid-cols-3 gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant={cardConfig.font === 'sans' ? 'default' : 'outline'}
                        onClick={() => updateConfig('font', 'sans')}
                        className={cardConfig.font === 'sans' ? 'bg-sky-blue text-white font-sans' : 'font-sans'}
                      >
                        Sans
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={cardConfig.font === 'serif' ? 'default' : 'outline'}
                        onClick={() => updateConfig('font', 'serif')}
                        className={cardConfig.font === 'serif' ? 'bg-sky-blue text-white font-serif' : 'font-serif'}
                      >
                        Serif
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={cardConfig.font === 'mono' ? 'default' : 'outline'}
                        onClick={() => updateConfig('font', 'mono')}
                        className={cardConfig.font === 'mono' ? 'bg-sky-blue text-white font-mono' : 'font-mono'}
                      >
                        Mono
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label className="text-gray-900 dark:text-gray-100 mb-2 block">Card Height</Label>
                    <div className="grid grid-cols-3 gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant={cardConfig.cardHeight === 'compact' ? 'default' : 'outline'}
                        onClick={() => updateConfig('cardHeight', 'compact')}
                        className={cardConfig.cardHeight === 'compact' ? 'bg-sky-blue text-white' : ''}
                      >
                        Compact
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={cardConfig.cardHeight === 'normal' ? 'default' : 'outline'}
                        onClick={() => updateConfig('cardHeight', 'normal')}
                        className={cardConfig.cardHeight === 'normal' ? 'bg-sky-blue text-white' : ''}
                      >
                        Normal
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={cardConfig.cardHeight === 'tall' ? 'default' : 'outline'}
                        onClick={() => updateConfig('cardHeight', 'tall')}
                        className={cardConfig.cardHeight === 'tall' ? 'bg-sky-blue text-white' : ''}
                      >
                        Tall
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label className="text-gray-900 dark:text-gray-100 mb-2 block">
                      Border Radius: {cardConfig.borderRadius}px
                    </Label>
                    <input
                      type="range"
                      min="0"
                      max="32"
                      value={cardConfig.borderRadius}
                      onChange={(e) => updateConfig('borderRadius', parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>
                </TabsContent>
              </Tabs>

              {/* Export Buttons */}
              <div className="mt-6 space-y-2 pt-6 border-t border-gray-200 dark:border-gray-700">
                <Button className="w-full bg-gradient-to-r from-sky-blue to-vivid-violet hover:from-royal-blue hover:to-deep-purple text-white shadow-md">
                  <Download className="h-4 w-4 mr-2" />
                  Export .pkpass (Apple)
                </Button>
                <Button variant="outline" className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Export .json (Google Pay)
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
