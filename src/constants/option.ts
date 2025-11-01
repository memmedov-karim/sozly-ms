import { OptionType } from '../types';

// TODO: Update translations

export const LANGUAGES: OptionType[] = [
  {
    value: 'az',
    name: {
      az: 'Azərbaycan dili',
      ru: 'Азербайджанский язык',
      en: 'Azerbaijani',
    },
  },
  {
    value: 'en',
    name: {
      az: 'İngilis dili',
      ru: 'Азербайджанский язык',
      en: 'English',
    },
  },
];

export const TOPICS: OptionType[] = [
  {
    value: 'tech',
    name: {
      az: 'Texnologiya',
      ru: 'Технология',
      en: 'Technology',
    },
  },
  {
    value: 'flirt',
    name: {
      az: 'Flört',
      ru: 'Флирт',
      en: 'Flirting',
    },
  },
  {
    value: 'love',
    name: {
      az: 'Sevgi',
      ru: 'Любовь',
      en: 'Love',
    },
  },
];

export const GENDERS: OptionType[] = [
  {
    value: 'male',
    name: {
      az: 'Kişi',
      ru: 'Парень',
      en: 'Male',
    },
  },
  {
    value: 'female',
    name: {
      az: 'Qadın',
      ru: 'Девушка',
      en: 'Female',
    },
  },
];

export const ALL_GENDERS: OptionType[] = [
  ...GENDERS,
  {
    value: 'any',
    name: {
      az: 'Ferq etməz',
      ru: 'Не важно',
      en: 'Any',
    },
  },
];

export enum AppLang {
  az,
  ru,
  en,
}
