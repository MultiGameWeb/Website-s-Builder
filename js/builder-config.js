const builderConfig = {
  appName: "Website Builder",

  workflow: [
    {
      id: 1,
      key: "template",
      title: "Choose Template"
    },
    {
      id: 2,
      key: "features",
      title: "Choose Features"
    },
    {
      id: 3,
      key: "details",
      title: "Enter Details"
    },
    {
      id: 4,
      key: "preview",
      title: "Live Preview"
    },
    {
      id: 5,
      key: "payment",
      title: "Payment"
    },
    {
      id: 6,
      key: "setup",
      title: "Setup & Download"
    }
  ],

  payment: {
    mode: "mock",
    currency: "USD"
  },

  download: {
    enabled: true,
    format: "zip"
  },

  setupAssistance: {
    domain: true,
    onlinePayment: true,
    executiveMessage:
      "Our executive will contact you within 10 minutes to assist you with the setup."
  }
};

export default builderConfig;
