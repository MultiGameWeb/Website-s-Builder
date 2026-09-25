const astrologyTemplate = {
  id: "astrology",
  name: "AstroCosmos 3D",
  version: "1.0.0",

  description:
    "Premium Vedic Astrology + Cosmic + 3D reusable website template.",

  features: {
    hero3DSolarSystem: true,
    topNavigation: true,
    liveInformationBar: true,
    englishTeluguLanguage: true,
    darkLightMode: true,

    aboutAstroCosmos: true,
    vedicAstrologyServices: true,
    rashiPhalalu: true,
    rashiAdminManagement: true,

    freeKundaliGenerator: true,
    zodiacWheel: true,
    moonPhaseWidget: true,
    shubhaMuhurtham: true,
    vedicCalendar: true,

    gallery: true,
    servicesClientsGalleryPanel: true,
    contactLocation: true,
    quickAstroGuide: true,

    cosmicBackgroundEffects: true,
    scrollReveal: true,
    pwaReady: true,
    mobileResponsive: true
  },

  content: {
    servicesCount: 8,
    rashiCount: 12,
    horoscopePeriods: [
      "daily",
      "monthly",
      "yearly"
    ],
    languages: [
      "en",
      "te"
    ]
  },

  settings: {
    solarSystemHeroOnly: true,
    enableHero3DControls: true,
    pauseHero3DOnScroll: true,
    enableReducedMotionSupport: true,
    useLocalMoonPhaseCalculation: true,
    useLocalAstroGuideResponses: true,
    useInlineVedicCalendar: true
  }
};

export default astrologyTemplate;
