import DataStore from "DataStore";
const Path = require("path");

const data_store = new DataStore(
{
    configName: 'user-preferences',
    defaults: null
});

const CodeBlockFile = {
	WriteFile: (file_path, content) =>
	{
		let fs = require('fs');
		fs.writeFile(`${file_path}`, content, (err) =>
			{
				if (err) throw err;
			}
		);
	}
};

export default CodeBlockFile;