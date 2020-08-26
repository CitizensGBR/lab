export const query = (str, queryStr, score) => {
  const index = str === queryStr ? 0
  : (!queryStr || !str) && -1
    || str.toLowerCase().indexOf(queryStr.toLowerCase());
  return score
  ? (index < 0
    ? 0
    : (str.length - index + queryStr.length) / (2 * str.length))
  : index; 
};

export const score = (str, queryStr, hasAllWords) => {
  const strLower = str.toLowerCase();
  const strWords = strLower.split(/\W+/);
  const queryLower = queryStr.toLowerCase();
  const queryWords = queryLower.split(/\W+/);

  return query(str, queryStr, true) +
  queryWords.reduce((total, queryWord, i) => {
    // exclude previously non-matching queries
    if (hasAllWords && i && !total) return 0;
    // score the query word against the string
    const wordScore = strWords.reduce((subtotal, strWord, ii) => {
      return subtotal || query(strWord, queryWord, true) / (ii + 1);
    }, 0) / (i + 1);
    // exlude non-matching queries if all words are required
    return hasAllWords && i && !wordScore
    ? 0
    // otherwise sum scores
    : total + wordScore;
  }, 0);
};

export default { query, score };