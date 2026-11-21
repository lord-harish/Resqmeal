export const ROUTES = {
  login: "/login",
  register: "/register",
  forgotPassword: "/forgot-password",
  home: "/home",
  explore: "/explore",
  chats: "/chats",
  profile: "/profile",
} as const;

export const APP_HOME = "/home";

export const AUTH_ROUTES: readonly string[] = [
  ROUTES.login,
  ROUTES.register,
  ROUTES.forgotPassword,
];

export const APP_ROUTES: readonly string[] = [
  ROUTES.home,
  ROUTES.explore,
  ROUTES.chats,
  ROUTES.profile,
];
