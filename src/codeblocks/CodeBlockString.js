function RunPathCode(block_args)
{
	let block = {
		requirements: ["local common = tasks.common.functions"],
		content: ""
	}

	if (block_args.length < 4)
	{
		console.error("You need 4 arguments for RunPath");
	}

	if (block_args[1])
	{
		block_args[1] = `L{${block_args[1]}}`;
	}

	block.content = `coordinator.push.poi(common.create_path_poi('${block_args[0]}', ${block_args[1]}, ${block_args[2]}, '${block_args[3]}'), 1, "Run path: ${block_args[0]}")`
	return block;
}

function InteractCode(block_args)
{
	let block = {
		requirements: ["local common = tasks.common.functions"],
		content: ""
	}

	if (block_args.length < 3)
	{
		console.error("You need 3 arguments for Interact");
	}

	if (block_args[1])
	{
		block_args[1] = `L{${block_args[1]}}`;
	}

	block.content = `coordinator.push.poi(common.create_interaction_poi('${block_args[0]}', ${block_args[1]}, ${block_args[2]}`;
	let responses = [];
	block.content += `, {`
	if (block_args.length > 4 && block_args[3] === "KEYVALUES")
	{
		let resp_pairs = [];
		for (let i = 4; i < block_args.length; ++i)
		{
			let key = block_args[i];
			let value = block_args[i+1];
			if (key !== "KEYVALUES" && value !== undefined && value !== false)
			{
				resp_pairs.push({key: key, value: value});
			}

			if (key === "KEYVALUES")
			{
				responses.push(resp_pairs);
				resp_pairs = [];
			}
			else
			{
				++i; // Incremement to the next pair
			}
		}
		if (resp_pairs.length > 0)
		{
			responses.push(resp_pairs); // Push the last response if it exists
		}
	}
	if (responses.length === 0)
	{
		block.content += `}`
	}
	console.log(responses);

	for (let i = 0; i < responses.length; ++i)
	{
		if (i > 0)
		{
			block.content += `, {`
		}
		for (let j = 0; j < responses[i].length; ++j)
		{
			let resp_pair = responses[i][j];
			block.content += `['${resp_pair.key}'] = ${resp_pair.value}`
			
			if (j < responses[i].length - 1)
			{
				block.content += `, `;
			}
		}
		block.content += `}`
	}

	block.content += `), 1, "Interact with: ${block_args[0]}")`
	return block;
}

export default function GetCodeBlock(type, block_args)
{
	switch (type)
	{
	case "Run Path":
	{
		return RunPathCode(block_args);
		break;
	}
	case "Interact":
	{
		return InteractCode(block_args);
		break;
	}
	case "TestBlock":
	{
		break;
	}
	default:
		console.error("Unknown Block Type: " + type);
		break;
	}
}

