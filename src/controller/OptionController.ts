import { NextFunction, Request, Response } from 'express';
import { getUserPreferencesOptions } from '../services/client/OptionService';

const DEFAULT_LANG = 'az';

const SUPPORTED_LANGS = ['az', 'ru', 'en'];

export async function getUserPreferences(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const appLang = (req.headers['app-lang'] as string) || DEFAULT_LANG;
    const lang = SUPPORTED_LANGS.includes(appLang) ? appLang : DEFAULT_LANG;
    console.log('Requested language:', lang);
    const options = await getUserPreferencesOptions(lang);
    res.status(200).json(options);
  } catch (error) {
    next(error);
  }
}
