import raw from "../../../public/landing/landing.json";
import type { TransitionName } from "@/content/catalog";

export type LandingGown = {
  key: string;
  slug: string;
  name: string;
  tagline: string;
  transition: TransitionName;
  image: string;
  depth: string;
  poster: string;
};

export type LandingConfig = {
  generated: string;
  imageSize: { w: number; h: number };
  eyes: { u: number; v: number }[];
  eyeSize: { rx: number; ry: number };
  irisRadius: number;
  eyeTravel: number;
  head: { u: number; v: number; radius: number };
  eyeOverlay?: boolean;
  background: string;
  groom: string;
  poster: string;
  gowns: LandingGown[];
};

export const landing = raw as LandingConfig;

export const TRANSITION_DURATION = 1.6;
export const AUTOPLAY_MS = 6500;
