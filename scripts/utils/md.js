const fs = require('fs');
const path = require('path');

function getAllMdFiles(dir, options = {}) {
  const { ignoreFileNames = [] } = options;
  let fileList = [];
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      fileList = [...fileList, ...getAllMdFiles(fullPath, options)];
      return;
    }

    if (!file.endsWith('.md')) {
      return;
    }

    if (ignoreFileNames.includes(file)) {
      return;
    }

    fileList.push(fullPath);
  });

  return fileList;
}

module.exports = {
  getAllMdFiles,
};
