let path = require("path");

const CodeBlockFile = {
	SetupFunctionString: (content) =>
	{
		return `local setup = function()\n${content}end\n`;
	},
	FileFooter: (procedure_name) =>
	{
		return `return procedures.new('${procedure_name}', setup, false)\n`;
	},
	WriteFile: (file_path, block_path) =>
	{
		console.log(block_path)
		let file_headers = "";
		let file_contents = "";
		let fs = require('fs');
		for (let i = 0; i < block_path.length; ++i)
		{
			let block = block_path[i];

			for (let require of block.requirements)
			{
				if (!file_headers.includes(require))
				{
					file_headers += `${require}\n`;
				}
			}
			file_contents += `\t${block.content}\n`
		}

		var extension = path.extname(file_path);
		let procedure_name = path.basename(file_path, extension);
		let content = file_headers + CodeBlockFile.SetupFunctionString(file_contents) + CodeBlockFile.FileFooter(procedure_name);
		fs.writeFile(`${file_path}`, content, (err) =>
			{
				if (err) throw err;
			}
		);
	}
};

export default CodeBlockFile;