// constants.ts
import { AvatarOption, EmotionOption } from "./types";

export const AVATAR_OPTIONS: AvatarOption[] = [
  {
    value: "Judy_Teacher_Sitting2_public",
    label: "Judy",
    imageUrl: "/avatars/Avatar_Judy.png",
    voiceId: "7ffb69e578d4492587493c26ebcabc31",
  },
  {
    value: "Katya_Chair_Sitting_public",
    label: "Katya",
    imageUrl: "/avatars/Avatar_Katya.png",
    voiceId: "a8afd8132bdb41a29cfba4944ac9c7ec",
  },
  {
    value: "Graham_Chair_Sitting_public",
    label: "Graham",
    imageUrl: "/avatars/Avatar_Graham.png",
    voiceId: "b6b264e13f6942b6843bbdaf2cf423c4",
  },
  {
    value: "Alessandra_Chair_Sitting_public",
    label: "Alessandra",
    imageUrl: "/avatars/Avatar_Alessandra.png",
    voiceId: "576ee47831a4479cb4c5a25065214905",
  },
  {
    value: "Anthony_Chair_Sitting_public",
    label: "Anthony",
    imageUrl: "/avatars/Avatar_Anthony.png",
    voiceId: "6f94c8b2a6784a1d92ffbe0339138f31",
  },
  {
    value: "June_HR_public",
    label: "June",
    imageUrl: "/avatars/Avatar_June.png",
    voiceId: "748d08eb00634e03b17c524d1e957fc6",
  },
  {
    value: "Pedro_Chair_Sitting_public",
    label: "Pedro",
    imageUrl: "/avatars/Avatar_Pedro.png",
    voiceId: "fbc81b179407457688c45c0f250ec3ce",
  },
  {
    value: "Marianne_Chair_Sitting_public",
    label: "Marianne",
    imageUrl: "/avatars/Avatar_Marianne.png",
    voiceId: "6664c469256949f19aab13c83c6005a1",
  },
  {
    value: "Ann_Doctor_Sitting_public",
    label: "Ann",
    imageUrl: "/avatars/Avatar_Ann.png",
    voiceId: "6eafa43fdc16437b8f5abe512cc2b3cf",
  },
  {
    value: "SilasHR_public",
    label: "Silas",
    imageUrl: "/avatars/Avatar_Silas.png",
    voiceId: "5c837919d188407cac1ea65a8889e496",
  },
];

export const EMOTION_OPTIONS: EmotionOption[] = [
  { value: "Excited", label: "Excited - Enthusiastic & Energetic" },
  { value: "Friendly", label: "Friendly - Warm & Welcoming" },
  { value: "Serious", label: "Serious - Professional & Formal" },
  { value: "Soothing", label: "Soothing - Calm & Reassuring" },
  { value: "Broadcaster", label: "Broadcaster - Clear & Authoritative" },
];

export const INTERVIEW_TYPES = [
  "General",
  "Technical",
  "Behavioral",
  "Leadership",
  "Sales",
  "Customer Service",
  "Engineering",
  "Design",
  "Marketing",
  "Product Management",
  "Data Science",
  "Finance",
  "HR",
  "Operations",
];

export const COMPANY_INDUSTRIES = [
  "Technology",
  "Healthcare",
  "Finance",
  "Education",
  "Manufacturing",
  "Retail",
  "Construction",
  "Transportation",
  "Energy",
  "Agriculture",
  "Media & Entertainment",
  "Real Estate",
  "Hospitality",
  "Consulting",
  "Non-Profit",
  "Government",
  "Legal",
  "Telecommunications",
  "Automotive",
  "Aerospace",
  "Biotechnology",
  "Pharmaceuticals",
  "Food & Beverage",
  "Fashion",
  "Sports & Recreation",
  "Other",
];
