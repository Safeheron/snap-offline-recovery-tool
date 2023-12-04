import { wordlists } from "bip39";

export const checkMnemonic = (mnemonicArr: string[]): string => {
  const allWordListsEnglish = wordlists.english;

  const illegalList = mnemonicArr.filter(
    (v) => !allWordListsEnglish.includes(v)
  );

  if (illegalList.length > 0) {
    return "Wrong word. Please recheck.";
  }

  if (mnemonicArr.length !== 24) {
    return "24 recovery words shall be formatted correctly.";
  }

  return "";
};
