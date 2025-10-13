import  Option from "../models/Option";

export async function getUserPreferencesOptions(appLang: string) {

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