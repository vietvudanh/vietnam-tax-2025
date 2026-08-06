const fs = require('fs');
const path = require('path');

const testDir = path.join(process.cwd(), 'test_requests');
console.log(testDir);
const files = fs.readdirSync(testDir).filter(f => f.endsWith('.har'));

const testCases = [];

files.forEach(file => {
  const content = fs.readFileSync(path.join(testDir, file), 'utf8');
  try {
    const har = JSON.parse(content);
    if (har.log && har.log.entries) {
      const entry = har.log.entries.find(e => e.request.url.includes('ajax-gross-to-net') && e.request.method === 'POST');
      if (entry) {
        const params = entry.request.postData.params;
        const responseText = entry.response.content.text;
        const responseJson = JSON.parse(responseText);

        const input = {};
        params.forEach(p => input[p.name] = p.value);

        testCases.push({
          file: file,
          input: input,
          expected: responseJson.result
        });
      }
    }
  } catch (e) {
    console.error(`Error parsing ${file}:`, e.message);
  }
});

console.log(JSON.stringify(testCases, null, 2));
