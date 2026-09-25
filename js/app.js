import templateRegistry from "./template-registry.js";
import builderConfig from "./builder-config.js";

const BuilderApp = {
  config: builderConfig,
  templates: templateRegistry,
  currentTemplate: null,

  selectTemplate(templateId) {
    const template = this.templates[templateId];

    if (!template) {
      console.error(`Template not found: ${templateId}`);
      return null;
    }

    this.currentTemplate = template;

    document.documentElement.dataset.template = template.id;

    window.dispatchEvent(
      new CustomEvent("builder:template-selected", {
        detail: template
      })
    );

    return template;
  },

  getCurrentTemplate() {
    return this.currentTemplate;
  },

  getFeatures() {
    return this.currentTemplate?.features || {};
  },

  getWorkflow() {
    return this.config.workflow;
  },

  reset() {
    this.currentTemplate = null;
    delete document.documentElement.dataset.template;
  }
};

window.BuilderApp = BuilderApp;

window.addEventListener("DOMContentLoaded", () => {
  console.log(
    "Website Builder loaded.",
    BuilderApp.getWorkflow().length,
    "steps available."
  );

  console.log(
    "Registered templates:",
    Object.keys(BuilderApp.templates)
  );
});
