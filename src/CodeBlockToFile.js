import DataStore from "DataStore";
const Path = require("path");

const data_store = new DataStore(
{
    configName: 'user-preferences',
    defaults: null
});

function WriteFile(file_name, content)
{
	let procedure_path = data_store.Get('procedurePath');
	let normalized_path = Path.normalize(procedure_path)

	let fs = require('fs');
	fs.writeFile(`${normalized_path}/${file_name}.lua`, content, (err) =>
		{
			if (err) throw err;
		}
	);
}