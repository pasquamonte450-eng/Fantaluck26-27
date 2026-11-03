import { EMAIL_DOMAIN } from "../config/constants";

export const toAuthEmail = (username) => {
  const value = username.trim().toLowerCase();

  return value.includes("@") ? value : `${value}@${EMAIL_DOMAIN}`;
};
