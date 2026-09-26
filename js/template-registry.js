import restaurantTemplate from "../templates/restaurant/template.js";
import astrologyTemplate from "../templates/astrology/template.js";
import bookstoreTemplate from "../templates/bookstore/template.js";

const templateRegistry = {
  restaurant: restaurantTemplate,
  astrology: astrologyTemplate,
  bookstore: bookstoreTemplate
};

export function getTemplate(templateId) {
  return templateRegistry[templateId] || null;
}

export function getAllTemplates() {
  return Object.values(templateRegistry);
}

export function getTemplateIds() {
  return Object.keys(templateRegistry);
}

export default templateRegistry;
