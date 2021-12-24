function RunPathCode(block_args)
{
	let block = {
		requirements: ["local common = tasks.common.functions"],
		content: ""
	}

	block.content = `coordinator.push.poi(common.create_path_poi(${block_args[0]}, ${block_args[1]}, ${block_args[2]}, ${block_args[3]}))`
	return block;
}

export default function GetCodeBlock(type, block_args)
{
	switch (type)
	{
	case "Run Path":
	{
		RunPathCode(block_args);
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

