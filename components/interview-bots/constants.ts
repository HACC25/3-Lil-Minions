// constants.ts
import { AvatarOption, EmotionOption } from "./lib/types";

// export const AVATAR_OPTIONS: AvatarOption[] = [
//   // Professional Look Avatars
//   {
//     value: "Alessandra_ProfessionalLook_public",
//     label: "Alessandra - Professional Female",
//   },
//   {
//     value: "Alessandra_ProfessionalLook2_public",
//     label: "Alessandra - Professional Look 2",
//   },
//   {
//     value: "Anthony_ProfessionalLook_public",
//     label: "Anthony - Professional Male",
//   },
//   {
//     value: "Anthony_ProfessionalLook2_public",
//     label: "Anthony - Professional Look 2",
//   },
//   {
//     value: "Katya_ProfessionalLook_public",
//     label: "Katya - Business Professional",
//   },
//   {
//     value: "Katya_ProfessionalLook2_public",
//     label: "Katya - Professional Look 2",
//   },
//   {
//     value: "Graham_ProfessionalLook_public",
//     label: "Graham - Senior Executive",
//   },
//   {
//     value: "Graham_ProfessionalLook2_public",
//     label: "Graham - Professional Look 2",
//   },
//   {
//     value: "Marianne_ProfessionalLook_public",
//     label: "Marianne - Corporate Leader",
//   },
//   {
//     value: "Marianne_ProfessionalLook2_public",
//     label: "Marianne - Professional Look 2",
//   },
//   {
//     value: "Pedro_ProfessionalLook_public",
//     label: "Pedro - Technical Professional",
//   },
//   {
//     value: "Pedro_ProfessionalLook2_public",
//     label: "Pedro - Professional Look 2",
//   },
//   {
//     value: "Thaddeus_ProfessionalLook_public",
//     label: "Thaddeus - Professional",
//   },
//   {
//     value: "Thaddeus_ProfessionalLook2_public",
//     label: "Thaddeus - Professional Look 2",
//   },
//   { value: "Amina_ProfessionalLook_public", label: "Amina - Professional" },
//   {
//     value: "Amina_ProfessionalLook2_public",
//     label: "Amina - Professional Look 2",
//   },
//   {
//     value: "Anastasia_ProfessionalLook_public",
//     label: "Anastasia - Professional",
//   },
//   {
//     value: "Anastasia_ProfessionalLook2_public",
//     label: "Anastasia - Professional Look 2",
//   },
//   { value: "Rika_ProfessionalLook_public", label: "Rika - Professional" },
//   {
//     value: "Rika_ProfessionalLook2_public",
//     label: "Rika - Professional Look 2",
//   },

//   // Casual Look Avatars
//   { value: "Alessandra_CasualLook_public", label: "Alessandra - Casual" },
//   { value: "Anthony_CasualLook_public", label: "Anthony - Casual" },
//   { value: "Katya_CasualLook_public", label: "Katya - Casual" },
//   { value: "Graham_CasualLook_public", label: "Graham - Casual" },
//   { value: "Marianne_CasualLook_public", label: "Marianne - Casual" },
//   { value: "Pedro_CasualLook_public", label: "Pedro - Casual" },
//   { value: "Thaddeus_CasualLook_public", label: "Thaddeus - Casual" },
//   { value: "Amina_CasualLook_public", label: "Amina - Casual" },
//   { value: "Anastasia_CasualLook_public", label: "Anastasia - Casual" },
//   { value: "Rika_CasualLook_public", label: "Rika - Casual" },

//   // Business Suits
//   { value: "Anastasia_Black_Suit_public", label: "Anastasia - Black Suit" },
//   { value: "Amina_Black_Suit_public", label: "Amina - Black Suit" },
//   { value: "Amina_Blue_Suit_public", label: "Amina - Blue Suit" },
//   { value: "Rika_Black_Suit_public", label: "Rika - Black Suit" },
//   { value: "Rika_Blue_Suit_public", label: "Rika - Blue Suit" },
//   { value: "Thaddeus_Black_Suit_public", label: "Thaddeus - Black Suit" },
//   { value: "Anthony_Black_Suit_public", label: "Anthony - Black Suit" },
//   { value: "Anthony_White_Suit_public", label: "Anthony - White Suit" },
//   { value: "Graham_Black_Suit_public", label: "Graham - Black Suit" },
//   { value: "Pedro_Black_Suit_public", label: "Pedro - Black Suit" },
//   { value: "Marianne_Black_Suit_public", label: "Marianne - Black Suit" },
//   { value: "Marianne_Red_Suit_public", label: "Marianne - Red Suit" },
//   { value: "Katya_Black_Suit_public", label: "Katya - Black Suit" },
//   { value: "Katya_Pink_Suit_public", label: "Katya - Pink Suit" },
//   { value: "Alessandra_Black_Suit_public", label: "Alessandra - Black Suit" },

//   // Sitting Positions
//   { value: "Anastasia_Chair_Sitting_public", label: "Anastasia - Sitting" },
//   { value: "Amina_Chair_Sitting_public", label: "Amina - Sitting" },
//   { value: "Rika_Chair_Sitting_public", label: "Rika - Sitting" },
//   { value: "Thaddeus_Chair_Sitting_public", label: "Thaddeus - Sitting" },
//   { value: "Anthony_Chair_Sitting_public", label: "Anthony - Sitting" },
//   { value: "Graham_Chair_Sitting_public", label: "Graham - Sitting" },
//   { value: "Pedro_Chair_Sitting_public", label: "Pedro - Sitting" },
//   { value: "Marianne_Chair_Sitting_public", label: "Marianne - Sitting" },
//   { value: "Katya_Chair_Sitting_public", label: "Katya - Sitting" },
//   { value: "Alessandra_Chair_Sitting_public", label: "Alessandra - Sitting" },

//   // Casual Wear
//   { value: "Thaddeus_Black_Shirt_public", label: "Thaddeus - Black Shirt" },
//   { value: "Graham_Black_Shirt_public", label: "Graham - Black Shirt" },
//   { value: "Pedro_Blue_Shirt_public", label: "Pedro - Blue Shirt" },
//   { value: "Anastasia_Grey_Shirt_public", label: "Anastasia - Grey Shirt" },
//   {
//     value: "Alessandra_Grey_Sweater_public",
//     label: "Alessandra - Grey Sweater",
//   },

//   // Specialized Roles
//   { value: "June_HR_public", label: "June - HR Manager" },
//   { value: "SilasHR_public", label: "Silas - HR Professional" },
//   {
//     value: "Silas_CustomerSupport_public",
//     label: "Silas - Customer Support",
//   },
//   { value: "Judy_Teacher_Sitting_public", label: "Judy - Teacher (Sitting)" },
//   {
//     value: "Judy_Teacher_Sitting2_public",
//     label: "Judy - Teacher (Sitting 2)",
//   },
//   {
//     value: "Judy_Teacher_Standing_public",
//     label: "Judy - Teacher (Standing)",
//   },
//   { value: "Dexter_Lawyer_Sitting_public", label: "Dexter - Lawyer" },
//   { value: "Judy_Lawyer_Sitting2_public", label: "Judy - Lawyer" },
//   { value: "Bryan_IT_Sitting_public", label: "Bryan - IT Specialist" },
//   { value: "Elenora_IT_Sitting_public", label: "Elenora - IT Professional" },

//   // Medical Professionals
//   { value: "Ann_Doctor_Standing2_public", label: "Ann - Doctor (Standing)" },
//   { value: "Ann_Doctor_Sitting_public", label: "Ann - Doctor (Sitting)" },
//   {
//     value: "Dexter_Doctor_Standing2_public",
//     label: "Dexter - Doctor (Standing)",
//   },
//   {
//     value: "Dexter_Doctor_Sitting2_public",
//     label: "Dexter - Doctor (Sitting)",
//   },
//   {
//     value: "Judy_Doctor_Standing2_public",
//     label: "Judy - Doctor (Standing)",
//   },
//   { value: "Judy_Doctor_Sitting2_public", label: "Judy - Doctor (Sitting)" },

//   // Therapists & Coaches
//   { value: "Ann_Therapist_public", label: "Ann - Therapist" },
//   { value: "Shawn_Therapist_public", label: "Shawn - Therapist" },
//   { value: "Bryan_FitnessCoach_public", label: "Bryan - Fitness Coach" },
//   { value: "Elenora_FitnessCoach_public", label: "Elenora - Fitness Coach" },
//   {
//     value: "Elenora_FitnessCoach2_public",
//     label: "Elenora - Fitness Coach 2",
//   },

//   // Other
//   { value: "Wayne_20240711", label: "Wayne - Professional" },
//   { value: "Santa_Fireplace_Front_public", label: "Santa - Holiday Special" },
// ];

// constants.ts (Optimized for 16:9 aspect ratio + HR + Casual Avatars)

export const AVATAR_OPTIONS: AvatarOption[] = [
  // BUSINESS PROFESSIONALS - SITTING
  {
    value: "Anastasia_Chair_Sitting_public",
    label: "Anastasia - Business (Sitting)",
  },
  {
    value: "Thaddeus_Chair_Sitting_public",
    label: "Thaddeus - Business (Sitting)",
  },
  { value: "Katya_Chair_Sitting_public", label: "Katya - Business (Sitting)" },
  {
    value: "Graham_Chair_Sitting_public",
    label: "Graham - Business (Sitting)",
  },
  {
    value: "Alessandra_Chair_Sitting_public",
    label: "Alessandra - Business (Sitting)",
  },
  {
    value: "Anthony_Chair_Sitting_public",
    label: "Anthony - Business (Sitting)",
  },
  { value: "Pedro_Chair_Sitting_public", label: "Pedro - Business (Sitting)" },
  {
    value: "Marianne_Chair_Sitting_public",
    label: "Marianne - Business (Sitting)",
  },
  { value: "Rika_Chair_Sitting_public", label: "Rika - Business (Sitting)" },
  { value: "Amina_Chair_Sitting_public", label: "Amina - Business (Sitting)" },
  { value: "Wayne_20240711", label: "Wayne - Casual Business" },

  // HR & RECRUITMENT SPECIALISTS
  { value: "June_HR_public", label: "June - HR Manager" },
  { value: "SilasHR_public", label: "Silas - HR Professional" },
  { value: "Judy_Teacher_Sitting_public", label: "Judy - HR Specialist" },

  // MEDICAL PROFESSIONALS
  { value: "Ann_Doctor_Sitting_public", label: "Ann - Doctor (Sitting)" },
  { value: "Ann_Doctor_Standing2_public", label: "Ann - Doctor (Standing)" },
  {
    value: "Dexter_Doctor_Sitting2_public",
    label: "Dexter - Doctor (Sitting)",
  },
  {
    value: "Dexter_Doctor_Standing2_public",
    label: "Dexter - Doctor (Standing)",
  },
  { value: "Judy_Doctor_Sitting2_public", label: "Judy - Doctor (Sitting)" },
  { value: "Judy_Doctor_Standing2_public", label: "Judy - Doctor (Standing)" },

  // HEALTHCARE & WELLNESS
  { value: "Ann_Therapist_public", label: "Ann - Therapist" },
  { value: "Shawn_Therapist_public", label: "Shawn - Therapist" },
  { value: "Bryan_FitnessCoach_public", label: "Bryan - Fitness Coach" },
  { value: "Elenora_FitnessCoach_public", label: "Elenora - Fitness Coach" },
  { value: "Elenora_FitnessCoach2_public", label: "Elenora - Fitness Coach 2" },

  // TECHNOLOGY & IT
  { value: "Silas_CustomerSupport_public", label: "Silas - IT Support" },
  { value: "Bryan_IT_Sitting_public", label: "Bryan - IT Specialist" },
  { value: "Elenora_IT_Sitting_public", label: "Elenora - IT Professional" },

  // LEGAL & EDUCATION
  { value: "Judy_Lawyer_Sitting2_public", label: "Judy - Lawyer" },
  { value: "Dexter_Lawyer_Sitting_public", label: "Dexter - Lawyer" },
  { value: "Judy_Teacher_Sitting2_public", label: "Judy - Teacher (Sitting)" },
  { value: "Judy_Teacher_Standing_public", label: "Judy - Teacher (Standing)" },
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
