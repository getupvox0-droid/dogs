// Korean particles depend on whether the last syllable has a final consonant (받침).
function finalConsonant(word) {
  const c =
    String(word)
      .trim()
      .charCodeAt(String(word).trim().length - 1) - 0xac00;
  return c >= 0 && c <= 11171 ? c % 28 : 0;
}
// Appends the right particle: josa('보리', '은', '는') → '보리는', josa('밤톨', '은', '는') → '밤톨은'.
export function josa(word, withFinal, withoutFinal) {
  return word + (finalConsonant(word) ? withFinal : withoutFinal);
}
// 으로/로: a final ㄹ takes 로 like a vowel (쇠약으로, 악화로, 길로).
export function euro(word) {
  const f = finalConsonant(word);
  return word + (f && f !== 8 ? '으로' : '로');
}
