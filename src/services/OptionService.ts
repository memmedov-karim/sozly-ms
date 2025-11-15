import Option from "../models/Option";
import { DatabaseConfig } from "../config/database";

export async function getUserPreferencesOptions(appLang: string) {
  const redisClient = DatabaseConfig.getInstance().getRedisClient();
  var options;
  if (redisClient && redisClient.isOpen) {
    options = await redisClient.get('options');
    if (options) {
      return JSON.parse(options);
    }
    options = await getOptionsFromDatabase(appLang);
    await redisClient.set('options', JSON.stringify(options), { EX: 60 * 60 * 24 }); 
    return options;
  }

  return await getOptionsFromDatabase(appLang);

}

async function getOptionsFromDatabase(appLang: string) {
  const allOptions = await Option.find({
    type: { $in: ['languages', 'topics', 'genders'] }
  }).lean();

  const grouped = allOptions.reduce((acc, option) => {
    if (!acc[option.type]) {
      acc[option.type] = [];
    }
    acc[option.type].push({
      value: option.value,
      name: option.name[appLang]
    });
    return acc;
  }, {} as Record<string, Array<{ value: string; name: string }>>);

  return {
    languages: grouped.languages || [],
    topics: grouped.topics || [],
    genders: grouped.genders?.filter(gender => gender.value !== 'any') || [],
    allGenders: grouped.genders || [],
  };
}