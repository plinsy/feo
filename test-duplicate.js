const removeDuplicateWords = (transcript) => {
  if (!transcript || !transcript.trim()) return '';
  const words = transcript.trim().split(/\s+/);
  const filteredWords = [];
  for (let i = 0; i < words.length; i++) {
    const currentWord = words[i].toLowerCase().replace(/[^\w]/g, '');
    const previousWord = i > 0 ? words[i - 1].toLowerCase().replace(/[^\w]/g, '') : null;
    if (currentWord !== previousWord) {
      filteredWords.push(words[i]);
    }
  }
  return filteredWords.join(' ');
};

console.log('Test 1:', removeDuplicateWords('Hello Hello Hello Hello Hello Hello Hello How you doing Hello How you doing Baby'));
console.log('Test 2:', removeDuplicateWords('hello, hello world!'));
console.log('Test 3:', removeDuplicateWords('   '));
console.log('Test 4:', removeDuplicateWords(''));
