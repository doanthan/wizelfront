import mongoose from "mongoose"

const brandSettingsSchema = new mongoose.Schema(
    {
        store_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Store",
        },
        store_public_id: {
            type: String,
            ref: "Store",
        },
        // Brand Basics (maintaining backward compatibility)
        name: {
            type: String,
            trim: true,
            maxLength: 100,
        },
        brandName: {
            type: String,
            trim: true,
            maxLength: 100,
        },
        // Brand slug for URL-friendly routing
        slug: {
            type: String,
            trim: true,
            lowercase: true,
            maxLength: 100,
        },
        industryCategories: [String], // Array of strings as in your form
        websiteUrl: {
            type: String,
            validate: {
                validator: (v) => !v || /^https?:\/\/.+/.test(v),
                message: "Website must be a valid URL",
            },
        },
        brandTagline: {
            type: String,
            maxLength: 200,
        },

        // Brand Identity
        brandVoice: [
            {
                type: String,
            },
        ],
        brandPersonality: [
            {
                type: String,
            },
        ],
        coreValues: [
            {
                type: String,
            },
        ],
        // Brand Story fields
        originStory: String,
        missionStatement: String,
        uniqueValueProposition: String,
        brandJourney: String,
        customerPromise: String,

        // Visual Elements - Enhanced for visual design page
        primaryColor: [
            {
                hex: {
                    type: String,
                    required: true,
                    match: /^#[0-9A-Fa-f]{6}$/
                },
                name: {
                    type: String,
                    trim: true
                }
            }
        ],
        secondaryColors: [
            {
                hex: {
                    type: String,
                    required: true,
                    match: /^#[0-9A-Fa-f]{6}$/
                },
                name: {
                    type: String,
                    trim: true
                }
            }
        ],
        // Alternate Color Palettes - Pastel, Metallic, Earth Tone
        alternateColors: {
            pastel: [
                {
                    hex: {
                        type: String,
                        required: true,
                        match: /^#[0-9A-Fa-f]{6}$/
                    },
                    name: {
                        type: String,
                        trim: true
                    }
                }
            ],
            metallic: [
                {
                    hex: {
                        type: String,
                        required: true,
                        match: /^#[0-9A-Fa-f]{6}$/
                    },
                    name: {
                        type: String,
                        trim: true
                    }
                }
            ],
            earthTone: [
                {
                    hex: {
                        type: String,
                        required: true,
                        match: /^#[0-9A-Fa-f]{6}$/
                    },
                    name: {
                        type: String,
                        trim: true
                    }
                }
            ]
        },
        brandFontColor: {
            type: String,
            default: "#000000",
            validate: {
                validator: (v) => /^#[0-9A-F]{6}$/i.test(v),
                message: "Font color must be a valid hex color",
            },
        },
        scrapedLogoUrl: { type: String },

        // Typography - Enhanced from visual design page
        brandFontUrl: String,
        brandFontFile: String, // Store file path/URL
        customFontFamily: String,
        customFontName: String, // User-friendly label for the font
        fontCssRule: String,
        emailFallbackFont: {
            type: String,
            default: 'Arial'
        },

        // Logo - Enhanced structure from visual design page
        logo: {
            primary_logo_url: {
                type: String,
                trim: true
            },
            logo_alt_text: {
                type: String,
                default: "logo",
                trim: true
            },
            logo_type: {
                type: String,
                default: 'image'
            },
            brand_name: {
                type: String,
                trim: true
            }
        },
        logoAlignment: {
            type: String,
            enum: ['left', 'center', 'right'],
            default: 'center'
        },
        logoBackgroundColor: {
            type: String,
            trim: true,
            match: /^#[0-9A-Fa-f]{6}$/
        },

        // Header Settings
        headerStyle: {
            type: String,
            // Removed enum to make extensible - allows any string values
            // Default values: Left-aligned, Middle-aligned, Right-aligned
            default: "Left-aligned",
        },
        headerBackgroundColor: {
            type: String,
            default: "#ffffff",
            validate: {
                validator: (v) => /^#[0-9A-F]{6}$/i.test(v),
                message: "Header background color must be a valid hex color",
            },
        },
        headerLinks: [
            {
                text: String,
                url: String,
            },
        ],

        // Footer Settings
        footerTagline: String,
        footerAddress: String,
        socialLinks: [
            {
                platform: String,
                name: String,
                icon: String,
                handle: String,
                url: String,
            },
        ],

        // Social Media - Enhanced from visual design page
        socialFacebook: String,
        socialInstagram: String,
        socialTwitterX: String,
        socialLinkedIn: String,
        socialYouTube: String,
        socialTikTok: String,
        socialLine: String,
        socialIconStyle: {
            type: String,
            enum: ['flat', 'circle'],
            default: 'flat'
        },

        // Customer Information
        targetAudienceAge: [
            {
                type: String,
                // Removed number range to use typical marketing age segments
                // Default values: 18-24, 25-34, 35-44, 45-54, 55-64, 65+
            },
        ],
        targetAudienceGender: [
            {
                type: String,
                // Removed enum to make extensible - allows any string values
                // Default values: male, female, other, all
            },
        ],
        customerPainPoints: [String],
        customerAspirations: [String],
        geographicFocus: [
            {
                type: String,
                // Removed enum to make extensible - allows any string values
                // Default values: Global, North America, Europe, Asia, Australia & Oceania, Africa, South America
            },
        ],

        // Product Information
        mainProductCategories: [String],
        bestsellingProducts: [String],
        uniqueSellingPoints: String,
        featuredCollection: String,

        // Marketing Details
        currentPromotion: String,
        upcomingProductLaunch: String,
        seasonalFocus: {
            type: String,
            // Removed enum to make extensible - allows any string values
            // Default values: spring, summer, fall, winter, holiday
        },
        specialEvents: String,
        discountStrategy: {
            type: String,
            // Removed enum to make extensible - allows any string values
            // Default values: percentage, dollar-amount, free-shipping, bundle-deals, loyalty-points
        },
        loyaltyProgramDetails: String,

        // Email Preferences
        emailFrequency: {
            type: String,
            // Removed enum to make extensible - allows any string values
            // Default values: 2/day, 3/day, 4/day
            default: "2/day",
        },
        ctaButtonStyle: {
            type: String,
            // Removed enum to make extensible - allows any string values
            // Default values: bold-direct, subtle-elegant, fun-engaging, minimalist
        },
        contentPriority: [String], // Array of content priorities
        emailSignature: String,
        socialMediaHandles: String,

        // Campaign Goals
        primaryCampaignObjective: {
            type: String,
            // Removed enum to make extensible - allows any string values
            // Default values: increase-sales, brand-awareness, new-product, re-engage, lead-generation
        },
        secondaryObjectives: [
            {
                type: String,
                // Removed enum to make extensible - allows any string values
                // Default values: increase-average-order-value, promote-specific-category, reduce-cart-abandonment, grow-email-list, drive-social-engagement, increase-repeat-purchases
            },
        ],
        trustBadges: [
            {
                text: {
                    type: String,
                    required: true,
                    trim: true
                },
                icon: {
                    type: String,
                    required: true
                },
                description: {
                    type: String,
                    trim: true
                }
            }
        ],
        trustBadgeStyle: {
            type: String,
            // Removed enum to make extensible - allows any string values
            // Default values: samecolor, multicolor, monochrome, gradient, minimal
            default: 'multicolor'
        },

        // Competitive Intelligence
        competitors: [{
            name: {
                type: String,
                required: true,
                trim: true
            },
            url: {
                type: String,
                trim: true,
                validate: {
                    validator: (v) => !v || /^https?:\/\/.+/.test(v),
                    message: "Competitor URL must be a valid URL",
                },
            },
            strengths: [String],
            weaknesses: [String],
            differentiators: [String]
        }],
        competitivePricing: {
            type: String,
            // Removed enum to make extensible - allows any string values
            // Default values: below-market, at-market, above-market, premium, value
        },
        marketPosition: {
            type: String,
            // Removed enum to make extensible - allows any string values
            // Default values: market-leader, challenger, niche-player, innovator, value-leader
        },
        uniqueFeatures: [String],
        competitiveAdvantages: [String],

        // Market Opportunities & Threats
        marketOpportunities: [{
            opportunity: String,
            impact: String,
            timeframe: String,
            actionRequired: String
        }],
        marketThreats: [{
            threat: String,
            severity: String,
            likelihood: String,
            mitigationStrategy: String
        }],

        // Content Strategy
        contentStrategy: {
            contentThemes: [{
                theme: String,
                description: String,
                topics: [String],
                formats: [String],
                frequency: String
            }],
            contentPillars: [{
                pillar: String,
                purpose: String,
                contentTypes: [String],
                kpis: [String],
                percentage: Number
            }],
            editorialCalendar: {
                weeklyThemes: {
                    monday: String,
                    tuesday: String,
                    wednesday: String,
                    thursday: String,
                    friday: String,
                    saturday: String,
                    sunday: String
                },
                monthlyFocus: [String],
                seasonalOpportunities: [{
                    season: String,
                    themes: [String],
                    campaigns: [String]
                }],
                keyDates: [{
                    date: String,
                    event: String,
                    contentStrategy: String
                }],
                optimalPostingTimes: {
                    email: String,
                    social: String,
                    blog: String
                }
            },
            contentTone: {
                educational: String,
                promotional: String,
                community: String,
                support: String,
                brandStory: String,
                doWords: [String],
                dontWords: [String]
            },
            storyAngles: [{
                angle: String,
                narrative: String,
                emotionalHook: String,
                callToAction: String,
                contentFormats: [String]
            }]
        },

        // Customer Journey Insights
        customerJourneyInsights: {
            decisionFactors: [{
                factor: String,
                importance: String,
                description: String
            }],
            trustBuilders: [{
                builder: String,
                impact: String,
                implementation: String
            }],
            purchaseTriggers: [String],
            objectionHandlers: [String],
            riskReducers: [String],
            socialValidation: [String],
            urgencyCreators: [String]
        },

        // Deep Customer Psychology
        customerLifecycleStage: [{
            type: String,
            // Removed enum to make extensible - allows any string values
            // Default values: awareness, consideration, purchase, retention, advocacy
        }],
        buyingMotivations: [{
            type: String,
            // Removed enum to make extensible - allows any string values
            // Default values: emotional, rational, social, impulse, necessity, luxury, status
        }],
        purchaseBarriers: [String],
        customerFears: [String],
        decisionFactors: [String], // For backward compatibility with existing UI
        trustBuilders: [String], // For backward compatibility with existing UI
        socialProof: {
            reviewCount: Number,
            averageRating: Number,
            testimonials: [String],
            celebrityEndorsements: [String],
            mediaFeatures: [String]
        },
        customerPersonas: [{
            name: {
                type: String,
                required: true,
                trim: true
            },
            description: String,
            demographics: {
                age: String,
                income: String,
                education: String,
                occupation: String,
                location: String
            },
            psychographics: {
                interests: [String],
                values: [String],
                lifestyle: String,
                personality: [String]
            },
            shoppingBehavior: {
                frequency: String,
                averageOrderValue: String,
                preferredChannels: [String],
                decisionFactors: [String]
            }
        }],
        emotionalTriggers: [{
            type: String,
            // Removed enum to make extensible - allows any string values
            // Default values: fear-of-missing-out, belonging, achievement, security, freedom, adventure, comfort, pride, nostalgia, excitement
        }],
        customerLanguage: {
            keywords: [String],
            phrases: [String],
            tone: String,
            avoidWords: [String]
        },

        // Button Settings - Enhanced from visual design page
        buttonEffect: {
            type: String,
            // Removed enum to make extensible - allows any string values
            // Default values: flat, gradient, shadow, outline
            default: "gradient",
        },
        buttonBackgroundColor: {
            type: String,
            match: /^#[0-9A-Fa-f]{6}$/
            // No default - will use primary color if not set
        },
        buttonTextColor: {
            type: String,
            default: "#ffffff",
            validate: {
                validator: (v) => /^#[0-9A-F]{6}$/i.test(v),
                message: "Button text color must be a valid hex color",
            },
        },
        buttonBorderRadius: {
            type: Number,
            min: 0,
            max: 50,
            default: 8,
        },
        buttonPadding: {
            type: Number,
            min: 8,
            max: 20,
            default: 12,
        },
        buttonShadowIntensity: {
            type: Number,
            min: 0,
            max: 10,
            default: 5,
        },
        buttonSize: {
            type: String,
            enum: ['small', 'medium', 'large'],
            default: 'medium'
        },
        buttonStyle: {
            type: String,
            enum: ['solid', 'outline', 'shadow', 'raised', 'inset'],
            default: 'solid'
        },

        // Product Categories from visual design page
        categories: [{
            name: {
                type: String,
                required: true,
                trim: true
            },
            link: {
                type: String,
                trim: true
            }
        }],
        categoryStyle: {
            type: String,
            enum: ['outline', 'fill', 'minimal'],
            default: 'outline'
        },

        selectedBenefits: [
            {
                id: {
                    type: String,
                    // Removed enum to make extensible - allows any string values
                    // Default values: australian-made, free-shipping, free-returns, satisfaction-guaranteed, eco-friendly, cruelty-free, organic, handmade, 24-7-support, secure-payment, fast-delivery, money-back, premium-quality, locally-sourced, small-business, family-owned, award-winning, expert-support, easy-checkout, fast-processing, live-chat, worldwide-shipping, same-day-delivery, carbon-neutral, verified-secure, trusted-brand, gift-wrapping, luxury-quality, new-arrivals, best-price, trending, limited-time, custom-made, designer, lab-tested, third-party-verified, gmp-certified, fda-approved, iso-certified, clinical-grade, pharmaceutical-grade, allergen-free, gluten-free, vegan-certified, non-gmo, fair-trade, b-corp-certified, sustainably-sourced, try-before-buy, subscription-available, auto-delivery, flexible-payment, afterpay-available, klarna-available, installment-plans, loyalty-rewards, referral-program, member-exclusive, vip-access, priority-support, white-glove-service, express-delivery, overnight-shipping, tracked-delivery, signature-required, contactless-delivery, pickup-available, local-delivery, drone-delivery, fragile-handling, temperature-controlled, refrigerated-shipping, years-in-business, million-customers, five-star-rated, industry-leader, proven-results, backed-by-science, clinically-proven, dermatologist-tested, doctor-recommended, nutritionist-approved, celebrity-endorsed, limited-edition, bestseller, staff-pick, customer-favorite, most-popular, recently-viewed, back-in-stock, last-chance, exclusive-formula, patent-pending, breakthrough-technology, innovative-design, one-click-reorder, bulk-discount, wholesale-available, corporate-pricing, educational-discount, senior-discount, military-discount, student-discount, first-responder-discount, healthcare-worker-discount, allergen-tested, heavy-metal-tested, purity-guaranteed, potency-verified, bioavailable, absorption-enhanced, slow-release, immediate-release, enteric-coated, shelf-stable, ai-recommended, smart-packaging, qr-code-verified, blockchain-verified, nfc-enabled, app-connected, iot-enabled, smart-dosing, charity-partner, community-supported, social-enterprise, gives-back, education-focused, research-funded, scholarship-program, environmental-offset, fresh-batch, made-to-order, daily-fresh, weekly-harvest, seasonal-ingredients, peak-potency, expiry-guarantee, cold-chain-maintained, personalized, custom-formulated, tailored-dosage, individual-packaging, name-engraved, color-options, size-options, flavor-options, members-only, invitation-only, waitlist-access, pre-order-available, early-access, founder-access, limited-release, collector-edition, lifetime-warranty, replacement-guarantee, price-match-guarantee, lowest-price-guarantee, freshness-guarantee, results-guarantee, quality-promise
                },
                name: String,
                icon: String, // Store the icon component name
                description: String,
            },
        ],
        benefitsBannerBg: {
            type: String,
            default: "#f8f9fa",
            validate: {
                validator: (v) => /^#[0-9A-F]{6}$/i.test(v),
                message: "Benefits banner background must be a valid hex color",
            },
        },
        showBenefitsHtml: {
            type: Boolean,
            default: false,
        },

        // Email Strategy Configuration
        emailStrategy: {
            contentMix: {
                educational: { type: Number, min: 0, max: 100 },
                promotional: { type: Number, min: 0, max: 100 },
                community: { type: Number, min: 0, max: 100 },
                product: { type: Number, min: 0, max: 100 }
            },
            
            // Enhanced visual content types
            visualContentType: {
                infographics: { type: Number, min: 0, max: 100 },
                productShots: { type: Number, min: 0, max: 100 },
                lifestylePhotos: { type: Number, min: 0, max: 100 },
                modelPhotos: { type: Number, min: 0, max: 100 },
                diagrams: { type: Number, min: 0, max: 100 },
                beforeAfter: { type: Number, min: 0, max: 100 },
                userGenerated: { type: Number, min: 0, max: 100 }
            },
            
            visualToTextRatio: {
                type: String,
                // Removed enum to make extensible - allows any string values
                // Default values: text-heavy, balanced, visual-heavy, minimal-text, image-heavy
            },
            
            // Layout preferences
            layoutPreference: {
                type: String,
                enum: ['single-column', 'multi-column', 'grid', 'story-flow', 'magazine-style']
            },
            
            // Mobile optimization strategy
            mobileStrategy: {
                type: String,
                enum: ['infographic-stacked', 'carousel-friendly', 'single-focus', 'scrollable-story']
            },
            
            heroProductCount: {
                type: Number,
                min: 1,
                max: 20,
                default: 3
            },
            
            storyDepth: {
                type: String,
                enum: ['surface', 'moderate', 'deep', 'educational']
            },
            
            // Content block preferences
            contentBlocks: {
                preferredTypes: [{
                    type: String,
                    // Removed enum to make extensible - allows any string values
                    // Default values: hero-infographic, product-grid, educational-carousel,
                    // model-showcase, comparison-chart, testimonial-cards, how-to-steps,
                    // ingredient-spotlight, outfit-gallery, tech-specs, social-proof, video-embed,
                    // hero-lifestyle, values-story
                }],
                maxBlocksPerEmail: { type: Number, default: 5 }
            }
        },

        // Brand Archetype Configuration
        brandArchetype: {
            primary: {
                type: String,
                // Removed enum to make extensible - allows any string values
                // Default values: story-driven, visual-driven, value-driven, luxury, problem-solver,
                // community-driven, replenishment, seasonal, artisan, tech-innovation, empowerer, creator, everyperson
                required: false // Set to false to avoid breaking existing records
            },
            secondary: [{
                type: String,
                // Removed enum to make extensible - allows any string values
                // Default values: story-driven, visual-driven, value-driven, luxury, problem-solver,
                // community-driven, replenishment, seasonal, artisan, tech-innovation, empowerer, creator, everyperson
            }],
            description: String,
            messaging: String,
            confidence: {
                type: Number,
                min: 0,
                max: 100,
                default: 0 // Percentage confidence in auto-detection
            },
            lastDetected: Date,
            detectionMethod: {
                type: String,
                enum: ['auto', 'manual', 'hybrid']
            }
        },

        // Auto-detection Metrics
        brandMetrics: {
            averageOrderValue: String,
            customerLifetimeValue: String,
            purchaseFrequency: mongoose.Schema.Types.Mixed, // Can be string or object with average/mode
            cartAbandonmentRate: Number,
            conversionRate: Number,
            repeatPurchaseRate: Number,
            medianOrderValue: Number,
            priceRange: {
                min: Number,
                max: Number,
                currency: String
            },
            productCount: Number,
            categoryDiversity: {
                type: Number,
                min: 0,
                max: 1 // 0-1 score of how diverse categories are
            },
            imageToTextRatio: Number, // For detecting visual vs text focus
            repeatCustomerRate: {
                type: Number,
                min: 0,
                max: 100 // Percentage
            },
            reviewSentiment: {
                keywords: [String], // Common words from reviews
                themes: [String], // Extracted themes
                averageLength: Number
            }
        },

        // Extracted Content
        extractedContent: {
            heroHeadline: String,
            heroSubheadline: String,
            heroCTA: String,
            productDescriptions: [String],
            keyMessages: [String],
            proofPoints: [String],
            ctaVariations: [String]
        },

        // Permission and Access Control
        access_control: {
            // ContractSeat-based brand restrictions
            restricted_to_seats: [{
                seat_id: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'ContractSeat'
                },
                permission_level: {
                    type: String,
                    enum: ['edit', 'view', 'none'],
                    default: 'edit'
                }
            }],
            
            // Franchise/Agency brand inheritance
            inherited_from_parent: {
                type: Boolean,
                default: false
            },
            parent_brand_id: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'BrandSettings'
            },
            
            // Brand guardian restrictions
            requires_approval: {
                type: Boolean,
                default: false // True for franchise locations editing corporate brands
            },
            approved_by: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            approval_date: Date,
            
            // Lock level for brand compliance
            lock_level: {
                type: String,
                enum: ['unlocked', 'content_locked', 'layout_locked', 'brand_locked', 'fully_locked'],
                default: 'unlocked'
            },
            locked_by: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            locked_at: Date
        },

        // Additional fields from comprehensive MongoDB dataset
        domain: String,
        
        // Analysis and metadata fields
        brandAnalysis: {
            analysisDate: String,
            analysisVersion: String,
            dataSource: String
        },
        
        // Comprehensive CSS and Brand Style System
        // Consolidated from BrandStyle model - all styling elements in one field
        css: {
            // Color System
            colors: {
                // Primary brand colors
                primary: { type: String, default: '#000000' },
                secondary: { type: String },
                accent: { type: String },

                // Semantic colors
                success: { type: String, default: '#28a745' },
                warning: { type: String, default: '#ffc107' },
                error: { type: String, default: '#dc3545' },
                info: { type: String, default: '#17a2b8' },

                // Background colors
                background: {
                    light: { type: String, default: '#ffffff' },
                    dark: { type: String, default: '#000000' },
                    muted: { type: String, default: '#f7f7f7' },
                    canvas: { type: String, default: '#fafafa' }
                },

                // Text colors
                text: {
                    primary: { type: String, default: '#000000' },
                    secondary: { type: String, default: '#666666' },
                    muted: { type: String, default: '#999999' },
                    inverse: { type: String, default: '#ffffff' },
                    link: { type: String },
                    linkHover: { type: String }
                },

                // Border colors
                border: {
                    primary: { type: String, default: '#e5e5e5' },
                    secondary: { type: String, default: '#cccccc' },
                    focus: { type: String }
                },

                // Color palette with usage notes
                palette: [{
                    name: { type: String, required: true },
                    value: { type: String, required: true }, // Hex color code
                    usage: { type: String } // "primary", "accent", "background", etc.
                }],

                // Scraped/extracted colors
                extracted: {
                    primary: [String],
                    text: [String],
                    background: [String]
                }
            },

            // Typography System
            typography: {
                // Font families
                fontFamilies: {
                    primary: { type: String, default: 'Arial, Helvetica, sans-serif' },
                    secondary: { type: String },
                    heading: { type: String },
                    body: { type: String },
                    mono: { type: String }
                },

                // Font sizes (in pixels)
                fontSize: {
                    xs: { type: Number, default: 12 },
                    sm: { type: Number, default: 14 },
                    base: { type: Number, default: 16 },
                    md: { type: Number, default: 18 },
                    lg: { type: Number, default: 20 },
                    xl: { type: Number, default: 24 },
                    '2xl': { type: Number, default: 28 },
                    '3xl': { type: Number, default: 32 },
                    '4xl': { type: Number, default: 36 },
                    '5xl': { type: Number, default: 42 },
                    '6xl': { type: Number, default: 48 }
                },

                // Font weights
                fontWeight: {
                    light: { type: Number, default: 300 },
                    normal: { type: Number, default: 400 },
                    medium: { type: Number, default: 500 },
                    semibold: { type: Number, default: 600 },
                    bold: { type: Number, default: 700 },
                    black: { type: Number, default: 900 }
                },

                // Line heights
                lineHeight: {
                    tight: { type: Number, default: 1.2 },
                    normal: { type: Number, default: 1.5 },
                    relaxed: { type: Number, default: 1.6 },
                    loose: { type: Number, default: 1.8 }
                },

                // Letter spacing
                letterSpacing: {
                    tight: { type: String, default: '-0.5px' },
                    normal: { type: String, default: '0px' },
                    wide: { type: String, default: '0.5px' },
                    wider: { type: String, default: '1px' }
                },

                // Scraped heading styles
                headings: {
                    h1: mongoose.Schema.Types.Mixed,
                    h2: mongoose.Schema.Types.Mixed,
                    h3: mongoose.Schema.Types.Mixed,
                    p: mongoose.Schema.Types.Mixed,
                    body: mongoose.Schema.Types.Mixed
                }
            },

            // Spacing System
            spacing: {
                // Standard spacing scale (in pixels)
                xs: { type: Number, default: 4 },
                sm: { type: Number, default: 8 },
                md: { type: Number, default: 16 },
                lg: { type: Number, default: 24 },
                xl: { type: Number, default: 32 },
                '2xl': { type: Number, default: 48 },
                '3xl': { type: Number, default: 64 },
                '4xl': { type: Number, default: 96 },

                // Extracted spacing patterns
                commonPaddings: [String],
                commonMargins: [String]
            },

            // Border Radius System
            borderRadius: {
                none: { type: Number, default: 0 },
                sm: { type: Number, default: 2 },
                base: { type: Number, default: 4 },
                md: { type: Number, default: 6 },
                lg: { type: Number, default: 8 },
                xl: { type: Number, default: 12 },
                '2xl': { type: Number, default: 16 },
                full: { type: Number, default: 9999 },
                pill: { type: String, default: '50px' }
            },

            // Shadow System
            shadows: {
                none: { type: String, default: 'none' },
                sm: { type: String, default: '0 1px 2px rgba(0, 0, 0, 0.05)' },
                base: { type: String, default: '0 1px 3px rgba(0, 0, 0, 0.1)' },
                md: { type: String, default: '0 4px 6px rgba(0, 0, 0, 0.1)' },
                lg: { type: String, default: '0 10px 15px rgba(0, 0, 0, 0.1)' },
                xl: { type: String, default: '0 20px 25px rgba(0, 0, 0, 0.15)' }
            },

            // Component-Specific Styles
            components: {
                // Button styles (primary, secondary, outline, etc.)
                button: {
                    primary: {
                        backgroundColor: { type: String },
                        color: { type: String },
                        borderRadius: { type: Number },
                        fontSize: { type: Number },
                        fontWeight: { type: Number },
                        paddingX: { type: Number },
                        paddingY: { type: Number },
                        borderWidth: { type: Number },
                        borderColor: { type: String },
                        hoverBackgroundColor: { type: String },
                        hoverColor: { type: String }
                    },
                    secondary: mongoose.Schema.Types.Mixed,
                    outline: mongoose.Schema.Types.Mixed,
                    ghost: mongoose.Schema.Types.Mixed,
                    link: mongoose.Schema.Types.Mixed
                },

                // Scraped button styles
                buttons: [mongoose.Schema.Types.Mixed],

                // Heading styles (h1-h6)
                heading: {
                    h1: {
                        fontSize: { type: Number },
                        fontWeight: { type: Number },
                        lineHeight: { type: Number },
                        letterSpacing: { type: String },
                        color: { type: String }
                    },
                    h2: mongoose.Schema.Types.Mixed,
                    h3: mongoose.Schema.Types.Mixed,
                    h4: mongoose.Schema.Types.Mixed,
                    h5: mongoose.Schema.Types.Mixed,
                    h6: mongoose.Schema.Types.Mixed
                },

                // Text styles
                text: {
                    body: {
                        fontSize: { type: Number },
                        lineHeight: { type: Number },
                        color: { type: String },
                        fontWeight: { type: Number }
                    },
                    small: mongoose.Schema.Types.Mixed,
                    caption: mongoose.Schema.Types.Mixed,
                    lead: mongoose.Schema.Types.Mixed
                },

                // Link styles
                link: {
                    color: { type: String },
                    textDecoration: { type: String, default: 'underline' },
                    hoverColor: { type: String },
                    fontWeight: { type: Number }
                },

                // Scraped link styles
                links: [mongoose.Schema.Types.Mixed],

                // Card styles
                card: {
                    backgroundColor: { type: String },
                    borderRadius: { type: Number },
                    padding: { type: Number },
                    borderWidth: { type: Number },
                    borderColor: { type: String },
                    shadow: { type: String }
                },

                // Scraped card styles
                cards: [mongoose.Schema.Types.Mixed],

                // Section/container styles
                section: {
                    paddingY: { type: Number },
                    paddingX: { type: Number },
                    backgroundColor: { type: String }
                },

                // Header styles
                headers: mongoose.Schema.Types.Mixed,

                // Form styles
                forms: mongoose.Schema.Types.Mixed,

                // Testimonial styles
                testimonials: [mongoose.Schema.Types.Mixed],

                // Segment styles
                segments: [mongoose.Schema.Types.Mixed],

                // Hero styles
                heroes: [mongoose.Schema.Types.Mixed]
            },

            // Email-Specific Styles
            email: {
                // Email defaults
                maxWidth: { type: Number, default: 600 },
                backgroundColor: { type: String, default: '#f7f7f7' },
                contentBackgroundColor: { type: String, default: '#ffffff' },
                fontFamily: { type: String },
                fontSize: { type: Number, default: 16 },
                lineHeight: { type: Number, default: 1.6 },
                textColor: { type: String },
                linkColor: { type: String },
                padding: { type: Number, default: 20 },

                // Email-optimized components
                optimized: {
                    button: mongoose.Schema.Types.Mixed,
                    heading: mongoose.Schema.Types.Mixed,
                    paragraph: mongoose.Schema.Types.Mixed,
                    card: mongoose.Schema.Types.Mixed,
                    link: mongoose.Schema.Types.Mixed,
                    testimonial: mongoose.Schema.Types.Mixed,
                    segment: mongoose.Schema.Types.Mixed,
                    hero: mongoose.Schema.Types.Mixed
                },

                // Email block templates
                blocks: [mongoose.Schema.Types.Mixed]
            },

            // Raw CSS Rules
            rules: {
                buttons: [mongoose.Schema.Types.Mixed],
                links: [mongoose.Schema.Types.Mixed],
                variables: mongoose.Schema.Types.Mixed,
                importantSelectors: [mongoose.Schema.Types.Mixed]
            },

            // CSS Metadata
            metadata: {
                scrapedFrom: [{ type: String }], // URLs where styles were scraped
                confidence: {
                    type: Number,
                    default: 0,
                    min: 0,
                    max: 1
                },
                version: { type: Number, default: 1 },
                lastUpdated: { type: Date, default: Date.now },
                manualOverrides: { type: Boolean, default: false }
            }
        },

        // Platform detection
        platform: {
            platform: String,
            confidence: String,
            js_confirmed: Boolean,
            indicators: [String]
        },
        
        // Additional dates
        scraped_at: Date,
        updated_at: Date,
        brand_settings_id: { type: String, index: true },

        // Metadata
        isActive: { type: Boolean, default: true },
        isDefault: { type: Boolean, default: false },
        lastUpdated: { type: Date, default: Date.now },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    },
)

// Indexes for better query performance
brandSettingsSchema.index({ store_id: 1 })
brandSettingsSchema.index({ store_public_id: 1 })
brandSettingsSchema.index({ brandName: 1 })
brandSettingsSchema.index({ slug: 1 })
brandSettingsSchema.index({ store_public_id: 1, slug: 1 }, { unique: true })
brandSettingsSchema.index({ isActive: 1 })
brandSettingsSchema.index({ lastUpdated: -1 })
brandSettingsSchema.index({ store_id: 1, isDefault: 1 })

// Pre-save middleware to update lastUpdated and generate slug
brandSettingsSchema.pre("save", async function (next) {
    this.lastUpdated = new Date()

    // Generate slug if brandName is provided and slug is not set
    if (this.name && !this.slug) {
        this.slug = await this.generateSlug(this.name)
    }

    // Ensure only one default brand per store
    if (this.isDefault) {
        await this.constructor.updateMany(
            {
                store_id: this.store_id,
                _id: { $ne: this._id },
                isDefault: true
            },
            { isDefault: false }
        );
    }

    // Set button background color to primary color if not set
    if (!this.buttonBackgroundColor && this.primaryColor?.[0]?.hex) {
        this.buttonBackgroundColor = this.primaryColor[0].hex;
    }

    next()
})

// Instance method to generate unique slug
brandSettingsSchema.methods.generateSlug = async function (brandName) {
    // Create a clean slug from the brand name
    const baseSlug = brandName
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
        .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens

    // Check if slug already exists for this store
    const existingBrand = await this.constructor.findOne({
        store_public_id: this.store_public_id,
        slug: baseSlug,
        _id: { $ne: this._id } // Exclude current brand if updating
    })

    if (existingBrand) {
        // If slug exists, find the next available number
        let counter = 1
        let finalSlug = `${baseSlug}-${counter}`

        while (await this.constructor.findOne({
            store_public_id: this.store_public_id,
            slug: finalSlug,
            _id: { $ne: this._id }
        })) {
            counter++
            finalSlug = `${baseSlug}-${counter}`
        }

        return finalSlug
    }

    return baseSlug
}

// Virtual for complete brand identity
brandSettingsSchema.virtual('isComplete').get(function () {
    return !!(
        this.brandName &&
        this.brandTagline &&
        this.missionStatement &&
        this.primaryColor?.length > 0 &&
        this.logo?.primary_logo_url &&
        this.targetAudienceAge?.length > 0 &&
        this.mainProductCategories?.length > 0
    );
});

// Method to get brand colors as CSS variables from css field
brandSettingsSchema.methods.getCssVariables = function () {
    const vars = {};

    if (!this.css) return vars;

    // Color variables
    if (this.css.colors) {
        if (this.css.colors.primary) vars['--brand-primary'] = this.css.colors.primary;
        if (this.css.colors.secondary) vars['--brand-secondary'] = this.css.colors.secondary;
        if (this.css.colors.accent) vars['--brand-accent'] = this.css.colors.accent;
        if (this.css.colors.success) vars['--brand-success'] = this.css.colors.success;
        if (this.css.colors.warning) vars['--brand-warning'] = this.css.colors.warning;
        if (this.css.colors.error) vars['--brand-error'] = this.css.colors.error;
        if (this.css.colors.info) vars['--brand-info'] = this.css.colors.info;

        // Text colors
        if (this.css.colors.text?.primary) vars['--text-primary'] = this.css.colors.text.primary;
        if (this.css.colors.text?.secondary) vars['--text-secondary'] = this.css.colors.text.secondary;
        if (this.css.colors.text?.link) vars['--text-link'] = this.css.colors.text.link;

        // Background colors
        if (this.css.colors.background?.light) vars['--bg-light'] = this.css.colors.background.light;
        if (this.css.colors.background?.dark) vars['--bg-dark'] = this.css.colors.background.dark;
    }

    // Typography variables
    if (this.css.typography?.fontFamilies) {
        if (this.css.typography.fontFamilies.primary) {
            vars['--font-primary'] = this.css.typography.fontFamilies.primary;
        }
        if (this.css.typography.fontFamilies.heading) {
            vars['--font-heading'] = this.css.typography.fontFamilies.heading;
        }
        if (this.css.typography.fontFamilies.body) {
            vars['--font-body'] = this.css.typography.fontFamilies.body;
        }
    }

    // Spacing variables
    if (this.css.spacing) {
        Object.keys(this.css.spacing).forEach((key) => {
            if (typeof this.css.spacing[key] === 'number') {
                vars[`--spacing-${key}`] = `${this.css.spacing[key]}px`;
            }
        });
    }

    // Border radius variables
    if (this.css.borderRadius) {
        Object.keys(this.css.borderRadius).forEach((key) => {
            if (typeof this.css.borderRadius[key] === 'number') {
                vars[`--radius-${key}`] = `${this.css.borderRadius[key]}px`;
            }
        });
    }

    return vars;
};

// Method to get font family with fallbacks from css field
brandSettingsSchema.methods.getFontFamily = function () {
    const fonts = [];

    if (this.css?.typography?.fontFamilies?.primary) {
        fonts.push(`'${this.css.typography.fontFamilies.primary}'`);
    }

    fonts.push('Arial', 'sans-serif');
    return fonts.join(', ');
};

// Method to get email styles from css field
brandSettingsSchema.methods.getEmailStyles = function () {
    const css = this.css || {};

    return {
        body: {
            backgroundColor: css.email?.backgroundColor || css.colors?.background?.light || '#f7f7f7',
            fontFamily: css.email?.fontFamily || css.typography?.fontFamilies?.primary || 'Arial, sans-serif',
            fontSize: `${css.email?.fontSize || 16}px`,
            lineHeight: css.email?.lineHeight || 1.6,
            color: css.email?.textColor || css.colors?.text?.primary || '#000000',
            margin: 0,
            padding: 0
        },
        container: {
            maxWidth: `${css.email?.maxWidth || 600}px`,
            backgroundColor: css.email?.contentBackgroundColor || '#ffffff',
            margin: '0 auto',
            padding: `${css.email?.padding || 20}px`
        },
        heading: {
            h1: {
                fontSize: `${css.components?.heading?.h1?.fontSize || css.typography?.fontSize?.['3xl'] || 32}px`,
                fontWeight: css.components?.heading?.h1?.fontWeight || css.typography?.fontWeight?.bold || 700,
                color: css.components?.heading?.h1?.color || css.colors?.text?.primary || '#000000',
                lineHeight: css.components?.heading?.h1?.lineHeight || css.typography?.lineHeight?.tight || 1.2,
                margin: '0 0 16px 0'
            },
            h2: {
                fontSize: `${css.components?.heading?.h2?.fontSize || css.typography?.fontSize?.['2xl'] || 28}px`,
                fontWeight: css.components?.heading?.h2?.fontWeight || css.typography?.fontWeight?.bold || 700,
                color: css.components?.heading?.h2?.color || css.colors?.text?.primary || '#000000'
            }
        },
        button: {
            primary: {
                backgroundColor: css.components?.button?.primary?.backgroundColor || css.colors?.primary || '#000000',
                color: css.components?.button?.primary?.color || '#ffffff',
                padding: `${css.components?.button?.primary?.paddingY || 12}px ${css.components?.button?.primary?.paddingX || 24}px`,
                borderRadius: `${css.components?.button?.primary?.borderRadius || css.borderRadius?.base || 4}px`,
                textDecoration: 'none',
                display: 'inline-block',
                fontWeight: css.components?.button?.primary?.fontWeight || css.typography?.fontWeight?.medium || 500,
                fontSize: `${css.components?.button?.primary?.fontSize || 16}px`
            }
        },
        link: {
            color: css.email?.linkColor || css.colors?.text?.link || css.colors?.primary || '#000000',
            textDecoration: css.components?.link?.textDecoration || 'underline'
        }
    };
};

// Method to check if CSS styling is complete
brandSettingsSchema.methods.hasCssStyles = function () {
    return !!(
        this.css?.colors?.primary &&
        this.css?.typography?.fontFamilies?.primary &&
        this.css?.email?.maxWidth
    );
};

// Static method to find brand by slug and store
brandSettingsSchema.statics.findBySlugAndStore = function (slug, storeIdentifier) {
    const isPublicId = storeIdentifier?.length === 7;
    const query = { slug, isActive: true };

    if (isPublicId) {
        query.store_public_id = storeIdentifier;
    } else {
        query.store_id = storeIdentifier;
    }


    return this.findOne(query);
}

// Instance method to update specific fields
brandSettingsSchema.methods.updateFields = function (updates) {
    Object.keys(updates).forEach((key) => {
        this[key] = updates[key]
    })
    return this.save()
}

// Static method to find or create default brand for a store
brandSettingsSchema.statics.findOrCreateDefault = async function (store_id, userId) {
    let brand = await this.findOne({ store_id, isDefault: true });

    if (!brand) {
        // Get the store to retrieve its public_id
        const Store = mongoose.model('Store');
        const store = await Store.findById(store_id);

        if (!store) {
            throw new Error('Store not found');
        }

        brand = await this.create({
            store_id,
            store_public_id: store.public_id, // Required for slug generation
            brandName: 'Default Brand',
            name: 'Default Brand',
            isDefault: true,
            isActive: true,
            createdBy: userId,
            updatedBy: userId,
            // Set some default values
            primaryColor: [{ hex: '#000000', name: 'Black' }],
            // buttonBackgroundColor will be set to primary color by pre-save middleware
            buttonTextColor: '#FFFFFF',
            emailFallbackFont: 'Arial'
        });
    }

    return brand;
};

// ContractSeat-based permission methods
brandSettingsSchema.methods.canUserAccess = async function(userId, requiredLevel = 'view') {
    const ContractSeat = mongoose.model('ContractSeat');
    const Store = mongoose.model('Store');
    
    // Get the store this brand belongs to
    const store = await Store.findById(this.store_id);
    if (!store) return false;
    
    // Find user's seat for this store's contract
    const seat = await ContractSeat.findUserSeatForContract(userId, store.contract_id);
    if (!seat) return false;
    
    // Check if brand is restricted to specific seats
    if (this.access_control.restricted_to_seats.length > 0) {
        const seatAccess = this.access_control.restricted_to_seats.find(
            restriction => restriction.seat_id.toString() === seat._id.toString()
        );
        
        if (!seatAccess) return false;
        
        // Check permission level
        if (requiredLevel === 'edit' && seatAccess.permission_level === 'view') {
            return false;
        }
    }
    
    // Check if brand is locked and user has sufficient role level
    if (this.access_control.lock_level !== 'unlocked') {
        const Role = mongoose.model('Role');
        const userRole = await Role.findById(seat.default_role_id);
        
        // Only brand guardians and above can edit locked brands
        if (requiredLevel === 'edit' && userRole.level < 60) {
            return false;
        }
    }
    
    return true;
};

brandSettingsSchema.methods.inheritFromParent = async function() {
    if (!this.access_control.parent_brand_id) return;
    
    const parentBrand = await this.constructor.findById(this.access_control.parent_brand_id);
    if (!parentBrand) return;
    
    // Inherit core brand elements
    this.primaryColor = parentBrand.primaryColor;
    this.secondaryColors = parentBrand.secondaryColors;
    this.logo = parentBrand.logo;
    this.brandVoice = parentBrand.brandVoice;
    this.brandPersonality = parentBrand.brandPersonality;
    this.coreValues = parentBrand.coreValues;
    
    // Mark as inherited
    this.access_control.inherited_from_parent = true;
};

brandSettingsSchema.methods.lockBrand = function(lockLevel, lockedBy) {
    this.access_control.lock_level = lockLevel;
    this.access_control.locked_by = lockedBy;
    this.access_control.locked_at = new Date();
};

const BrandSettings = mongoose.models.BrandSettings || mongoose.model("BrandSettings", brandSettingsSchema)

export default BrandSettings