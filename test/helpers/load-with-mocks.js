const Module = require('module');
const path = require('path');

function loadWithMocks(modulePath, mocks) {
  const originalLoad = Module._load;
  const resolvedPath = path.resolve(process.cwd(), modulePath);

  delete require.cache[resolvedPath];

  Module._load = function patchedLoad(request, parent, isMain) {
    if (Object.prototype.hasOwnProperty.call(mocks, request)) {
      return mocks[request];
    }
    return originalLoad.call(this, request, parent, isMain);
  };

  try {
    return require(resolvedPath);
  } finally {
    Module._load = originalLoad;
  }
}

module.exports = { loadWithMocks };
