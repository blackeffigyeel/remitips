// Define a type for restrictions
type PlatformRestrictions = {
  disabledCurrencies: string[];
  disabledCountries: string[];
};

export const PLATFORM_CONFIG = {
  enabledPlatforms: {
    Wise: true,
    Remitly: true,
    MoneyGram: false,  // Disabled due to 403 errors
    WorldRemit: true,
    Airwallex: true,
    Revolut: false,    // Disabled due to NGN restriction
    XE: true,
    Ria: false,        // Disabled due to 500 errors
    Xoom: false,       // Disabled due to 404 errors
  },
  
  restrictions: {
    Revolut: {
      disabledCurrencies: ['NGN', 'GHS', 'KES'],
      disabledCountries: ['NG', 'GH', 'KE']
    },
    MoneyGram: {
      disabledCurrencies: [],
      disabledCountries: []
    },
    Wise: { disabledCurrencies: [], disabledCountries: [] },
    Remitly: { disabledCurrencies: [], disabledCountries: [] },
    WorldRemit: { disabledCurrencies: [], disabledCountries: [] },
    Airwallex: { disabledCurrencies: [], disabledCountries: [] },
    XE: { disabledCurrencies: [], disabledCountries: [] },
    Ria: { disabledCurrencies: [], disabledCountries: [] },
    Xoom: { disabledCurrencies: [], disabledCountries: [] },
  } as Record<string, PlatformRestrictions>
} as const;

export type PlatformName = keyof typeof PLATFORM_CONFIG.enabledPlatforms;