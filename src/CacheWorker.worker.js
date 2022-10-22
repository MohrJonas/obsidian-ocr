// eslint-disable-next-line @typescript-eslint/no-var-requires
const jsonComplete = require("../node_modules/json-complete/dist/json_complete.esm.min");

self.onmessage = (message) => {
	self.postMessage(jsonComplete.default.decode(message.data));
};
