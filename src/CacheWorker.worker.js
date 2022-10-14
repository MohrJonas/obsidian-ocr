const jsonComplete = require("../node_modules/json-complete/dist/json_complete.esm.min");

self.onmessage = (message) => {
	self.postMessage(message.data.map((fileContent) => {
		return jsonComplete.default.decode(fileContent);
	}));
};
